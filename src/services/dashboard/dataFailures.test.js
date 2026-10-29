/* eslint-env jest */
import { OfflineError } from "./connectivity";
import { getDailyVaak } from "./dailyVaak";
import { isExpectedDataFailure, UnavailableError } from "./dataFailures";

// "daily vaak unavailable" was the third most frequent non-fatal of the 6.0.0
// rollout: both sources asked, neither had the day's hukamnama, and the card
// recorded the plain Error it was thrown. The answer is now typed, so every
// section can tell "nothing to show" from a fault without matching on words.

jest.mock("@common", () => ({
  constant: { DAILY_VAAK_API_URL: "", INTERNET_CHECK_URL: "https://example.org/204" },
  logNetworkError: jest.fn(),
}));
jest.mock("./dailyCache", () => ({
  readFreshCache: jest.fn(() => Promise.resolve(null)),
  writeCache: jest.fn(() => Promise.resolve()),
}));

describe("isExpectedDataFailure", () => {
  it("is true for the two answers a section renders as a state", () => {
    expect(isExpectedDataFailure(new OfflineError())).toBe(true);
    expect(isExpectedDataFailure(new UnavailableError("daily vaak unavailable"))).toBe(true);
  });

  it("is false for anything else, including nothing at all", () => {
    expect(isExpectedDataFailure(new Error("no such table"))).toBe(false);
    expect(isExpectedDataFailure("Network request failed")).toBe(false);
    expect(isExpectedDataFailure(null)).toBe(false);
  });
});

describe("getDailyVaak with nothing published", () => {
  it("rejects with the typed unavailable answer, not a plain error", async () => {
    // BaniDB answers 404 for today and for the day before: an answer, not a
    // fault, and with no secondary backend configured there is nothing left.
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));

    await expect(getDailyVaak()).rejects.toBeInstanceOf(UnavailableError);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const { logNetworkError } = jest.requireMock("@common");
    expect(logNetworkError).not.toHaveBeenCalled();
  });
});
