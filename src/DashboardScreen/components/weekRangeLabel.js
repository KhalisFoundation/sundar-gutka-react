import { formatDayMonth } from "@common/dateLocale";
import { STRINGS } from "@common";

/**
 * Heading for a seven-day window, shared by the two places on the Dashboard
 * that step through weeks: the streak strip and the minutes chart. They stay
 * worded identically because they read the same function — the chart's label
 * was the original, and the strip used to carry no heading at all, so the two
 * week pickers sitting one above the other disagreed about which week you were
 * looking at.
 *
 * @param {Date[]} days - The seven days, oldest first.
 * @param {boolean} isCurrentWeek - True for the window that contains today.
 * @returns {string} "This week", else the range ("Jan 5 – 11", "Jan 29 – Feb 4").
 */
const weekRangeLabel = (days, isCurrentWeek) => {
  if (isCurrentWeek) return STRINGS.THIS_WEEK;
  const first = days?.[0];
  const last = days?.[6];
  // The strip builds its week asynchronously, so it renders once before there
  // is a week to name. An empty heading is better than "undefined – undefined".
  if (!first || !last) return "";
  const sameMonth = first.getMonth() === last.getMonth();
  // Within one month, the closing label is just the day number ("Jan 5 – 11").
  const lastLabel = sameMonth ? String(last.getDate()) : formatDayMonth(last, true);
  return `${formatDayMonth(first, true)} – ${lastLabel}`;
};

export default weekRangeLabel;
