import { constant, STRINGS } from "@common";
import Discover from "./Discover";
import ExploreGurbani from "./ExploreGurbani";
import MonthCalendar from "./MonthCalendar";
import RemindersCard from "./RemindersCard";
import ShabadVaak from "./ShabadVaak";
import StreakCard from "./StreakCard";
import TodaysNitnem from "./TodaysNitnem";
import WeekChart from "./WeekChart";
import YourPractice from "./YourPractice";

const S = constant.DASHBOARD_SECTIONS;

// Single source of truth for dashboard sections: maps a section key to its
// component and a human label (for the layout editor). Order of this map is the
// canonical default order, mirrored by DEFAULT_DASHBOARD_ORDER in reducer.js.
// Every label resolves through STRINGS. Hardcoded English literals used to live
// here, which meant the layout editor showed English in every language and went
// stale whenever a section was renamed — it still read "Explore Gurbani" after
// that section became "Explore".
//
// STREAK uses CURRENT_STREAK, not DAY_STREAK: the latter is the lowercase
// "day streak" fragment in the card's "12 day streak" line, not a heading.
export const SECTION_REGISTRY = {
  [S.STREAK]: { Component: StreakCard, labelKey: "CURRENT_STREAK" },
  [S.NITNEM]: { Component: TodaysNitnem, labelKey: "TODAYS_NITNEM" },
  [S.SHABAD_VAAK]: { Component: ShabadVaak, labelKey: "SECTION_SHABAD_VAAK" },
  [S.EXPLORE]: { Component: ExploreGurbani, labelKey: "EXPLORE" },
  [S.DISCOVER]: { Component: Discover, labelKey: "DISCOVER" },
  [S.REMINDERS]: { Component: RemindersCard, labelKey: "REMINDERS_TITLE" },
  // The section key stays `practice` — it is persisted in every user's layout —
  // while the heading it shows is "Insights".
  [S.PRACTICE]: { Component: YourPractice, labelKey: "INSIGHTS" },
  [S.CALENDAR]: { Component: MonthCalendar, labelKey: "ACTIVITY" },
  [S.WEEK_CHART]: { Component: WeekChart, labelKey: "THIS_WEEK" },
};

export const sectionLabel = (key) => {
  const entry = SECTION_REGISTRY[key];
  if (!entry) return key;
  // Falls back to the key rather than rendering `undefined` if a string is
  // ever missing for the active language.
  return STRINGS[entry.labelKey] || key;
};

export default SECTION_REGISTRY;
