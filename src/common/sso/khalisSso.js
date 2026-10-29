// Khalis SSO login / logout, per the Service Provider's integration guide.
//
// The SP fronts a SAML IdP and hands us a plain JWT, so this app never speaks
// SAML. Flow: open ${SSO}/login/sso?redirect_url=sundargutka://login in a
// system-backed browser -> user authenticates at the IdP -> the SP's success
// page bounces back to sundargutka://login?token=<jwt>.
//
// Why InAppBrowser.openAuth and not a WebView or Linking.openURL:
//   * Logout (/logout/all) can only end the IdP session if it runs in the SAME
//     cookie jar the login used. openAuth uses ASWebAuthenticationSession on
//     iOS and Chrome Custom Tabs on Android, both of which share the system
//     browser's cookies. A react-native-webview has a private jar, so a login
//     there would leave an IdP cookie that logout could never reach — the user
//     could never switch accounts.
//   * openAuth also captures the redirect itself, so there is no race between
//     the browser closing and a Linking listener firing.
// Linking.openURL remains the fallback for devices with no Custom Tabs-capable
// browser, mirroring the existing fallback in src/common/inAppBrowser.js.

import { Linking } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { brandMarks } from "@theme/palette";
import constant from "../constant";
import { logError, logMessage, logNetworkError } from "../firebase/crashlytics";
import { decodeJwtPayload, isTokenValid, toSessionUser } from "./jwt";
import { saveToken, clearToken } from "./tokenStore";

// Same chrome as the app's other in-app browser usage (see inAppBrowser.js).
const BRAND_COLOR = brandMarks.inAppBrowser.chrome;
const BRAND_CONTRAST = brandMarks.inAppBrowser.onChrome;

const AUTH_BROWSER_OPTIONS = {
  // Shared chrome with the rest of the app's in-app browser usage.
  preferredBarTintColor: BRAND_COLOR,
  preferredControlTintColor: BRAND_CONTRAST,
  toolbarColor: BRAND_COLOR,
  secondaryToolbarColor: BRAND_CONTRAST,
  navigationBarColor: BRAND_COLOR,
  dismissButtonStyle: "cancel",
  animated: true,
  modalEnabled: true,
  showTitle: true,
  enableUrlBarHiding: true,
  enableDefaultShare: false,
  // iOS: MUST stay false. An ephemeral session gets a throwaway cookie jar, so
  // the IdP session cookie would not survive to the logout call and
  // account-switch would break permanently.
  ephemeralWebSession: false,
  // Android: true would add FLAG_ACTIVITY_NEW_TASK, putting the Custom Tab in
  // its own task where MainActivity's singleTask can no longer clear it away
  // on return.
  forceCloseOnRedirection: false,
  // Android: without this the library adds FLAG_ACTIVITY_NO_HISTORY and the tab
  // is destroyed the moment the user backgrounds it — e.g. to fetch a password
  // from a password manager mid-login.
  showInRecents: true,
};

export const buildLoginUrl = () =>
  `${constant.SSO_SERVICE_URL}/login/sso?redirect_url=${encodeURIComponent(
    constant.SSO_LOGIN_REDIRECT
  )}`;

export const buildLogoutUrl = (token) =>
  `${constant.SSO_SERVICE_URL}/logout/all?token=${encodeURIComponent(token)}` +
  `&redirect_url=${encodeURIComponent(constant.SSO_LOGOUT_REDIRECT)}`;

/**
 * Pull the token out of a sundargutka://login?token=... redirect.
 * Deliberately a regex, not `new URL()` — RN's URL polyfill does not parse
 * custom schemes reliably.
 */
export const parseTokenFromRedirect = (url) => {
  if (typeof url !== "string") return null;
  const match = url.match(/[?&]token=([^&#]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (_) {
    return match[1];
  }
};

/**
 * Validate then persist a token that arrived on the redirect. Anything that
 * fails validation is dropped without being stored — this runs for ANY
 * sundargutka://login URL, including ones injected via `adb` or another app,
 * so an opaque string must never be trusted just because the scheme matched.
 *
 * Returns { user, expiresAt } on success, or null.
 */
export const acceptToken = async (token) => {
  if (!token || !isTokenValid(token)) return null;
  const saved = await saveToken(token);
  if (!saved) return null;
  const payload = decodeJwtPayload(token);
  return { user: toSessionUser(payload), expiresAt: payload.exp * 1000 };
};

// The same redirect can legitimately arrive twice. On Android openAuth is
// polyfilled on top of Linking, so a successful login resolves startLogin's
// promise AND fires the app-wide `url` listener in useSsoSession; a cold start
// after a low-memory kill delivers it via getInitialURL() as well. Every entry
// point funnels through consumeLoginRedirect so the token is written to the
// Keychain exactly once.
let lastConsumedToken = null;
let lastConsumedResult = null;

export const consumeLoginRedirect = async (url) => {
  if (!url || !url.startsWith(constant.SSO_LOGIN_REDIRECT)) return null;
  const token = parseTokenFromRedirect(url);
  if (!token) return null;

  // A repeat of the token we just accepted returns the ALREADY-COMPUTED result
  // rather than null. Returning null here would be read as "login failed" by
  // whichever caller lost the race, showing an error toast on a login that
  // actually succeeded. Re-dispatching an identical session is harmless; only
  // the redundant Keychain write is worth avoiding.
  if (token === lastConsumedToken) return lastConsumedResult;

  const accepted = await acceptToken(token);
  if (accepted) {
    lastConsumedToken = token;
    lastConsumedResult = accepted;
  }
  return accepted;
};

export const resetConsumedRedirect = () => {
  lastConsumedToken = null;
  lastConsumedResult = null;
};

/**
 * Start the login flow.
 *
 * Resolves:
 *   { status: "success", user, expiresAt } — token captured, validated, stored
 *   { status: "cancelled" }      — user dismissed the browser
 *   { status: "pending" }        — handed off to the system browser; the
 *                                  redirect will arrive via the Linking
 *                                  listener in useSsoSession
 *   { status: "error" }          — could not start, or the token was rejected
 */
// InAppBrowser keeps ONE redirect handler and asserts it is unset before it
// opens a session, so a second overlapping call throws "openAuth is in a bad
// state". useSsoActions guards on Redux `busy`, but that is set by a dispatch
// the second tap can beat, so two presses still reach here. Holding the
// in-flight promise means the loser waits for the same login rather than
// starting a competing one.
let loginInFlight = null;
let logoutInFlight = null;

const runLogin = async () => {
  const url = buildLoginUrl();
  try {
    const result = await InAppBrowser.openAuth(url, constant.SSO_LOGIN_REDIRECT, {
      ...AUTH_BROWSER_OPTIONS,
    });

    if (result?.type === "success" && result.url) {
      // Via consumeLoginRedirect, not acceptToken directly, so this shares the
      // de-duplication with useSsoSession's Linking listener — on Android both
      // fire for the same successful login.
      const accepted = await consumeLoginRedirect(result.url);
      // Belt-and-braces: the tab usually closes itself on redirect.
      try {
        InAppBrowser.closeAuth();
      } catch (_) {
        /* not fatal */
      }
      return accepted
        ? { status: "success", user: accepted.user, expiresAt: accepted.expiresAt }
        : { status: "error" };
    }
    // "cancel" (user dismissed) / "dismiss" (programmatic close).
    return { status: "cancelled" };
  } catch (err) {
    // No Custom Tabs-capable browser, or the native module failed. Hand off to
    // the system browser; useSsoSession's Linking listener picks up the return.
    try {
      await Linking.openURL(url);
      // The designed fallback worked and the user is still signing in, so this
      // is context for a later report rather than a fault of its own.
      logMessage(`SSO startLogin used the system browser: ${err?.message || err}`);
      return { status: "pending" };
    } catch (fallbackErr) {
      // Only now is anything actually broken: neither browser would open.
      logError(new Error(`SSO startLogin openAuth failed: ${err?.message || err}`));
      logError(new Error(`SSO startLogin fallback failed: ${fallbackErr?.message || fallbackErr}`));
      return { status: "error" };
    }
  }
};

export const startLogin = () => {
  if (loginInFlight) return loginInFlight;
  loginInFlight = runLogin().finally(() => {
    loginInFlight = null;
  });
  return loginInFlight;
};

/**
 * Sign out. Clears the local token first, then ends the IdP session via
 * /logout/all in the same browser used to log in.
 *
 * Clearing locally is NOT enough on its own: the IdP session would stay alive
 * and the next login would silently re-authenticate the same person, with no
 * chance to switch accounts.
 *
 * Resolves { remote: true } when the IdP session was ended, { remote: false }
 * when only the local session could be cleared (expired token — /logout/all
 * rejects those with 401 — or the browser could not be opened).
 */
const runLogout = async (token) => {
  // Capture validity before clearing: an expired token cannot end the IdP
  // session, so there is no point opening a browser that will only 401.
  const canEndIdpSession = !!token && isTokenValid(token, 0);
  await clearToken();

  if (!canEndIdpSession) return { remote: false };

  const url = buildLogoutUrl(token);
  try {
    const result = await InAppBrowser.openAuth(url, constant.SSO_LOGOUT_REDIRECT, {
      ...AUTH_BROWSER_OPTIONS,
    });
    try {
      InAppBrowser.closeAuth();
    } catch (_) {
      /* not fatal */
    }
    // The logout return carries no token; reaching it at all means the IdP
    // completed single-logout. A cancel still leaves the local session cleared.
    return { remote: result?.type === "success" };
  } catch (err) {
    try {
      await Linking.openURL(url);
      logMessage(`SSO startLogout used the system browser: ${err?.message || err}`);
      return { remote: true };
    } catch (fallbackErr) {
      logError(new Error(`SSO startLogout openAuth failed: ${err?.message || err}`));
      logError(
        new Error(`SSO startLogout fallback failed: ${fallbackErr?.message || fallbackErr}`)
      );
      return { remote: false };
    }
  }
};

export const startLogout = (token) => {
  if (logoutInFlight) return logoutInFlight;
  logoutInFlight = runLogout(token).finally(() => {
    logoutInFlight = null;
  });
  return logoutInFlight;
};

/**
 * Ask the SP to decode a token (GET /user).
 *
 * NOT used on the launch path, and deliberately so: the JWT is self-describing,
 * so the local expiry check is authoritative and works offline. This exists for
 * a future server-side-revocation check.
 *
 * Note the SP's quirk — on a missing/invalid/expired token it 302-redirects to
 * /login/sso instead of returning 401. `fetch` follows redirects, so a bad
 * token yields an HTML page with status 200. Branching on `res.ok` here would
 * fail open and treat a login page as a valid user.
 */
export const fetchSsoUser = async (token) => {
  if (!token) return { valid: false };
  try {
    const res = await fetch(`${constant.SSO_SERVICE_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.url && res.url.includes("/login/sso")) return { valid: false };
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return { valid: false };
    const payload = await res.json();
    if (!payload?.email) return { valid: false };
    return { valid: true, user: toSessionUser(payload) };
  } catch (err) {
    logNetworkError(`SSO fetchSsoUser failed: ${err?.message || err}`, err);
    return { valid: false };
  }
};

export default {
  buildLoginUrl,
  buildLogoutUrl,
  parseTokenFromRedirect,
  acceptToken,
  startLogin,
  startLogout,
  fetchSsoUser,
  consumeLoginRedirect,
  resetConsumedRedirect,
};
