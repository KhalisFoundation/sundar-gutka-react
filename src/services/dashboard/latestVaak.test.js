/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
/**
 * WHICH hukamnama the card shows: the most recent one that exists.
 *
 * The darbar reads the day's first hukamnama around 05:00–05:30 IST, but that
 * time moves with the Punjabi months and publication lags it by an unknown
 * amount. So the day is not decided from a clock at all — the newest day is
 * asked for first and the day before is the fallback, which means the new
 * hukamnama appears the moment it exists rather than at some hour we guessed.
 *
 * The user's own timezone never enters into it: IST decides the day, and the
 * card prints that day's date beside the shabad.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "@common";
import { isOnline } from "./connectivity";
import { getDailyVaak } from "./dailyVaak";

jest.mock("@common", () => ({
  logError: jest.fn(),
  constant: { DAILY_VAAK_API_URL: "http://backend.test/dashboard/daily-vaak" },
}));
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

const istKey = (offsetDays = 0) => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 5.5 * 3600000 + offsetDays * 86400000);
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(
    ist.getDate()
  ).padStart(2, "0")}`;
};

const TODAY = istKey(0);
const YESTERDAY = istKey(-1);

const baniDbVaak = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return {
    date: { gregorian: { year: y, month: m, date: d } },
    shabads: [
      {
        shabadInfo: { shabadId: 999, pageNo: 737, raag: { unicode: "ਰਾਗੁ ਸੂਹੀ" } },
        verses: [
          { verse: { unicode: "ਬਾਣੀ ਲਾਈਨ ੧ ॥" }, translation: { en: { bdb: "Real line one." } } },
        ],
      },
    ],
  };
};

const backendVaak = (date) => ({
  date,
  lines: ["ਲਾਈਨ ੧ ॥"],
  translation: "Line one.",
  shabadId: 123,
});

/** BaniDB answers only for the days in `have`; anything else 404s like the real one. */
const routeFetch = ({ have = [], backend = null } = {}) => {
  global.fetch = jest.fn(async (url) => {
    const str = String(url);
    if (str.includes("banidb.com")) {
      const [, y, m, d] = str.match(/hukamnamas\/(\d+)\/(\d+)\/(\d+)/);
      const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (!have.includes(key)) return { ok: false, status: 404 };
      return { ok: true, json: async () => baniDbVaak(key) };
    }
    if (!backend) throw new Error("unreachable");
    return { ok: true, json: async () => backend };
  });
};

const requestedDays = () =>
  global.fetch.mock.calls
    .map(([url]) => String(url).match(/hukamnamas\/(\d+)\/(\d+)\/(\d+)/))
    .filter(Boolean)
    .map(([, y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  isOnline.mockResolvedValue(true);
});

describe("the newest hukamnama that exists", () => {
  it("takes today's the moment it is published, whatever the hour", async () => {
    routeFetch({ have: [TODAY, YESTERDAY] });
    const vaak = await getDailyVaak({ requireOnline: true });
    expect(requestedDays()[0]).toBe(TODAY);
    expect(vaak.istDate).toBe(TODAY);
  });

  it("falls back to the day before while today's does not exist yet", async () => {
    routeFetch({ have: [YESTERDAY] });
    const vaak = await getDailyVaak({ requireOnline: true });
    expect(requestedDays()).toEqual([TODAY, YESTERDAY]);
    // Labelled as the day it is actually for — never as today's.
    expect(vaak.istDate).toBe(YESTERDAY);
  });

  it("does not report a not-yet-published day as an error", async () => {
    routeFetch({ have: [YESTERDAY] });
    await getDailyVaak({ requireOnline: true });
    // A 404 for today is an answer, not a fault; only real failures are logged.
    expect(logError).not.toHaveBeenCalled();
  });

  it("upgrades to today's as soon as it appears, without anyone asking", async () => {
    routeFetch({ have: [YESTERDAY] });
    expect((await getDailyVaak({ requireOnline: true })).istDate).toBe(YESTERDAY);

    // The stand-in is cached with a short life, so the next read looks again.
    const entry = JSON.parse(await AsyncStorage.getItem(CACHE_KEY));
    expect(entry.date).toBe(YESTERDAY);
    expect(entry.expiresAt).toBeGreaterThan(Date.now());

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...entry, expiresAt: Date.now() - 1 }));
    routeFetch({ have: [TODAY, YESTERDAY] });
    expect((await getDailyVaak({ requireOnline: true })).istDate).toBe(TODAY);
  });

  it("keeps today's for the whole day once it has it — nothing newer can exist", async () => {
    routeFetch({ have: [TODAY, YESTERDAY] });
    await getDailyVaak({ requireOnline: true });
    const entry = JSON.parse(await AsyncStorage.getItem(CACHE_KEY));
    expect(entry.date).toBe(TODAY);
    expect(entry.expiresAt).toBeUndefined();

    await getDailyVaak({ requireOnline: true });
    expect(requestedDays()).toEqual([TODAY]); // served from cache, no refetch
  });

  it("accepts the backend only for one of the two days it may name", async () => {
    routeFetch({ have: [], backend: backendVaak(YESTERDAY) });
    const vaak = await getDailyVaak({ requireOnline: true });
    expect(vaak.istDate).toBe(YESTERDAY);
    expect(vaak._source).toBe("api");
  });

  it("refuses a backend answer older than both", async () => {
    routeFetch({ have: [], backend: backendVaak(istKey(-3)) });
    await expect(getDailyVaak({ requireOnline: true })).rejects.toThrow("daily vaak unavailable");
  });
});

describe("the manual refresh button", () => {
  it("skips the cache, so asking actually asks", async () => {
    routeFetch({ have: [TODAY, YESTERDAY] });
    await getDailyVaak({ requireOnline: true });
    await getDailyVaak({ requireOnline: true });
    expect(requestedDays()).toEqual([TODAY]);

    await getDailyVaak({ requireOnline: true, force: true });
    expect(requestedDays()).toEqual([TODAY, TODAY]);
  });
});
