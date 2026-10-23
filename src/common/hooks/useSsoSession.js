import { useCallback, useEffect, useRef } from "react";
import { AppState, Linking } from "react-native";
import { useDispatch } from "react-redux";
import { onUnauthorized } from "../../services/khalisRequest";
import { setAuthSession, clearAuthSession } from "../actions";
import { trackSsoEvent } from "../firebase/analytics";
import STRINGS from "../localization";
import { applyAccountScope } from "../sso/accountScope";
import { decodeJwtPayload, isTokenValid, toSessionUser } from "../sso/jwt";
import { consumeLoginRedirect, forgetConsumedLogin } from "../sso/khalisSso";
import { registerSessionHandlers } from "../sso/session";
import { readToken, clearToken, ensureInstallScopedToken } from "../sso/tokenStore";
import { showInfoToast } from "../toast";

// A 7-day token is far beyond setTimeout's useful range, and JS timers do not
// survive backgrounding anyway. Only arm a timer when expiry is close enough to
// land inside a plausible single session; the AppState check is the real
// backstop for everything longer.
const EXPIRY_TIMER_CEILING_MS = 24 * 60 * 60 * 1000;

/**
 * Owns the Khalis SSO session for the whole app:
 *   - restores it from the Keychain on launch (no network — works offline),
 *   - catches the sundargutka://login redirect however it arrives,
 *   - drops the session when the token expires.
 *
 * Mounted once from GlobalServices in app.js, inside Provider + PersistGate.
 */
const useSsoSession = () => {
  const dispatch = useDispatch();
  const expiryTimer = useRef(null);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  /**
   * Ends the session however it ended — an expiry, a token that will not decode,
   * or a launch with nothing in the Keychain.
   *
   * What is NOT done here, and why:
   *   purgeLocalUserData — drops the account's data (USER_DATA_SLICES). An
   *     expiry is not a decision the user made, and losing unsent changes
   *     because a token lapsed is a real cost for no benefit.
   *   writeLastAccount   — the device still belongs to that account. Clearing
   *     it would make a LATER sign-in by someone else look like a first
   *     sign-in, which skips the purge and hands them the previous user's
   *     account data.
   */
  const endSession = useCallback(
    async ({ notify } = {}) => {
      clearExpiryTimer();
      await clearToken();
      // Nothing may replay the sign-in that began this session.
      forgetConsumedLogin();
      dispatch(clearAuthSession());
      // `notify` is exactly the expiry case — the silent way accounts are lost.
      // A clear on launch with no session to begin with is not an expiry.
      if (notify) {
        trackSsoEvent("session_expired");
        showInfoToast(STRINGS.SESSION_EXPIRED);
      }
    },
    [dispatch, clearExpiryTimer]
  );

  const beginSession = useCallback(
    async (user, expiresAt) => {
      // BEFORE the session is announced, not after. If this is a different
      // account from the one the on-device data belongs to, that data is wiped
      // first, so no frame ever renders the new user's name over the previous
      // user's data. Same account — including signing back in after an
      // expiry — is not a change and purges nothing.
      await applyAccountScope(user?.email, dispatch);

      dispatch(setAuthSession({ user, expiresAt }));

      // Cleared HERE, after the await, not before it: two begins overlap on
      // Android (openAuth and the return link), and each clearing before its
      // await left the other's timer untracked, to fire a second expiry, or
      // to end a later session.
      clearExpiryTimer();
      if (!expiresAt) return;
      const remaining = expiresAt - Date.now();
      if (remaining > 0 && remaining <= EXPIRY_TIMER_CEILING_MS) {
        expiryTimer.current = setTimeout(() => {
          endSession({ notify: true });
        }, remaining);
      }
    },
    [dispatch, clearExpiryTimer, endSession]
  );

  // Sign-in, sign-out and deletion start from screens; they begin and end the
  // session through these, so the timer always follows the session.
  useEffect(
    () => registerSessionHandlers({ begin: beginSession, end: endSession }),
    [beginSession, endSession]
  );

  // The server refusing the token ends the session as an expiry does. Once:
  // several requests can be refused together, and each would toast.
  useEffect(() => {
    let ending = false;
    return onUnauthorized(async () => {
      if (ending) return;
      ending = true;
      try {
        if (await readToken()) await endSession({ notify: true });
      } finally {
        ending = false;
      }
    });
  }, [endSession]);

  // Restore on launch, then wire up the redirect + expiry listeners.
  useEffect(() => {
    let active = true;

    const applyStoredToken = async () => {
      const token = await readToken();
      if (!active) return;

      if (!token || !isTokenValid(token)) {
        // Covers "no session", "expired while away" and "corrupt entry"
        // identically: clear and present as signed out. No toast — the user
        // did not just do anything, so an unprompted message would confuse.
        await endSession();
        return;
      }
      const payload = decodeJwtPayload(token);
      await beginSession(toSessionUser(payload), payload.exp * 1000);
      // A session picked up from the Keychain is NOT a sign-in and must not
      // inflate that funnel — it is how most launches by a signed-in user look.
      trackSsoEvent("session_restored");
    };

    // Set below. A link waits for the launch restore to finish: one accepted
    // while the restore was still reading the Keychain was saved, and then the
    // restore, having read no token, ended the session and deleted it.
    let restored = Promise.resolve();

    const handleUrl = async (url) => {
      await restored;
      if (!active) return;
      const accepted = await consumeLoginRedirect(url);
      if (!active || !accepted) return;
      await beginSession(accepted.user, accepted.expiresAt);
    };

    const restore = async () => {
      // Must precede the first read: on iOS the Keychain survives an uninstall,
      // so a reinstall would otherwise resurrect the previous user's session.
      await ensureInstallScopedToken();
      if (!active) return;
      await applyStoredToken();
    };
    restored = restore().catch(() => {});

    const run = async () => {
      // The redirect can arrive without openAuth's promise ever resolving —
      // Android may kill the app while the browser tab is foregrounded, in
      // which case the return URL cold-starts it and lands here instead.
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) await handleUrl(initialUrl);
    };

    run();

    const linkSub = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    // Catches the common case a timer cannot: the app sat in the background
    // for days and the token quietly expired.
    const appStateSub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      const token = await readToken();
      if (!active) return;
      // Only tear down a session we actually have; a signed-out user has no
      // token and must not be toasted at.
      if (token && !isTokenValid(token)) await endSession({ notify: true });
    });

    return () => {
      active = false;
      linkSub.remove();
      appStateSub.remove();
      clearExpiryTimer();
    };
  }, [beginSession, endSession, clearExpiryTimer]);
};

export default useSsoSession;
