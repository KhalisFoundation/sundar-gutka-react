import { constant } from "@common";

// Day-boundary helpers for the streak engine. Kept in their own module rather
// than inline in streakEngine.js so the Dashboard's week strip can adopt the
// same definitions — both surfaces render from the same `daily_activity` rows
// and have to agree on where a day starts, or the big streak number and the
// gold check marks end up disagreeing on the same card.

// YYYY-MM-DD in the device's LOCAL timezone. Deliberately not toISOString(),
// which is UTC and would roll the day over at the wrong moment for anyone not
// on GMT — useReadingSession/useListeningSession key `daily_activity` on the
// local day, so reads have to match how the writes were keyed.
export const getLocalDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

// Shifts a YYYY-MM-DD key by whole days and returns the new key.
//
// Goes through the local-time Date constructor rather than adding milliseconds:
// the constructor normalizes out-of-range day numbers for us (month rollover,
// year rollover, leap days), and because it works in local time it stays
// correct across a DST transition, where a calendar day is 23 or 25 hours
// rather than 24.
export const shiftDate = (ymd, deltaDays) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return getLocalDate(new Date(y, m - 1, d + deltaDays));
};

// A clock correction mid-session can make a span arbitrarily long, and without
// a bound that would be one day row written per day crossed. Past this many
// days the remainder is left on the last day rather than fanned out.
const MAX_SPAN_DAYS = 32;

// Splits a [startMs, endMs) span across the local calendar days it covers,
// returning a { "YYYY-MM-DD": milliseconds } map.
//
// A sitting that runs past midnight belongs to both days. Stamping the whole
// session with the date at flush time credited every second of it to the day it
// happened to END on, so the day the user was actually reading got nothing —
// and could lose a streak it had earned.
//
// Boundaries come from the local-time Date constructor rather than from adding
// 24h, so a DST transition (a 23- or 25-hour day) still splits at the real
// local midnight.
export const splitSpanByLocalDay = (startMs, endMs) => {
  const byDay = {};
  if (!(endMs > startMs)) return byDay;
  let cursor = startMs;
  for (let day = 0; day < MAX_SPAN_DAYS && cursor < endMs; day += 1) {
    const at = new Date(cursor);
    const nextMidnight = new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1).getTime();
    const sliceEnd = day === MAX_SPAN_DAYS - 1 ? endMs : Math.min(nextMidnight, endMs);
    const key = getLocalDate(at);
    byDay[key] = (byDay[key] ?? 0) + (sliceEnd - cursor);
    cursor = sliceEnd;
  }
  return byDay;
};

// Rounds a { date: milliseconds } map to whole seconds per day, oldest first.
//
// The total is preserved exactly — the last day absorbs the rounding remainder
// — so the day rows always add up to the duration written on the session row
// rather than drifting a second apart from it.
export const secondsPerDay = (msByDay) => {
  const dates = Object.keys(msByDay).sort();
  const total = Math.round(dates.reduce((sum, date) => sum + msByDay[date], 0) / 1000);
  let allocated = 0;
  return dates
    .map((date, i) => {
      const seconds =
        i === dates.length - 1 ? Math.max(0, total - allocated) : Math.round(msByDay[date] / 1000);
      allocated += seconds;
      return { date, seconds };
    })
    .filter((slice) => slice.seconds > 0);
};

// The one definition of "this day counts". Every surface that draws a day as
// active — the streak number, the week strip, both calendars — must agree with
// the SQL in getQualifyingDates, so they all route through here rather than
// re-implementing the comparison. Reading and listening are POOLED: the day is
// active once their sum clears the bar, not when either does alone.
export const dayQualifies = (row) =>
  !!row &&
  (row.reading_seconds ?? 0) + (row.listening_seconds ?? 0) >= constant.MIN_DAILY_ACTIVE_SECONDS;
