import { getNanakshahiDate, fetchNanakshahiDate } from "./nanakshahiDate";

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
    constant: { NANAKSHAHI_DATE_API_URL: "https://example.invalid/nanakshahi-date" },
  };
});

const mockReadFreshCache = jest.fn();
const mockWriteCache = jest.fn();
jest.mock("./dailyCache", () => ({
  readFreshCache: (...a) => mockReadFreshCache(...a),
  writeCache: (...a) => mockWriteCache(...a),
  localDateStr: () => "2026-08-18",
}));

const at = (iso) => new Date(`${iso}T12:00:00`);

describe("the bundled Nanakshahi table", () => {
  // Pinned against the calendar the backend serves, queried per month at
  // /v1/ns/558/:month/1. The table was previously built on the 2003 calendar
  // and was a day out for five months of the year — Bhadon, Assu, Katik,
  // Maghar and Poh — which is exactly the disagreement with the gurpurab list
  // that moving to one source was meant to end. Offline has to agree with
  // online or the date changes when the signal drops.
  it.each([
    ["2026-03-14", "1 Chet"],
    ["2026-04-14", "1 Vaisakh"],
    ["2026-05-15", "1 Jeth"],
    ["2026-06-15", "1 Harh"],
    ["2026-07-16", "1 Sawan"],
    ["2026-08-17", "1 Bhadon"],
    ["2026-09-17", "1 Assu"],
    ["2026-10-17", "1 Katik"],
    ["2026-11-16", "1 Maghar"],
    ["2026-12-16", "1 Poh"],
    ["2027-01-14", "1 Magh"],
    ["2027-02-13", "1 Phagun"],
  ])("starts the month on %s -> %s", (iso, expected) => {
    expect(getNanakshahiDate(at(iso)).label).toContain(expected);
  });

  it("agrees with the API on today, so nothing flips when the network returns", () => {
    expect(getNanakshahiDate(at("2026-08-18")).label).toBe("2 Bhadon (ਭਾਦੋਂ)");
  });

  it("counts days within a month rather than restarting", () => {
    expect(getNanakshahiDate(at("2026-11-24")).label).toBe("9 Maghar (ਮੱਘਰ)");
  });

  it("carries a January date back into the previous year's Poh", () => {
    // Poh begins 16 Dec, so 5 Jan is still Poh — not a month that started
    // later in the same calendar year.
    expect(getNanakshahiDate(at("2027-01-05")).monthName).toBe("Poh");
  });

  it("never returns a day below 1 or an empty label", () => {
    ["2026-03-14", "2026-08-16", "2027-01-01", "2027-03-13"].forEach((iso) => {
      const r = getNanakshahiDate(at(iso));
      expect(r.day).toBeGreaterThanOrEqual(1);
      expect(r.label).toMatch(/^\d+ \w+ \(.+\)$/);
    });
  });

  it("is tagged local, so a caller can tell it from the served value", () => {
    expect(getNanakshahiDate(at("2026-08-18"))).toMatchObject({ _source: "local" });
  });
});

describe("fetchNanakshahiDate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadFreshCache.mockResolvedValue(null);
  });

  afterEach(() => {
    delete global.fetch;
  });

  it("returns the served value and caches it for the day", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ label: "2 Bhadon (ਭਾਦੋਂ)", day: 2, year: 558 }),
    });

    await expect(fetchNanakshahiDate()).resolves.toMatchObject({
      label: "2 Bhadon (ਭਾਦੋਂ)",
      _source: "api",
    });
    expect(mockWriteCache).toHaveBeenCalled();
  });

  it("serves today's cache without going to the network", async () => {
    mockReadFreshCache.mockResolvedValue({ label: "cached", _source: "api" });
    global.fetch = jest.fn();

    await expect(fetchNanakshahiDate()).resolves.toMatchObject({ label: "cached" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // The header keeps its bundled label on a null, so every failure below has to
  // resolve rather than throw — an unhandled rejection here would surface as a
  // section error over a date that was already correct on screen.
  it("resolves null when the request fails, rather than throwing", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"));

    await expect(fetchNanakshahiDate()).resolves.toBeNull();
  });

  it("resolves null on a non-OK response", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

    await expect(fetchNanakshahiDate()).resolves.toBeNull();
  });

  it("resolves null on a 200 carrying no label, and caches nothing", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

    await expect(fetchNanakshahiDate()).resolves.toBeNull();
    expect(mockWriteCache).not.toHaveBeenCalled();
  });
});
