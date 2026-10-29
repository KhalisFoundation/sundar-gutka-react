// The one place the Khalis SSO session token is read from / written to disk.
//
// SECURITY: never log the token. `logError` reports to Crashlytics, so a token
// in a log line becomes a token in a crash report. Log the *failure*, never the
// value. The raw token also never enters Redux — redux-persist writes plain,
// unencrypted AsyncStorage. Only the decoded claims go into state.

import * as Keychain from "react-native-keychain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import constant from "../constant";
import { logError } from "../firebase/crashlytics";

const SERVICE = constant.SSO_KEYCHAIN_SERVICE;
// Keychain entries are key/value pairs; the username half is unused here but
// required by the API, so it carries a fixed label.
const ACCOUNT = "khalis-sso-session";

// iOS keeps Keychain items when an app is deleted, so a delete-and-reinstall
// would silently restore the previous user's session — a privacy surprise, and
// it desyncs against the app's own fresh-install handling. AsyncStorage *is*
// cleared on uninstall, so its emptiness is a reliable "this is a fresh
// install" signal.
const INSTALL_MARKER_KEY = "@sso_install_marker_v1";

const OPTIONS = {
  service: SERVICE,
  // No biometric ACCESS_CONTROL: the session is restored silently on every
  // launch, and a fingerprint prompt on cold start would be hostile.
  // AFTER_FIRST_UNLOCK still keeps the item unreadable while the device has
  // not been unlocked since boot.
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
};

export const saveToken = async (token) => {
  try {
    await Keychain.setGenericPassword(ACCOUNT, token, OPTIONS);
    return true;
  } catch (err) {
    logError(new Error(`SSO tokenStore.saveToken failed: ${err?.message || err}`));
    return false;
  }
};

export const readToken = async () => {
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    // Resolves to `false` (not a rejection) when no entry exists.
    if (!result || !result.password) return null;
    return result.password;
  } catch (err) {
    // A genuine Keychain failure (device locked, keystore invalidated by an OS
    // upgrade) must read as "signed out" rather than crash the launch path.
    logError(new Error(`SSO tokenStore.readToken failed: ${err?.message || err}`));
    return null;
  }
};

export const clearToken = async () => {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
    return true;
  } catch (err) {
    logError(new Error(`SSO tokenStore.clearToken failed: ${err?.message || err}`));
    return false;
  }
};

/**
 * Drop any token that outlived an uninstall. Must run before the first
 * readToken() of the session.
 */
export const ensureInstallScopedToken = async () => {
  try {
    const marker = await AsyncStorage.getItem(INSTALL_MARKER_KEY);
    if (marker) return;
    await clearToken();
    await AsyncStorage.setItem(INSTALL_MARKER_KEY, String(Date.now()));
  } catch (err) {
    logError(new Error(`SSO tokenStore.ensureInstallScopedToken failed: ${err?.message || err}`));
  }
};
