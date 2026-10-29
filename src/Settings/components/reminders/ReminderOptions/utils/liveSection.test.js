/* eslint-env jest */
import { isCustomTitle, liveSection } from "./index";

jest.mock("@common/localization", () => ({
  __esModule: true,
  default: {
    time_for: "Time for",
    getString: (key, lang) =>
      ({
        "en-US": "Time for",
        hi: "समां है",
        pa: "ਸਮਾਂ ਹੈ",
        fr: "Il est temps de",
        it: "È l'ora di",
        es: "Es ora de",
      }[lang]),
  },
}));
jest.mock("@common/actions", () => ({ setReminderBanis: jest.fn() }));
jest.mock("@common", () => ({
  scheduleReminders: jest.fn(),
  constant: {},
  trackReminderEvent: jest.fn(),
  STRINGS: {
    time_for: "Time for",
    getString: (key, lang) =>
      ({
        "en-US": "Time for",
        hi: "समां है",
        pa: "ਸਮਾਂ ਹੈ",
        fr: "Il est temps de",
        it: "È l'ora di",
        es: "Es ora de",
      }[lang]),
  },
}));

// The edit sheet used to be handed the row captured at tap time, so a title
// saved from the sheet was not what the sheet showed when it reopened.
describe("liveSection", () => {
  const stored = [
    { key: 2, id: 2, title: "Time for japji", time: "3:30 AM", enabled: true },
    { key: 4, id: 4, title: "Time for jaap", time: "6:00 PM", enabled: false },
  ];
  const rows = [
    { key: 2, translit: "japji", gurmukhi: "jpujI", label: "japji", title: "stale", time: "stale" },
  ];

  it("is null while nothing is being edited", () => {
    expect(liveSection(stored, rows, null)).toBeNull();
  });

  it("reads title, time and enabled from the store, not the tapped snapshot", () => {
    const tapped = { key: 2, title: "Time for japji", time: "3:30 AM" };
    const later = [{ ...stored[0], title: "Renamed", time: "4:00 AM" }, stored[1]];
    expect(liveSection(later, rows, tapped)).toMatchObject({ title: "Renamed", time: "4:00 AM" });
  });

  it("keeps the row's resolved bani text alongside the stored fields", () => {
    expect(liveSection(stored, rows, { key: 2 })).toMatchObject({
      translit: "japji",
      gurmukhi: "jpujI",
      label: "japji",
      title: "Time for japji",
    });
  });

  it("still works before the rows have resolved", () => {
    expect(liveSection(stored, [], { key: 4 })).toMatchObject({ title: "Time for jaap" });
  });

  it("is null once the reminder has been deleted, so the sheet closes", () => {
    expect(liveSection(stored, rows, { key: 99 })).toBeNull();
  });
});

// The row shows a title the user wrote; a stock one leaves the bani's name.
describe("isCustomTitle", () => {
  it("is true for a title flagged by a rename", () => {
    expect(isCustomTitle({ title: "Time for japji", titleCustom: true })).toBe(true);
  });

  it("is true for typed text with no flag — a rename made before the flag existed", () => {
    expect(isCustomTitle({ title: "idk" })).toBe(true);
  });

  it("is false for the stock title in any of the six languages", () => {
    expect(isCustomTitle({ title: "Time for japji" })).toBe(false);
    expect(isCustomTitle({ title: "समां है japji" })).toBe(false);
    expect(isCustomTitle({ title: "ਸਮਾਂ ਹੈ japji" })).toBe(false);
    expect(isCustomTitle({ title: "Il est temps de japji" })).toBe(false);
    expect(isCustomTitle({ title: "È l'ora di japji" })).toBe(false);
    expect(isCustomTitle({ title: "Es ora de japji" })).toBe(false);
  });

  it("is false with no title at all", () => {
    expect(isCustomTitle({})).toBe(false);
    expect(isCustomTitle(null)).toBe(false);
  });
});
