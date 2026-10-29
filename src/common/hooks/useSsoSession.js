import { useCallback, useEffect, useRef } from "react";
import { AppState, Linking } from "react-native";
import { useDispatch } from "react-redux";
import { setAuthSession, clearAuthSession } from "../actions";
import { trackSsoEvent } from "../firebase/analytics";
import { applyAccountScope, switchAnalyticsAccount } from "../sso/accountScope";
import STRINGS from "../localization";
import { decodeJwtPayload, isTokenValid, toSessionUser } from "../sso/jwt";
import { consumeLoginRedirect } from "../sso/khalisSso";
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
   * The DATABASE detaches here; the PREFERENCES deliberately do not.
   *
   * Detaching is what makes "signed out" mean the same thing whichever way the
   * session ended. Without it an expiry left the previous account's SQLite file
   * open under signed-out chrome: the dashboard kept showing that account's
   * streak and calendar next to a "Sign in" button — a stranger's history on a
   * shared phone — and, worse, `switchAnalyticsAccount` reads whatever store is
   * open as unclaimed activity to hand the next person who signs in. From that
   * state a re-login doubled the account's own history and a different account
   * inherited all of it. Detaching restores the precondition that function is
   * written against; the guard inside it is the second line, not the first.
   *
   * Nothing is deleted. The account's file stays on disk and comes straight
   * back on the next sign-in, including anything not yet pushed.
   *
   * What is NOT done here, and why:
   *   purgeLocalUserData — resets the layout and cancels every reminder. An
   *     expiry is not a decision the user made, and losing your nitnem
   *     reminders because a token lapsed is a real cost for no benefit.
   *   writeLastAccount   — the device still belongs to that account. Clearing
   *     it would make a LATER sign-in by someone else look like a first
   *     sign-in, which skips the preference purge and hands them the previous
   *     user's layout and reminders.
   */
  const endSession = useCallback(
    async ({ notify } = {}) => {
      clearExpiryTimer();
      await clearToken();
      // Before the session is announced, so no frame renders a signed-out
      // dashboard over the previous account's numbers.
      await switchAnalyticsAccount(null);
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
      clearExpiryTimer();

      // BEFORE the session is announced, not after. If this is a different
      // account from the one the on-device data belongs to, that data is wiped
      // first, so no frame ever renders the new user's name over the previous
      // user's streaks. Same account — including signing back in after an
      // expiry — is not a change and purges nothing.
      await applyAccountScope(user?.email, dispatch);

      dispatch(setAuthSession({ user, expiresAt }));

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

    const handleUrl = async (url) => {
      const accepted = await consumeLoginRedirect(url);
      if (!active || !accepted) return;
      await beginSession(accepted.user, accepted.expiresAt);
    };

    const run = async () => {
      // Must precede the first read: on iOS the Keychain survives an uninstall,
      // so a reinstall would otherwise resurrect the previous user's session.
      await ensureInstallScopedToken();
      if (!active) return;
      await applyStoredToken();

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
