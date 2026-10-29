// Which account's analytics database is currently open.
//
// The history — day rows, sessions, streak summary — used to live in ONE file
// shared by every account, and switching accounts DELETED it. That is what made
// the loss possible: sign out, read for a few minutes, sign back in, and the
// device held a near-empty store that the sync layer then treated as the
// account's truth and pushed over real history.
//
// Each account now gets its own file. Signing out DETACHES rather than
// destroys, so signing back in finds everything still there — including
// anything that had not been pushed yet. Account B never opens account A's
// file, which is the privacy property the old purge existed for, reached
// without deleting anything.
//
// Activity done while signed out goes to the anonymous file, and is merged into
// whichever account signs in next (see accountScope.switchAnalyticsAccount).

// FNV-1a. The account key ends up in a FILENAME, so it has to be short and
// filesystem-safe — an email is neither. Hashing is not for secrecy here: the
// email is already on the device. It is for a stable, legal, fixed-length name.
/* eslint-disable no-bitwise -- a hash is arithmetic on bits; that is the point. */
export const accountKeyFor = (email) => {
  const normalised = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalised) return null;
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalised.length; i += 1) {
    hash ^= normalised.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};
/* eslint-enable no-bitwise */

// The signed-out store. A real name rather than a null case, so every code path
// has a database to write to and nothing has to special-case "no account".
export const ANONYMOUS_KEY = "anon";

const state = { key: ANONYMOUS_KEY };

/** The key whose database should be open right now. */
export const currentAccountKey = () => state.key;

/**
 * The database filename for a key.
 *
 * The anonymous store deliberately keeps the ORIGINAL filename. Every install
 * that predates account scoping has its history in `analytics_v01.db`, and
 * giving the anonymous store a new name would have orphaned all of it — the app
 * would open an empty file and every existing user would see their history
 * vanish. Treating the old file as "activity with no account attached" is both
 * true and free: it is carried into whichever account signs in next, by exactly
 * the same path as reading done while signed out.
 */
export const dbNameFor = (key) =>
  !key || key === ANONYMOUS_KEY ? "analytics_v01.db" : `analytics_v01_${key}.db`;

/**
 * Point subsequent opens at `email`'s database (or the anonymous one for null).
 * Returns true when the key actually changed, so the caller knows to close the
 * handle it already has.
 */
export const setAccountKey = (email) => {
  const next = accountKeyFor(email) ?? ANONYMOUS_KEY;
  if (next === state.key) return false;
  state.key = next;
  return true;
};
