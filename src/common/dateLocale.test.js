/* eslint-env jest */
jest.mock("./localization", () => ({
  __esModule: true,
  default: { getLanguage: jest.fn(() => "en-US") },
}));

import STRINGS from "./localization";
import {
  monthLong,
  monthShort,
  weekdayLong,
  weekdayNarrow,
  weekdayNarrowRow,
  formatMonthYear,
  formatDayMonth,
  formatWeekdayLong,
  formatFullDate,
} from "./dateLocale";

describe("dateLocale", () => {
  afterEach(() => STRINGS.getLanguage.mockReturnValue("en-US"));

  it("localises month names by the APP language, not the device", () => {
    STRINGS.getLanguage.mockReturnValue("pa");
    expect(monthLong(0)).toBe("ਜਨਵਰੀ"); // January in Gurmukhi
    STRINGS.getLanguage.mockReturnValue("hi");
    expect(monthLong(11)).toBe("दिसंबर"); // December in Devanagari
    STRINGS.getLanguage.mockReturnValue("fr");
    expect(monthShort(1)).toBe("févr.");
  });

  it("weekday arrays are Sunday-first (matches Date.getDay())", () => {
    expect(weekdayLong(0)).toBe("Sunday");
    expect(weekdayLong(1)).toBe("Monday");
    expect(weekdayNarrow(6)).toBe("S"); // Saturday
    STRINGS.getLanguage.mockReturnValue("es");
    expect(weekdayLong(3)).toBe("miércoles");
    expect(weekdayNarrow(3)).toBe("X");
  });

  it("weekdayNarrowRow reorders for Monday-first calendars", () => {
    expect(weekdayNarrowRow(false)).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
    expect(weekdayNarrowRow(true)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
  });

  it("orders day/month naturally per language", () => {
    const d = new Date(2026, 0, 5); // 5 Jan 2026
    expect(formatDayMonth(d)).toBe("January 5"); // English: month day
    STRINGS.getLanguage.mockReturnValue("fr");
    expect(formatDayMonth(d)).toBe("5 janvier"); // French: day month
    expect(formatDayMonth(d, true)).toBe("5 janv.");
  });

  it("formats month+year and long weekday", () => {
    const d = new Date(2026, 0, 5);
    expect(formatMonthYear(d)).toBe("January 2026");
    expect(formatWeekdayLong(d)).toBe("Monday"); // 5 Jan 2026 is a Monday
  });

  it("formats a full weekday-day-month-year date per language", () => {
    const d = new Date(2026, 6, 25); // Sat 25 Jul 2026 (the Vaak card date)
    expect(formatFullDate(d)).toBe("Saturday, 25 July 2026");
    STRINGS.getLanguage.mockReturnValue("hi");
    expect(formatFullDate(d)).toBe("शनिवार, 25 जुलाई 2026");
  });

  it("falls back to English for an unknown/DEFAULT language", () => {
    STRINGS.getLanguage.mockReturnValue("DEFAULT");
    expect(monthLong(0)).toBe("January");
  });
});
