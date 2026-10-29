// Keeps on-device data belonging to the account that is actually signed in.
//
// Signing out used to clear only the Keychain token and the `auth` slice, so
// everything that belongs to a PERSON rather than to this phone survived into
// the next person's session. Signing in as B then showed A's data: wrong, and a
// privacy leak rather than merely a stale-cache bug.
//
// Two kinds of data, kept apart in two different ways.
//
// PREFERENCES — the slices in USER_DATA_SLICES (common/reducer.js): pothis,
// reminders, the dashboard's layout and nitnem ticks, the sync clocks and the
// unsent changes. The account holds a copy of each, so they cost nothing to
// drop on an account change and come back with the account. They persist under
// one redux-persist key, which is why they are reset rather than scoped.
//
// HISTORY — the dashboard's SQLite store: day rows, sessions, streaks. It is
// not deleted, it is SCOPED. Deleting it on every account change is what made a
// much worse bug possible: sign out, read for a few minutes, sign back in, and
// the device held a near-empty store which the sync layer then treated as the
// account's truth and pushed over real history. An account lost a streak and
// every completed bani that way. So each account has its own file (see
// database/analytics/accountDb), signing out detaches instead of destroying,
// and signing back in finds everything still there, including whatever had not
// been pushed yet. Account B never opens account A's file, so the privacy
// property survives without deleting anything.
//
// A FIRST sign-in is not a change: whatever was set up signed-out is the
// signing-in person's own, and is claimed.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAnalyticsAccount,
  currentAccountKey,
  ANONYMOUS_KEY,
  getAllDailyActivity,
  getAllReadSessions,
  getAllAudioSessions,
  getAllBaniReadCounts,
  upsertDailyActivity,
  insertReadSession,
  insertAudioSession,
  incrementBaniReadCount,
  clearAllAnalyticsData,
} from "../../database/analytics";
import {
  DASHBOARD_RESTORED_KEY,
  DASHBOARD_LAST_PUSH_KEY,
  DASHBOARD_APPLIED_AT_KEY,
  DASHBOARD_LOCAL_MUTATED_AT_KEY,
  DASHBOARD_ACCOUNT_TODAY_KEY,
  DASHBOARD_ACTIVITY_PUSHED_AT_KEY,
  DASHBOARD_PAYLOAD_HASH_KEY,
  RESTORED_TOP_BANIS_KEY,
} from "../../services/dashboard/syncKeys";
import { clearUserData } from "../actions";
import constant from "../constant";
import { logError } from "../firebase/crashlytics";
import { cancelAllReminders } from "../notifications";
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
  // Deliberately does NOT touch the analytics database. Switching accounts
  // changes which FILE is open (switchAnalyticsAccount below); the outgoing
  // account's history stays exactly where it is.
  dispatch(clearUserData());
  // The reminders are already scheduled with the OS. Redux forgetting them
  // does not stop them firing, so the next person would still be woken for
  // the previous one's nitnem.
  try {
    await cancelAllReminders();
  } catch (err) {
    logError(new Error(`SSO accountScope: cancelling reminders failed: ${err?.message || err}`));
  }

  // DASHBOARD_APPLIED_AT_KEY goes with them: it records how fresh the LAST
  // ACCOUNT's applied snapshot was. Left behind, the incoming account's own
  // snapshot could look older than it and be skipped as "nothing new".
  // DASHBOARD_LOCAL_MUTATED_AT_KEY goes too: the purge has just deleted the
  // data that timestamp described, so leaving it would tell the incoming
  // account that this device holds newer changes than the cloud — and its own
  // snapshot would be discarded in favour of nothing.
  //
  // And the three that switchAnalyticsAccount clears on leaving an account
  // (see there). It decides "leaving" from the file open in THIS process, and
  // every process starts on the signed-out store — so an account ended in a
  // fresh process (an expiry found at launch) left them behind, and the next
  // account's activity upload started from the previous one's watermark and
  // skipped every day older than it.
  await AsyncStorage.multiRemove([
    DASHBOARD_LAST_PUSH_KEY,
    RESTORED_TOP_BANIS_KEY,
    DASHBOARD_APPLIED_AT_KEY,
    DASHBOARD_LOCAL_MUTATED_AT_KEY,
    DASHBOARD_ACCOUNT_TODAY_KEY,
    DASHBOARD_ACTIVITY_PUSHED_AT_KEY,
    DASHBOARD_PAYLOAD_HASH_KEY,
  ]);

  if (constant.SSO_ACCOUNT_SCOPED_SYNC) {
    // Backend keys snapshots on the account: clear the marker so the signing-in
    // account restores its OWN snapshot.
    await AsyncStorage.removeItem(DASHBOARD_RESTORED_KEY);
  } else {
    // Backend still keys on deviceId. Restoring here would fetch this DEVICE's
    // latest snapshot — i.e. hand the new account the previous account's data
    // and recreate the exact bug this purge exists to fix. Setting the marker
    // suppresses the restore so the new account starts genuinely empty.
    await AsyncStorage.setItem(DASHBOARD_RESTORED_KEY, "1");
  }
};

/**
 * Zero the OPEN store's summary when no rows stand behind it.
 *
 * `user_stats_summary` is derived — computeStreaks rebuilds it from
 * `daily_activity` — but it is stored, and the rebuild deliberately declines to
 * write zeros over a summary it cannot verify. So a summary can outlive the
 * rows it described and there is no path back to zero except this one.
 *
 * Only ever called against the signed-out store, and only when that store holds
 * nothing: an unbacked summary is then unambiguously stale rather than the
 * record of activity waiting to be claimed.
 */
const resetSummaryIfUnbacked = async () => {
  try {
    const held =
      (await getAllDailyActivity()).length +
      (await getAllReadSessions()).length +
      (await getAllAudioSessions()).length +
      (await getAllBaniReadCounts()).length;
    // Deletes from four empty tables — the point of the call is the summary.
    if (held === 0) await clearAllAnalyticsData();
  } catch (err) {
    logError(
      new Error(`SSO accountScope: resetting the signed-out summary failed: ${err?.message}`)
    );
  }
};

/**
 * Point the analytics database at `email`'s own file, first carrying over any
 * activity recorded while signed out.
 *
 * Signed-out reading lands in the anonymous store because there is no account to
 * attribute it to yet. Whoever signs in next claims it: the rows are ADDED to
 * that account's days (they are genuinely additional activity, not a competing
 * copy of the same day), and then cleared from the anonymous store so a second
 * sign-in cannot add them twice.
 *
 * Ordering is add-then-clear on purpose. Interrupted between the two, the worst
 * case is that a day is counted twice — recoverable, and visibly wrong. Clearing
 * first would lose the reading outright, which is not.
 *
 * PRECONDITION, now enforced rather than assumed: the carry only runs when the
 * ANONYMOUS store is the open one. See the guard below for what it cost when
 * that was left as a comment.
 */
export const switchAnalyticsAccount = async (email) => {
  // Which store the carry would be reading FROM.
  //
  // The rows it moves are unattributed by definition, and those only ever live
  // in the anonymous file. So if anything else is open there is nothing here to
  // claim, and reading it would move an ACCOUNT'S OWN history instead.
  //
  // This used to be an assumption, held up by the comment below and by every
  // sign-out path remembering to detach first. `endSession` — a token expiry —
  // did not: it cleared the Keychain and the auth slice and left the previous
  // account's database open. A sign-in from that state read that file as though
  // it were the scratch pad, so signing back in as the SAME person added every
  // day row onto itself (history doubled, sessions re-inserted) and signing in
  // as SOMEONE ELSE copied the whole of it into their account. Both then pushed
  // upward, where `raiseAllTimeBaseline`'s max() makes an inflated lifetime
  // total permanent — there is no path back down.
  //
  // The anonymity of the SOURCE is the property that matters, not whether the
  // key is about to change. A guard that only asked "is this a different
  // account?" would have stopped the doubling and waved the cross-account copy
  // straight through.
  const previousKey = currentAccountKey();
  const canCarry = previousKey === ANONYMOUS_KEY;

  let carried = null;
  try {
    // Read while the ANONYMOUS store is still the open one — guaranteed by
    // `canCarry`, not merely intended.
    //
    // ALL FIVE tables, not just the day rows. Carrying only `daily_activity`
    // left the streak summary, the session histories and the read counts behind
    // in the anonymous store — and because that store is the pre-accounts
    // database, signing out then showed the previous account's streak and
    // most-read lists on a dashboard that was supposed to be empty.
    if (email && canCarry) {
      carried = {
        days: await getAllDailyActivity(),
        reads: await getAllReadSessions(),
        audio: await getAllAudioSessions(),
        counts: await getAllBaniReadCounts(),
      };
    }
  } catch (err) {
    logError(new Error(`SSO accountScope: reading signed-out activity failed: ${err?.message}`));
    carried = null;
  }

  const storeChanged = await useAnalyticsAccount(email);

  // Three AsyncStorage keys describe the account whose store was just closed,
  // and none of them mean anything once a different file is open. They are
  // GLOBAL keys holding PER-ACCOUNT state, which is the whole problem — the
  // history itself is scoped by filename, and these were left behind.
  //
  // DASHBOARD_ACCOUNT_TODAY_KEY is the one that shows. It holds what the
  // ACCOUNT read today across all its devices, and the streak engine counts
  // today as active on the strength of it (see streakEngine.accountSecondsToday)
  // WITHOUT consulting a single local row. Left behind at sign-out it makes the
  // signed-out dashboard read a 1-day streak, a best streak of 1 and one active
  // day, off an empty store — and because computeStreaks floors the lifetime
  // figures with Math.max, that fabricated 1 then never comes back down.
  //
  // DASHBOARD_ACTIVITY_PUSHED_AT_KEY is a watermark over the previous store's
  // SQLite `updated_at` values. Against a different account's rows it is
  // meaningless and reads too high, so `getActivityUpdatedSince` returns
  // nothing and that account's local history never uploads at all.
  //
  // DASHBOARD_PAYLOAD_HASH_KEY is the fingerprint of the last snapshot pushed
  // for the previous account; kept, it can skip the incoming account's first
  // push as "unchanged".
  //
  // Only when LEAVING a real account, not on every attachment. A plain relaunch
  // goes anonymous → account, which changes the key but succeeds nothing: the
  // watermark there is this account's own and still correct, and dropping it
  // every launch would re-push a year of day rows for no reason.
  if (storeChanged && previousKey !== ANONYMOUS_KEY) {
    await AsyncStorage.multiRemove([
      DASHBOARD_ACCOUNT_TODAY_KEY,
      DASHBOARD_ACTIVITY_PUSHED_AT_KEY,
      DASHBOARD_PAYLOAD_HASH_KEY,
    ]);
  }

  // DETACHING. The signed-out store is now the open one, and this is the last
  // moment anything looks at it before the dashboard renders from it.
  //
  // Its four data tables were emptied when its rows were last claimed, so it
  // should read blank — but `user_stats_summary` is zeroed by exactly one
  // thing, `clearAllAnalyticsData`, and that sits below the `total === 0` return
  // here. A summary left claiming activity its rows cannot support is therefore
  // never repaired, and nothing else will do it: computeStreaks bails out
  // rather than writing zeros when it finds no history, precisely so a restore
  // in flight is not clobbered. So the signed-out dashboard kept reporting a
  // streak and a days-active count with an empty store behind them.
  //
  // Guarded on the store being genuinely row-empty, which is the difference
  // between a repair and data loss: rows still sitting here mean a previous
  // carry FAILED and left them for the next sign-in to retry. Those are real,
  // unclaimed reading, and the summary that goes with them is real too.
  // Only when an ACCOUNT was just left. A launch that was never signed in also
  // lands here, and there the signed-out store is not a leftover at all — it is
  // that user's own history, the summary belongs to it, and walking four whole
  // tables to prove so would be on the cold-start path of every such launch.
  if (!email) {
    // What the ACCOUNT read today, counted as today's activity by the streak
    // engine without a local row behind it. Signed out, there is no account.
    // On every detach, not only when the file changed: at launch the process
    // is already on the signed-out store, and an expiry found then left it.
    await AsyncStorage.removeItem(DASHBOARD_ACCOUNT_TODAY_KEY);
    if (previousKey !== ANONYMOUS_KEY) await resetSummaryIfUnbacked();
    return 0;
  }

  const total =
    (carried?.days?.length ?? 0) +
    (carried?.reads?.length ?? 0) +
    (carried?.audio?.length ?? 0) +
    (carried?.counts?.length ?? 0);
  if (total === 0) return 0;

  try {
    // Days are ADDED as deltas: signed-out reading is genuinely extra activity
    // for that date, not a competing copy of it.
    //
    // This device's OWN seconds, not the row's totals: a total can hold the
    // account's sum (a restore, or a pull from an earlier build), and carried
    // as a delta it became this device's work and went up to be added to every
    // other device's again. A row with none of this device's seconds in it is
    // left out — carried, it would stamp an empty day as this device's own.
    await Promise.all(
      (carried.days ?? [])
        .filter((row) => (row.own_reading_seconds ?? 0) + (row.own_listening_seconds ?? 0) > 0)
        .map((row) =>
          upsertDailyActivity({
            date: row.date,
            reading_seconds_delta: row.own_reading_seconds ?? 0,
            listening_seconds_delta: row.own_listening_seconds ?? 0,
          })
        )
    );
    // Sessions are individual facts, so they are re-inserted as they were. The
    // summary is not carried at all — it is DERIVED (computeStreaks rebuilds the
    // streak from the day rows, and the all-time totals are summed from these
    // session tables), so copying it would only risk double counting.
    await Promise.all(
      (carried.reads ?? []).map((r) =>
        insertReadSession({
          bani_id: r.bani_id,
          bani_title: r.bani_title ?? null,
          start_time: r.start_time,
          end_time: r.end_time,
          duration_seconds: r.duration_seconds ?? 0,
          completed: !!r.completed,
        })
      )
    );
    await Promise.all(
      (carried.audio ?? []).map((r) =>
        insertAudioSession({
          audio_id: r.audio_id ?? null,
          bani_id: r.bani_id,
          bani_title: r.bani_title ?? null,
          artist_id: r.artist_id ?? null,
          artist_name: r.artist_name ?? null,
          duration_played: r.duration_played ?? 0,
          completed: !!r.completed,
        })
      )
    );
    await Promise.all(
      (carried.counts ?? []).flatMap((r) =>
        Array.from({ length: Math.max(0, r.read_count ?? 0) }, () =>
          incrementBaniReadCount(r.bani_id, r.bani_title ?? null)
        )
      )
    );
  } catch (err) {
    // Nothing was cleared, so everything is still in the anonymous store and the
    // next sign-in will try again. Leave it.
    logError(new Error(`SSO accountScope: carrying signed-out activity failed: ${err?.message}`));
    return 0;
  }

  try {
    // Empty the anonymous store completely. Everything in it now lives in the
    // account, and leaving any of it behind is what made a signed-out dashboard
    // show the previous account's numbers.
    await useAnalyticsAccount(null);
    await clearAllAnalyticsData();
  } catch (err) {
    logError(new Error(`SSO accountScope: clearing signed-out activity failed: ${err?.message}`));
  } finally {
    await useAnalyticsAccount(email);
  }
  return total;
};

/**
 * Leave the signed-in account on this device: detach its history, drop its
 * preferences, and forget that this device had an owner. Sign-out — the end a
 * person chooses. An expiry is not one, and keeps the preferences and the owner
 * (see useSsoSession.endSession).
 *
 * Forgetting the owner makes the next sign-in a first one, which claims what
 * is on the phone. That is safe because what an account owns has just gone
 * (USER_DATA_SLICES) or been detached (its history file); what is left belongs
 * to the phone.
 *
 * The database first, so no frame renders signed-out preferences over the
 * previous account's numbers.
 */
export const leaveLocalAccount = async (dispatch) => {
  await switchAnalyticsAccount(null);
  await purgeLocalUserData(dispatch);
  await writeLastAccount(null);
};

/**
 * DESTROY `email`'s on-device data. Account deletion only.
 *
 * This is the one place that deletes history, and it is deliberately not what
 * signing out does (leaveLocalAccount detaches). There is nothing to come back
 * to after a deletion, and a device still holding the reading history of an
 * account that no longer exists is the bug users notice; so here the file is
 * emptied rather than merely closed.
 *
 * The file is opened BY ACCOUNT, not taken as whichever store is open. By the
 * time this runs the session has ended, and ending it already pointed the
 * handle at the signed-out store — emptying "the open store" then would destroy
 * activity that was never part of this account and leave the account's own
 * file untouched. With no email there is no file to name, and nothing is wiped.
 *
 * The Keychain token is NOT cleared here. It belongs to the session rather than
 * to on-device data — see useSsoActions.deleteAccount.
 */
export const destroyLocalAccountData = async (dispatch, email) => {
  if (email) {
    try {
      // Day rows, both session histories, the read counts and the summary.
      await useAnalyticsAccount(email);
      await clearAllAnalyticsData();
    } catch (err) {
      // Reported, not rethrown. The account IS gone server-side by the time
      // this runs, so leaving it below has to happen either way.
      logError(new Error(`SSO accountScope: wiping deleted account data failed: ${err?.message}`));
    }
  }
  // Back to the signed-out store, then — via CLEAR_USER_DATA's slice list —
  // the preferences and the sync outbox, whose queued ops would otherwise keep
  // pushing to a dead account.
  await leaveLocalAccount(dispatch);
};

/**
 * Called on every session change. Resets PREFERENCES only when the account
 * actually differs, always points the database at the right account, then
 * records the new owner.
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

    // Unconditional: the database must follow the session even when the account
    // has not CHANGED — a relaunch starts on the anonymous store and has to be
    // pointed at the signed-in account before anything reads or writes.
    //
    // Its failure must not stop the purge below: a wedged database would
    // otherwise hand the next account the previous one's pothis, reminders and
    // unsent changes, which would then sync into it.
    try {
      await switchAnalyticsAccount(email);
    } catch (err) {
      logError(new Error(`SSO accountScope: switching the history store failed: ${err?.message}`));
    }

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
