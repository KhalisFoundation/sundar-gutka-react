import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError, constant } from "@common";
import {
  getLatestActivityDate,
  getQualifyingDates,
  getOrCreateSummary,
  updateSummary,
} from "../database/analytics";
import { DASHBOARD_ACCOUNT_TODAY_KEY } from "./dashboard/syncKeys";
import { getLocalDate, shiftDate } from "./streakDays";

// Derives the streak from the `daily_activity` history on every run, rather
// than nudging a stored counter forward one Dashboard visit at a time.
//
// The counter approach measured "days you opened the Dashboard after reading",
// not "days you read": it only advanced `last_active_date` when the screen
// happened to be opened on a day that had already qualified. Someone who read
// daily but checked the Dashboard weekly reset to 1 every week, and someone
// whose routine was "check Dashboard, then read" never advanced it at all and
// sat on 0 forever — under a week strip full of gold check marks, because that
// strip reads `daily_activity` directly and was always right.
//
// Recomputing is idempotent and order-independent, so it does not care when
// (or whether) the user visits the screen. It also heals historical damage:
// the day rows were always written correctly, so the first run after this
// change restores everyone's true streak.
/**
 * What the account did today on ANY device, or null.
 *
 * Today's day row is this device's own and is never overwritten from the
 * server, so without this a phone that did not read today would end the
 * streak even though the account read on the tablet. Written by
 * applyServerActivity on every pull; a value left over from a previous day is
 * ignored rather than trusted.
 */
const accountSecondsToday = async (today) => {
  try {
    const raw = await AsyncStorage.getItem(DASHBOARD_ACCOUNT_TODAY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.date === today && Number.isFinite(parsed.seconds) ? parsed.seconds : 0;
  } catch (_) {
    // A convenience, never a dependency: the local rows still decide.
    return 0;
  }
};

export const computeStreaks = async () => {
  try {
    const today = getLocalDate();
    const summary = await getOrCreateSummary();
    if (!summary) return;

    const [rows, newestRow, accountToday] = await Promise.all([
      getQualifyingDates(constant.MIN_DAILY_ACTIVE_SECONDS),
      getLatestActivityDate(),
      accountSecondsToday(today),
    ]);

    // The account read enough today, even if this device did not — the same
    // rule applied to the account's own total, so a phone and a tablet are
    // judged exactly as one device is.
    const accountReadToday = accountToday >= constant.MIN_DAILY_ACTIVE_SECONDS;
    const dates = accountReadToday && rows[0] !== today ? [today, ...rows] : rows;
    const newestDay = accountReadToday ? today : newestRow;

    // Nothing to derive from. On a fresh install the restore's day rows may not
    // have landed yet, and writing zeros here would wipe the streak the restore
    // just wrote. Leave the summary alone — the next focus recomputes.
    if (!newestDay) return;

    // Newest day the history REACHES, and newest day that counts as practice.
    // They are different questions and the difference is load-bearing: a day
    // of one minute is history we have and a day that does not qualify.
    const latest = dates[0] ?? null;

    // The summary claims activity on a day with no row behind it. That means a
    // restored snapshot carried a summary whose day history was truncated, so
    // the streak cannot be verified from history we do not have — better to
    // keep the restored number than to overwrite it with a known-short one.
    //
    // Measured against the newest ROW, not the newest QUALIFYING one. Against
    // the latter, any recent day under the bar read as missing history and the
    // recompute bailed out — so a lapsed streak stood for ever, and a phone
    // whose last real reading was on Thursday still showed two days on Sunday
    // because of a one-minute Friday.
    if (summary.last_active_date && summary.last_active_date > newestDay) return;

    const qualified = new Set(dates);

    // Anchor on today if it has already qualified, otherwise on yesterday: a
    // day still in progress is "at risk", not a break, so the number shouldn't
    // read 0 every morning until the user has read.
    let cursor = qualified.has(today) ? today : shiftDate(today, -1);
    let current = 0;
    while (qualified.has(cursor)) {
      current += 1;
      cursor = shiftDate(cursor, -1);
    }

    // The walk ran off the start of the history rather than stopping on a day
    // the user actually missed, so the real run may be longer than what is
    // stored locally — a restored snapshot only carries recent months. We
    // cannot disprove a bigger stored streak, so don't lower it. Any walk that
    // halted on a genuine gap INSIDE the history is trusted and does reset.
    const historyExhausted = cursor < dates[dates.length - 1];

    // Longest run anywhere in the history — one ascending pass over the same
    // list, so the all-time best is recoverable instead of inheriting whatever
    // the old counter happened to reach.
    let longest = 0;
    let run = 0;
    let prev = null;
    for (let i = dates.length - 1; i >= 0; i -= 1) {
      const date = dates[i];
      run = prev && shiftDate(prev, 1) === date ? run + 1 : 1;
      if (run > longest) longest = run;
      prev = date;
    }

    // Re-read immediately before writing. A cloud restore can land between the
    // read above and this update — both fire on Dashboard mount, and this is
    // three separate slots on the serialized DB chain, not a transaction. The
    // floors below are applied against the freshest row so a restore arriving
    // mid-computation is preserved rather than clobbered by stale values.
    const fresh = (await getOrCreateSummary()) ?? summary;
    if (fresh.last_active_date && fresh.last_active_date > newestDay) return;

    await updateSummary({
      current_streak: historyExhausted ? Math.max(current, fresh.current_streak ?? 0) : current,
      // Lifetime figures never walk backwards: a snapshot restored from a
      // device with a shorter local history must not erase a real achievement.
      longest_streak: Math.max(longest, fresh.longest_streak ?? 0),
      total_days_active: Math.max(dates.length, fresh.total_days_active ?? 0),
      // Only a qualifying day may move this: it is the anchor the walk starts
      // from, so a short day must not become the streak's last day.
      last_active_date:
        latest && latest > (fresh.last_active_date ?? "") ? latest : fresh.last_active_date,
    });
  } catch (err) {
    logError(new Error(`computeStreaks failed: ${err?.message || err}`));
  }
};
