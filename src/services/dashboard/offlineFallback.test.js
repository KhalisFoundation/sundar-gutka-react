// Proves the dashboard content survives a total network outage: no fetch can
// succeed, nothing is cached, and both cards still render real content rather
// than an error or an empty state. Also pins the two properties that make the
// fallback safe to leave on screen — it is the SAME word the API would have
// served today, and it is tagged so the UI knows to refetch when the network
// returns (see useRefetchOnReconnect).

import { getUpcomingEvents, isBundledEvent } from "./upcomingEvents";
import { getWordOfDay, isBundledWord } from "./wordOfDay";

jest.mock("@common", () => {
  const { isNetworkFailure } = require("@common/networkFailure");
  const logError = jest.fn();
  const logMessage = jest.fn();
  return {
    isNetworkFailure,
    logError,
    logMessage,
    logNetworkError: (message, error) =>
      isNetworkFailure(error) ? logMessage(message) : logError(message),
    constant: {
      WORD_OF_DAY_API_URL: "https://example.invalid/word",
      UPCOMING_EVENTS_API_URL: "https://example.invalid/events",
      DAILY_VAAK_API_URL: "https://example.invalid/vaak",
      INTERNET_CHECK_URL: "https://example.invalid/204",
    },
  };
});

const mockReadFreshCache = jest.fn();
const mockWriteCache = jest.fn();
jest.mock("./dailyCache", () => ({
  readFreshCache: (...a) => mockReadFreshCache(...a),
  writeCache: (...a) => mockWriteCache(...a),
  localDateStr: () => "2026-08-14",
}));

describe("dashboard content with no internet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Nothing cached, and every request fails the way an offline device fails.
    mockReadFreshCache.mockResolvedValue(null);
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"));
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe("Word of the Day", () => {
    it("still returns a complete word", async () => {
      const word = await getWordOfDay();

      expect(word.gurmukhi).toBeTruthy();
      expect(word.transliteration).toBeTruthy();
      expect(word.meaning).toBeTruthy();
    });

    it("tags it as a fallback so the UI refetches on reconnect", async () => {
      expect(isBundledWord(await getWordOfDay())).toBe(true);
    });

    it("does not cache it — the fallback must not outlive the outage", async () => {
      await getWordOfDay();

      expect(mockWriteCache).not.toHaveBeenCalled();
    });

    it("serves the same word the backend would for that date", async () => {
      // Backend: dayOfYear(iso) % 117, 1-based. 2026-08-14 is day 226.
      jest.useFakeTimers().setSystemTime(new Date("2026-08-14T09:00:00"));
      const word = await getWordOfDay();
      jest.useRealTimers();

      expect(226 % 117).toBe(109);
      expect(word.gurmukhi).toBe("ਕਿਤਾਬ");
    });

    it("is stable across calls on the same day", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-08-14T09:00:00"));
      const a = await getWordOfDay();
      const b = await getWordOfDay();
      jest.useRealTimers();

      expect(a.gurmukhi).toBe(b.gurmukhi);
    });
  });

  describe("Upcoming events", () => {
    it("still returns the full bundled list", async () => {
      const events = await getUpcomingEvents();

      expect(events).toHaveLength(44);
      expect(events.every((e) => e.name && typeof e.daysAway === "number")).toBe(true);
    });

    it("tags them as bundled so the UI refetches on reconnect", async () => {
      expect((await getUpcomingEvents()).every(isBundledEvent)).toBe(true);
    });

    it("does not cache them either", async () => {
      await getUpcomingEvents();

      expect(mockWriteCache).not.toHaveBeenCalled();
    });
  });

  it("neither call rejects — an outage must never surface as a section error", async () => {
    await expect(getWordOfDay()).resolves.toBeTruthy();
    await expect(getUpcomingEvents()).resolves.toBeTruthy();
  });
});

// Regression: these are called on every Discover render, including the first —
// before either fetch settles, when the card's state is still useState(null).
// They were written as `({ _source: source } = {}) => …`, and a default
// parameter only covers undefined, so null threw a TypeError during render and
// took the whole Dashboard down to the error boundary on mount.
describe("bundled-source predicates accept an unresolved card", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty object", {}],
    ["an object with no _source", { gurmukhi: "ਕਿਤਾਬ" }],
  ])("isBundledWord(%s) is false, not a throw", (_label, value) => {
    expect(() => isBundledWord(value)).not.toThrow();
    expect(isBundledWord(value)).toBe(false);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty object", {}],
    ["an object with no _source", { name: "Hola Mohalla" }],
  ])("isBundledEvent(%s) is false, not a throw", (_label, value) => {
    expect(() => isBundledEvent(value)).not.toThrow();
    expect(isBundledEvent(value)).toBe(false);
  });

  it("still recognises genuinely bundled data", () => {
    expect(isBundledWord({ _source: "fallback" })).toBe(true);
    expect(isBundledEvent({ _source: "list" })).toBe(true);
  });

  it("does not mistake network or cached data for bundled", () => {
    expect(isBundledWord({ _source: "api" })).toBe(false);
    expect(isBundledWord({ _source: "hukamnama" })).toBe(false);
    expect(isBundledEvent({ _source: "api" })).toBe(false);
  });
});
