// Keeps on-device data belonging to the account that is actually signed in.
//
// Signing out used to clear only the Keychain token and the `auth` slice, so
// everything that belongs to a PERSON rather than to this phone survived into
// the next person's session. Signing in as B then showed A's data: wrong, and a
// privacy leak rather than merely a stale-cache bug.
//
// What goes is the slices in USER_DATA_SLICES (common/reducer.js): the data the
// account holds a copy of, so it costs nothing to drop and comes back with the
// account. Today that is the pothis, the settings-sync clocks and the unsent
// changes, so one person's folders and pending edits never reach another's
// account. Bookmarks and reminders join with the PRs that sync them; until then
// they belong to the phone, as they always have. A FIRST sign-in is not a
// change: whatever was set up signed-out is the signing-in person's own, and is
// claimed.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearUserData } from "../actions";
import { logError } from "../firebase/crashlytics";
import { normaliseEmail } from "./jwt";

// Which account the data currently on this device belongs to. Email, because
// that is what the backend resolves an SSO token to (its auth guard upserts the
// user row on email — nameID is never read server-side), so the two stay
// consistent when sync becomes account-keyed.
const LAST_ACCOUNT_KEY = "@sso_last_account_v1";

export const readLastAccount = async () => {
  try {
    return await AsyncStorage.getItem(LAST_ACCOUNT_KEY);
  } catch (err) {
    logError(new Error(`SSO accountScope.readLastAccount failed: ${err?.message || err}`));
    return null;
  }
};

export const writeLastAccount = async (email) => {
  try {
    if (email) await AsyncStorage.setItem(LAST_ACCOUNT_KEY, email);
    else await AsyncStorage.removeItem(LAST_ACCOUNT_KEY);
  } catch (err) {
    logError(new Error(`SSO accountScope.writeLastAccount failed: ${err?.message || err}`));
  }
};

/** Case/whitespace-insensitive, so "A@x.com" and "a@x.com " are one account. */
const normalise = normaliseEmail;

/**
 * True when `email` is a different account from the one this device's data
 * belongs to. A signed-out device (`email` null) counts as a change only if
 * there was an account before — otherwise every launch of a never-signed-in app
 * would purge.
 */
export const isAccountChange = (email, lastAccount) => {
  const next = normalise(email);
  const prev = normalise(lastAccount);
  if (!next && !prev) return false;
  return next !== prev;
};

/**
 * Wipe everything that belongs to a person rather than to this phone.
 *
 * Deliberately NOT wiped: downloaded audio (real files on disk — clearing the
 * registry would orphan them), and every display preference (theme, font size,
 * language). Those describe how this phone is set up, not who is holding it.
 */
export const purgeLocalUserData = async (dispatch) => {
  dispatch(clearUserData());
};

/**
 * Clear the signed-in account's on-device data, and forget that this device
 * had an owner. Sign-out and account deletion — the two ends a person chooses.
 * An expiry is neither, and keeps both (see useSsoSession.endSession).
 *
 * Forgetting the owner makes the next sign-in a first one, which claims what
 * is on the phone. That is safe because what an account owns has just gone
 * (USER_DATA_SLICES); what is left belongs to the phone.
 *
 * The Keychain token is NOT cleared here. It belongs to the session rather than
 * to on-device data, and the caller needs it right up until the sign-out or
 * the delete has gone through — see useSsoActions.
 */
export const destroyLocalAccountData = async (dispatch) => {
  // Via CLEAR_USER_DATA's slice list: the pothis, the sync clocks and the
  // outbox, whose queued ops would otherwise keep pushing to a dead account.
  await purgeLocalUserData(dispatch);

  // No previous account to compare the next sign-in against.
  await writeLastAccount(null);
};

/**
 * Called on every session change. Resets PREFERENCES only when the account
 * actually differs, then records the new owner.
 *
 * A FIRST sign-in is the exception. There is no previous account whose data
 * needs protecting — only whatever the person did on this device before they
 * signed in, which is their own. That is claimed, not destroyed, so a nitnem
 * arranged signed-out survives the sign-in that gives it somewhere to live.
 * Every later change of account still purges in full.
 *
 * Returns true if a purge happened (useful for tests and logging).
 */
const applyAccountScopeNow = async (email, dispatch) => {
  try {
    const last = await readLastAccount();

    if (!isAccountChange(email, last)) return false;
    if (!normalise(last) && normalise(email)) {
      await writeLastAccount(normalise(email));
      return false;
    }
    await purgeLocalUserData(dispatch);
    await writeLastAccount(email ? normalise(email) : null);
    return true;
  } catch (err) {
    // A failed purge must not block sign-in, but it does mean stale data may be
    // on screen — report it rather than swallowing it silently.
    logError(new Error(`SSO accountScope.applyAccountScope failed: ${err?.message || err}`));
    return false;
  }
};

// One at a time. On Android a sign-in arrives twice — openAuth resolves and
// the return link fires — and two checks running together both read the
// previous owner before either records the new one, so both purged; the
// second could land after the first session had already synced the account's
// settings down, and wipe them. In turn, the second finds the owner recorded
// and changes nothing.
let scopeQueue = Promise.resolve();

export const applyAccountScope = (email, dispatch) => {
  const run = scopeQueue.then(() => applyAccountScopeNow(email, dispatch));
  scopeQueue = run.catch(() => {});
  return run;
};
