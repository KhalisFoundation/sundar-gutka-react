/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
/**
 * Tests for the dashboard network services' fallback + error handling:
 *  - emergencyShabads.json data integrity (the offline Random Shabad bundle)
 *  - getRandomShabad: online → API, offline/error → emergency list (never throws)
 *  - getDailyVaak: offline/API failure → throws (never fabricates a hukamnama)
 *
 * @common and @database are mocked so we don't pull the Firebase-laden barrel or
 * the native SQLite layer into the test.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { isOnline } from "./connectivity";
import { getDailyVaak } from "./dailyVaak";
import emergency from "./emergencyShabads.json";
import { getRandomShabad } from "./randomShabad";

// jest.mock calls are hoisted above the imports above by babel-jest.
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
    // A configured backend URL (≠ BaniDB) so we can exercise the backend→BaniDB fallback.
    constant: {
      DAILY_VAAK_API_URL: "http://backend.test/dashboard/daily-vaak",
      WORD_OF_DAY_API_URL: "",
    },
  };
});
jest.mock("@database", () => ({ getRandomTukk: jest.fn().mockResolvedValue(null) }));
jest.mock("./connectivity", () => {
  class OfflineError extends Error {
    constructor() {
      super("offline");
      this.name = "OfflineError";
      this.offline = true;
    }
  }
  return { isOnline: jest.fn(), OfflineError };
});

const GURMUKHI_RANGE = /[਀-੿]/; // Gurmukhi Unicode block

const apiShabadPayload = {
  shabadInfo: { shabadId: 999, pageNo: 100, raag: { unicode: "ਰਾਗੁ ਮਾਝ" } },
  verses: [
    { verse: { unicode: "ਟੈਸਟ ਲਾਈਨ ੧ ॥" }, translation: { en: { bdb: "Test line one." } } },
    { verse: { unicode: "ਟੈਸਟ ਲਾਈਨ ੨ ॥" }, translation: { en: { bdb: "Test line two." } } },
  ],
};

const mockFetchOnce = (payload, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => payload });
};

beforeEach(async () => {
  jest.clearAllMocks();
  // getDailyVaak caches today's result in AsyncStorage (dailyCache.js). The
  // community AsyncStorage jest mock is a real in-memory store that persists
  // across `it()` blocks in the same file, so without clearing it here, the
  // first successful getDailyVaak call poisons every later test with its
  // cached result regardless of that test's own fetch mock.
  await AsyncStorage.clear();
});

describe("emergencyShabads.json integrity", () => {
  const list = emergency.shabads;

  it("bundles a healthy set of shabads with unique ids", () => {
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(50);
    const ids = list.map((s) => s.shabadId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has the fields the card needs", () => {
    list.forEach((s) => {
      expect(Array.isArray(s.lines)).toBe(true);
      expect(s.lines.length).toBeGreaterThanOrEqual(1);
      expect(s.lines.join(" ")).toMatch(GURMUKHI_RANGE);
      expect(typeof s.translation).toBe("string");
      expect(s.translation.trim().length).toBeGreaterThan(0);
      expect(Number.isInteger(s.ang)).toBe(true);
      expect(s.ang).toBeGreaterThanOrEqual(1);
      expect(s.ang).toBeLessThanOrEqual(1430);
      expect(Number.isInteger(s.shabadId)).toBe(true);
    });
  });
});

describe("getRandomShabad fallback chain", () => {
  it("returns the API shabad when online", async () => {
    isOnline.mockResolvedValue(true);
    mockFetchOnce(apiShabadPayload);
    const res = await getRandomShabad({ language: "en" });
    expect(res._source).toBe("api");
    expect(res.lines).toHaveLength(2);
    expect(res.shabadId).toBe(999);
    expect(res.raag).toBe("ਰਾਗੁ ਮਾਝ");
  });

  it("falls back to the emergency list when offline (with a Read-Shabad id)", async () => {
    isOnline.mockResolvedValue(false);
    global.fetch = jest.fn();
    const res = await getRandomShabad({ language: "en" });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(res._source).toBe("emergency");
    expect(res.shabadId).toEqual(expect.any(Number));
    expect(res.lines.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to the emergency list when online fetch fails", async () => {
    isOnline.mockResolvedValue(true);
    global.fetch = jest.fn().mockRejectedValue(new Error("network"));
    const res = await getRandomShabad({ language: "en" });
    expect(res._source).toBe("emergency");
  });

  it("never rejects", async () => {
    isOnline.mockRejectedValue(new Error("boom"));
    await expect(getRandomShabad({ language: "en" })).resolves.toBeDefined();
  });
});

describe("getDailyVaak error handling", () => {
  it("throws OfflineError when offline (never fabricates a vaak)", async () => {
    isOnline.mockResolvedValue(false);
    await expect(getDailyVaak({ requireOnline: true })).rejects.toMatchObject({ offline: true });
  });

  it("returns the hukamnama from a raw BaniDB payload when online", async () => {
    isOnline.mockResolvedValue(true);
    mockFetchOnce({ shabads: [apiShabadPayload] });
    const res = await getDailyVaak({ requireOnline: true });
    // BaniDB is the primary source (see dailyVaak.js's design comment) — it
    // answers first here, so the configured backend is never even called.
    expect(res._source).toBe("banidb");
    expect(res.lines).toHaveLength(2);
    expect(res.source).toBe("Sri Darbar Sahib");
  });

  it("accepts a clean backend shape ({ lines, translation, ... })", async () => {
    isOnline.mockResolvedValue(true);
    mockFetchOnce({
      lines: ["ਲਾਈਨ ੧", "ਲਾਈਨ ੨"],
      translation: "Backend translation.",
      ang: 657,
      shabadId: 42,
    });
    const res = await getDailyVaak({ requireOnline: true });
    expect(res.lines).toEqual(["ਲਾਈਨ ੧", "ਲਾਈਨ ੨"]);
    expect(res.translation).toBe("Backend translation.");
    expect(res.ang).toBe(657);
    expect(res.shabadId).toBe(42);
  });

  it("falls back to the configured backend when BaniDB is unreachable", async () => {
    isOnline.mockResolvedValue(true);
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("banidb down")) // BaniDB (primary)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ shabads: [apiShabadPayload] }) }); // configured backend, answering with a raw BaniDB-shaped payload
    const res = await getDailyVaak({ requireOnline: true });
    // The backend's payload has no top-level `lines`, so parseVaak falls through
    // to the same BaniDB-shape mapping — which always tags "banidb" regardless
    // of which URL actually answered.
    expect(res._source).toBe("banidb");
    expect(res.lines).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws (not a mock) when both backend and BaniDB fail", async () => {
    isOnline.mockResolvedValue(true);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(getDailyVaak({ requireOnline: true })).rejects.toThrow();
  });

  it("throws when the payload has no verses", async () => {
    isOnline.mockResolvedValue(true);
    mockFetchOnce({ shabads: [{ shabadInfo: {}, verses: [] }] });
    await expect(getDailyVaak({ requireOnline: true })).rejects.toThrow();
  });
});
