/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
/**
 * The card showed YESTERDAY'S hukamnama while the "Read Hukamnama" button — a
 * hardcoded link to the live STTM page — showed the right one.
 *
 * BaniDB publishes the new hukamnama some time after IST midnight. Until it
 * does, both it and the backend that proxies it keep answering with yesterday's
 * shabad, and the backend says so in its own `date` field. Both mappers used to
 * stamp `istDate: istDateKey()` over the top of that, so the stale shabad was
 * relabelled as today's and written into the cache under today's key. From then
 * on `readFreshCache` short-circuited before any network call, so the card
 * stayed a day behind until IST midnight — no retry could rescue it.
 *
 * Three properties fix it, and each is pinned below: reject a payload that
 * names another day, never cache one, and give the fallback source a short life
 * so BaniDB is picked up as soon as it publishes.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isOnline } from "./connectivity";
import { getDailyVaak } from "./dailyVaak";

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
    constant: { DAILY_VAAK_API_URL: "http://backend.test/dashboard/daily-vaak" },
  };
});
jest.mock("@database", () => ({ getRandomTukk: jest.fn().mockResolvedValue(null) }));
jest.mock("./connectivity", () => {
  class OfflineError extends Error {
    constructor() {
      super("offline");
      this.offline = true;
    }
  }
  return { isOnline: jest.fn(), OfflineError };
});

const CACHE_KEY = "@daily_vaak_cache_v4";

// The same IST arithmetic dailyVaak uses, so the tests do not drift at 18:30 UTC.
const istKey = (offsetDays = 0) => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 5.5 * 3600000 + offsetDays * 86400000);
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(
    ist.getDate()
  ).padStart(2, "0")}`;
};

const TODAY = istKey(0);
// Today and the day before are BOTH acceptable — the newest that exists wins,
// and before the darbar has read the new one that is yesterday's. Anything
// older than the pair is stale and must be refused.
const TOO_OLD = istKey(-2);

/** Our backend's clean shape, for whichever day it says. */
const backendVaak = (date) => ({
  date,
  lines: ["ਲਾਈਨ ੧ ॥", "ਲਾਈਨ ੨ ॥"],
  translation: "Line one.",
  raag: "ਰਾਗੁ ਸੋਰਠਿ",
  ang: 598,
  shabadId: 123,
  source: "Sri Darbar Sahib",
});

/** A raw BaniDB hukamnama payload, for whichever day it says. */
const baniDbVaak = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return {
    date: { gregorian: { year: y, month: m, date: d } },
    shabads: [
      {
        shabadInfo: { shabadId: 999, pageNo: 737, raag: { unicode: "ਰਾਗੁ ਸੂਹੀ" } },
        verses: [
          { verse: { unicode: "ਬਾਣੀ ਲਾਈਨ ੧ ॥" }, translation: { en: { bdb: "Real line one." } } },
          { verse: { unicode: "ਬਾਣੀ ਲਾਈਨ ੨ ॥" }, translation: { en: { bdb: "Real line two." } } },
        ],
      },
    ],
  };
};

/** Answers the BaniDB host and the backend host differently. */
const routeFetch = (baniDb, backend) => {
  global.fetch = jest.fn(async (url) => {
    const payload = String(url).includes("banidb.com") ? baniDb : backend;
    if (!payload) throw new Error("unreachable");
    return { ok: true, json: async () => payload };
  });
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  isOnline.mockResolvedValue(true);
});

describe("a source still serving yesterday", () => {
  it("REGRESSION: refuses a stale shabad instead of relabelling it as today's", async () => {
    routeFetch(null, backendVaak(TOO_OLD));
    await expect(getDailyVaak({ requireOnline: true })).rejects.toThrow("daily vaak unavailable");
  });

  it("REGRESSION: does not cache a refused answer, so the next try is not poisoned", async () => {
    routeFetch(null, backendVaak(TOO_OLD));
    await expect(getDailyVaak({ requireOnline: true })).rejects.toThrow();
    // The bug: a stale payload written under TODAY's key short-circuited every
    // later call until IST midnight.
    expect(await AsyncStorage.getItem(CACHE_KEY)).toBeNull();

    // BaniDB publishes; the very next load is correct rather than a day behind.
    routeFetch(baniDbVaak(TODAY), backendVaak(TOO_OLD));
    const fresh = await getDailyVaak({ requireOnline: true });
    expect(fresh._source).toBe("banidb");
    expect(fresh.istDate).toBe(TODAY);
  });

  it("refuses a stale BaniDB payload too — the primary source is not exempt", async () => {
    routeFetch(baniDbVaak(TOO_OLD), null);
    await expect(getDailyVaak({ requireOnline: true })).rejects.toThrow();
  });

  it("still accepts an UNDATED payload — silence is not a contradiction", async () => {
    // BaniDB is asked for an explicit date in the URL, so an answer that omits
    // the date is still an answer to that question.
    const undated = baniDbVaak(TODAY);
    delete undated.date;
    routeFetch(undated, null);
    const res = await getDailyVaak({ requireOnline: true });
    expect(res.istDate).toBe(TODAY);
  });
});

describe("caching the two sources differently", () => {
  it("caches BaniDB for the whole day — it is the source of truth", async () => {
    routeFetch(baniDbVaak(TODAY), null);
    await getDailyVaak({ requireOnline: true });
    const entry = JSON.parse(await AsyncStorage.getItem(CACHE_KEY));
    expect(entry.date).toBe(TODAY);
    expect(entry.expiresAt).toBeUndefined();
  });

  it("gives the backend fallback a SHORT life, so BaniDB can still win today", async () => {
    // A full-day cache of the fallback pinned the card to it until tomorrow,
    // even once BaniDB had published the real hukamnama.
    routeFetch(null, backendVaak(TODAY));
    const res = await getDailyVaak({ requireOnline: true });
    expect(res._source).toBe("api");
    const entry = JSON.parse(await AsyncStorage.getItem(CACHE_KEY));
    expect(entry.expiresAt).toBeGreaterThan(Date.now());
    expect(entry.expiresAt).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000);
  });

  it("serves the fallback from cache while it is young — no refetch per mount", async () => {
    routeFetch(null, backendVaak(TODAY));
    await getDailyVaak({ requireOnline: true });
    const callsAfterFirst = global.fetch.mock.calls.length;
    await getDailyVaak({ requireOnline: true });
    expect(global.fetch.mock.calls.length).toBe(callsAfterFirst);
  });

  it("re-fetches once the fallback's life is over, and upgrades to BaniDB", async () => {
    routeFetch(null, backendVaak(TODAY));
    await getDailyVaak({ requireOnline: true });

    // Age the entry past its TTL rather than mocking the clock.
    const entry = JSON.parse(await AsyncStorage.getItem(CACHE_KEY));
    entry.expiresAt = Date.now() - 1;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));

    routeFetch(baniDbVaak(TODAY), backendVaak(TODAY));
    const res = await getDailyVaak({ requireOnline: true });
    expect(res._source).toBe("banidb");
  });
});
