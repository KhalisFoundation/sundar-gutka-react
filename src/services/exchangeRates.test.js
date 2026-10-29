/* eslint-env jest */
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getLiveRate,
  hasLiveRates,
  refreshExchangeRates,
  initExchangeRates,
  __resetExchangeRatesForTest,
} from "./exchangeRates";

const okResponse = (rates) => ({ ok: true, json: () => Promise.resolve({ rates }) });
const FULL = { CAD: 1.41, EUR: 0.88, GBP: 0.75, AUD: 1.43, INR: 96.56 };

describe("exchangeRates", () => {
  beforeEach(() => {
    __resetExchangeRatesForTest();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockClear();
    global.fetch = jest.fn();
  });
  afterEach(() => {
    delete global.fetch;
  });

  it("returns null rates until data lands, so callers fall back", () => {
    expect(getLiveRate("INR")).toBeNull();
    expect(hasLiveRates()).toBe(false);
  });

  it("applies a full, valid response and caches it", async () => {
    global.fetch.mockResolvedValue(okResponse(FULL));
    const rates = await refreshExchangeRates();
    expect(rates.INR).toBe(96.56);
    expect(getLiveRate("CAD")).toBe(1.41);
    expect(getLiveRate("USD")).toBe(1); // base injected
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it("rejects an incomplete payload wholesale (keeps falling back)", async () => {
    global.fetch.mockResolvedValue(okResponse({ CAD: 1.41, EUR: 0.88 })); // missing GBP/AUD/INR
    const rates = await refreshExchangeRates();
    expect(rates).toBeNull();
    expect(getLiveRate("CAD")).toBeNull();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("swallows a network error and leaves state untouched", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));
    const rates = await refreshExchangeRates();
    expect(rates).toBeNull();
    expect(hasLiveRates()).toBe(false);
  });

  it("warms in-memory rates from a cached payload without any fetch", async () => {
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ rates: { ...FULL, USD: 1 }, ts: Date.now() })
    );
    global.fetch.mockResolvedValue(okResponse(FULL));
    await initExchangeRates();
    expect(getLiveRate("INR")).toBe(96.56);
    // Fresh cache (ts=now) → no background refresh fired.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("triggers a background refresh when the cache is stale", async () => {
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({ rates: { ...FULL, USD: 1 }, ts: 0 }) // ancient
    );
    global.fetch.mockResolvedValue(okResponse(FULL));
    await initExchangeRates();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
