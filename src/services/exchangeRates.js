import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Live foreign-exchange rates for the Seva donation page.
 *
 * The donation is charged by Qgiv **in USD**, but the app shows donors nice,
 * rounded figures in their own currency (₹, CA$, €, A$, £). To make those
 * figures — and the USD amount finally sent to Qgiv — actually *correct* (not a
 * flat placeholder factor), we pull real rates from the European Central Bank
 * via Frankfurter (https://frankfurter.dev): a free, key-less, open-source
 * endpoint. ECB publishes once per working day, which is exactly the right
 * cadence for donations — you never want a suggested amount jittering by the
 * second.
 *
 * Offline-first and jank-free by design:
 *   • rates are cached in AsyncStorage and mirrored in memory, so currency.js's
 *     synchronous conversion helpers can read them during render with no await;
 *   • a stale/absent cache never blocks the UI — the conversion helpers fall
 *     back to the baked "last-known-good" rates in services/currency.js;
 *   • a refresh runs in the background (respecting a TTL) and only swaps the
 *     in-memory rates in once a full, sane response has arrived.
 *
 * Rate convention matches currency.js: **local units per 1 USD** (USD = 1).
 */

// base=USD so every value is "local per USD" — the same convention currency.js
// uses for its static fallback rates, so the two are drop-in interchangeable.
const ENDPOINT =
  "https://api.frankfurter.dev/v1/latest?base=USD&symbols=CAD,EUR,GBP,AUD,INR";
const CACHE_KEY = "@fx_rates_v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // refresh at most once a week — donation
// suggestion amounts don't need day-to-day FX precision, and this keeps network
// use minimal (the baked fallback rates cover any gap anyway).
const FETCH_TIMEOUT_MS = 6000;
// The currencies we actually localise (USD is the base, always 1). A response
// missing any of these is rejected so we never half-apply a bad payload.
const REQUIRED = ["CAD", "EUR", "GBP", "AUD", "INR"];

// In-memory mirror of the last good rates, so currency.js can read them
// synchronously while rendering. null until the cache loads or a fetch lands.
let liveRates = null;
let liveFetchedAt = 0;
let inFlight = null;

/**
 * The live rate (local units per USD) for a currency code, or null when we have
 * no live data yet — callers then fall back to their static rate. Synchronous.
 */
export const getLiveRate = (code) =>
  liveRates && Number(liveRates[code]) > 0 ? liveRates[code] : null;

/** True when live rates are loaded (cache or network). For UI re-render gating. */
export const hasLiveRates = () => liveRates != null;

const persist = async (rates, ts) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ rates, ts }));
  } catch (_) {
    // Cache write failure is non-fatal — we still have the in-memory copy.
  }
};

/**
 * Fetches fresh rates from Frankfurter and, only on a fully-valid response,
 * swaps them into memory + cache. Any failure (offline, timeout, malformed,
 * missing a currency) is swallowed so the existing cache/fallback keeps serving.
 * De-duped: concurrent callers share one in-flight request.
 * @returns {Promise<Record<string, number>|null>}
 */
export const refreshExchangeRates = () => {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let json;
      try {
        const res = await fetch(ENDPOINT, { signal: controller.signal });
        if (!res.ok) return null;
        json = await res.json();
      } finally {
        clearTimeout(timer);
      }
      const raw = json && json.rates;
      if (!raw || typeof raw !== "object") return null;

      const clean = { USD: 1 };
      for (const code of REQUIRED) {
        const v = Number(raw[code]);
        if (!(v > 0)) return null; // reject an incomplete payload wholesale
        clean[code] = v;
      }
      liveRates = clean;
      liveFetchedAt = Date.now();
      await persist(clean, liveFetchedAt);
      return clean;
    } catch (_) {
      return null; // offline / aborted / parse error → keep cache + fallback
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
};

/**
 * Warms the in-memory rates from the AsyncStorage cache (fast), then kicks a
 * background refresh if the cache is stale or empty. Call once when the Seva
 * page mounts. Resolves after the cache read so the first render already has
 * last-session rates; the network refresh is fire-and-forget.
 * @returns {Promise<Record<string, number>|null>} the in-memory rates (may be null)
 */
export const initExchangeRates = async () => {
  if (liveRates == null) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates, ts } = JSON.parse(cached);
        if (rates && typeof rates === "object" && Number(rates.INR) > 0) {
          liveRates = rates;
          liveFetchedAt = Number(ts) || 0;
        }
      }
    } catch (_) {
      // Corrupt/absent cache → stay on fallback, let the refresh below repopulate.
    }
  }
  if (Date.now() - liveFetchedAt > TTL_MS) {
    refreshExchangeRates(); // background; do not await (no first-paint jank)
  }
  return liveRates;
};

/** Test-only: clear in-memory state so each test starts from a known baseline. */
export const __resetExchangeRatesForTest = () => {
  liveRates = null;
  liveFetchedAt = 0;
  inFlight = null;
};
