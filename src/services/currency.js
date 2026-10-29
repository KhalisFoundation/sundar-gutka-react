import { NativeModules, Platform } from "react-native";
import { getLiveRate } from "./exchangeRates";

/**
 * Currency localisation for the Seva page.
 *
 * The donation is ultimately processed by Qgiv **in USD** — the app cannot
 * charge in other currencies. So this module keeps a single USD "base" ladder
 * ($10 / $50 / $100) and localises it two ways:
 *   • the right symbol for the donor's region (₹, $, CA$, €, A$, £), and
 *   • a *real* conversion at live ECB exchange rates (services/exchangeRates.js),
 *     rounded to a clean local figure for display (e.g. the $10 tier shows as
 *     CA$15, not CA$14.09).
 * Whatever the donor picks or types (a local figure) is converted **back to USD
 * at the same live rate and rounded to whole dollars** before the Qgiv hand-off,
 * so Qgiv is prefilled with the correct USD amount for what the donor saw.
 *
 * The `rate` values below are STATIC FALLBACKS (local units per 1 USD, roughly
 * current). They're used only until — or when — live rates are unavailable
 * (first launch before the fetch lands, offline, or the FX endpoint is down),
 * so conversion always works fully offline. getLiveRate() overrides them the
 * moment real rates are cached; see effectiveRate() below.
 *
 * Region is resolved ON-DEVICE by resolveDeviceCountry(): timezone first, then
 * UTC offset, then the device locale — see that function for why the locale is
 * last rather than first. The backend's `countryCode` is still accepted as an
 * override when SevaScreen passes one, but it is not the primary signal and in
 * practice never arrives: the backend reads it from a `cf-ipcountry` /
 * `x-vercel-ip-country` CDN header and the API sits behind neither, so it
 * answers `null` and the device ladder is what actually runs. Defaults to USD
 * for anywhere not in the table.
 */

// symbol = what the donor sees; rate = static fallback (local units per 1 USD),
// overridden by live ECB rates when available (see effectiveRate).
// NB: the ₹ (U+20B9) glyph renders as a Devanagari-style form in the app's Baloo
// Paaji font, so the Seva UI draws currency *symbols* in the system font (which
// has a correct ₹) while keeping the digits in Baloo — see styles.symbolFont.
//
// `presets` (optional) are the LOCAL suggested-amount tiers to show for that
// currency; the first is the default/base. When absent, the app derives tiers
// from the backend's USD base amounts × rate, nice-rounded for display. INR
// keeps its own fixed round ladder (₹100 / ₹1,000 / ₹5,000, base ₹100) per
// product; those convert to USD via the live rate for the Qgiv charge
// (≈ ₹100 → $1, ₹1,000 → $10, ₹5,000 → $52 at ~₹96/USD).
export const CURRENCIES = {
  USD: { symbol: "$", rate: 1 },
  CAD: { symbol: "CA$", rate: 1.41 },
  EUR: { symbol: "€", rate: 0.88 },
  AUD: { symbol: "A$", rate: 1.43 },
  GBP: { symbol: "£", rate: 0.75 },
  INR: { symbol: "₹", rate: 96, presets: [100, 1000, 5000] },
};

export const DEFAULT_CURRENCY_CODE = "USD";

// Eurozone members → EUR. (The common ones; the list is easy to extend.)
const EUROZONE = new Set([
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
]);

/**
 * Maps an ISO 3166-1 alpha-2 country code to one of the supported currencies,
 * defaulting to USD for the rest of the world.
 */
export const countryToCurrencyCode = (countryCode) => {
  const c = String(countryCode || "")
    .trim()
    .toUpperCase();
  if (c === "IN") return "INR";
  if (c === "US") return "USD";
  if (c === "CA") return "CAD";
  if (c === "AU") return "AUD";
  if (c === "GB" || c === "UK") return "GBP";
  if (EUROZONE.has(c)) return "EUR";
  return DEFAULT_CURRENCY_CODE;
};

/**
 * Best-effort device region (ISO alpha-2) from the platform locale, e.g.
 * "en_IN" → "IN". Dependency-free (reads the same native locale RN itself uses)
 * and safe: any failure returns "" so callers fall back to USD.
 */
export const getDeviceCountryCode = () => {
  try {
    let locale = "";
    if (Platform.OS === "ios") {
      const settings = NativeModules.SettingsManager?.settings;
      locale =
        settings?.AppleLocale ||
        (Array.isArray(settings?.AppleLanguages) ? settings.AppleLanguages[0] : "") ||
        "";
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier || "";
    }
    // Region subtag: "en_IN" / "en-IN" / "pa_IN" → "IN".
    const match = /[-_]([A-Za-z]{2})(?:[-_@#]|$)/.exec(String(locale));
    return match ? match[1].toUpperCase() : "";
  } catch (_) {
    return "";
  }
};

/**
 * IANA timezone → ISO country, for the regions whose currency we support.
 * Anything unlisted resolves to USD anyway, so US zones need no entries and
 * the table stays small. Australia is handled by prefix (every Australia/*
 * zone is AU). Both Kolkata spellings are present — older Android images still
 * report the Asia/Calcutta alias.
 */
const TZ_TO_COUNTRY = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Europe/London": "GB",
  // Canada
  "America/Toronto": "CA",
  "America/Montreal": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Regina": "CA",
  "America/Moncton": "CA",
  "America/Whitehorse": "CA",
  "America/Yellowknife": "CA",
  "America/Iqaluit": "CA",
  // Eurozone — mapped to their country, which countryToCurrencyCode folds to EUR
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Dublin": "IE",
  "Europe/Lisbon": "PT",
  "Europe/Helsinki": "FI",
  "Europe/Athens": "GR",
  "Europe/Bratislava": "SK",
  "Europe/Ljubljana": "SI",
  "Europe/Tallinn": "EE",
  "Europe/Riga": "LV",
  "Europe/Vilnius": "LT",
  "Europe/Luxembourg": "LU",
  "Europe/Malta": "MT",
  "Europe/Zagreb": "HR",
  "Asia/Nicosia": "CY",
  "Europe/Nicosia": "CY",
};

/**
 * The device's IANA timezone, or "" when the JS engine can't supply one.
 * Hermes does not always ship timezone data and answers "UTC" for everyone when
 * it doesn't, so a literal "UTC" is treated as "unknown" and falls through to
 * the offset tier rather than being trusted. (A real UK device reports
 * Europe/London, not UTC.)
 */
const getDeviceTimeZone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return tz === "UTC" ? "" : tz;
  } catch (_) {
    return "";
  }
};

/**
 * Raw UTC offset → country, for offsets that belong to exactly one country we
 * support. Only UTC+5:30 qualifies: it is India (Sri Lanka shares it, and
 * nobody else does). Deliberately not extended to +10/+11 etc., which are
 * shared with countries whose donors should stay on USD.
 * getTimezoneOffset() is plain ECMAScript — it works in every engine, needs no
 * Intl and no native module.
 */
const countryFromOffset = () => {
  try {
    return new Date().getTimezoneOffset() === -330 ? "IN" : "";
  } catch (_) {
    return "";
  }
};

/**
 * The donor's country, resolved on-device in three tiers, all local and
 * instant — no network call, no native module, no permissions:
 *
 *   1. IANA timezone   ("Asia/Kolkata" → IN)
 *   2. UTC offset      (UTC+5:30 → IN) — covers engines with no timezone data
 *   3. Device region   ("en_IN" → IN) — last resort only
 *
 * Timezone leads because it is set from the network and is INDEPENDENT OF
 * LANGUAGE. Device region is last precisely because it is unreliable here: most
 * Indian users run their phone in English (US) or English (UK), so the region
 * reads US/GB and the donate page shows $ or £ — the bug this ladder fixes.
 * India is always caught by tier 1 or 2, so it never reaches tier 3.
 */
export const resolveDeviceCountry = () => {
  const tz = getDeviceTimeZone();
  if (tz) {
    if (tz.startsWith("Australia/")) return "AU";
    if (TZ_TO_COUNTRY[tz]) return TZ_TO_COUNTRY[tz];
  }
  return countryFromOffset() || getDeviceCountryCode();
};

/**
 * Resolves the currency to display. Pass an explicit ISO country code (e.g.
 * the backend's `countryCode`, from services/sevaConfig.js) to override
 * device detection; omit it, or pass null/undefined, to resolve from the
 * device via resolveDeviceCountry().
 * @returns {{code: string, symbol: string, rate: number}}
 */
export const resolveCurrency = (overrideCountryCode) => {
  const country = overrideCountryCode || resolveDeviceCountry();
  const code = countryToCurrencyCode(country);
  return { code, ...CURRENCIES[code] };
};

/** Coerces a currency arg (code string or object) to a currency object. */
const asCurrency = (currency) => {
  if (currency && typeof currency === "object" && currency.rate != null) return currency;
  const code = CURRENCIES[currency] ? currency : DEFAULT_CURRENCY_CODE;
  return { code, ...CURRENCIES[code] };
};

/**
 * The rate to convert with: the live ECB rate for this currency when we have it,
 * else the static fallback baked into CURRENCIES. Keeping this in one place means
 * display figures and the Qgiv USD charge always use the SAME rate, so what the
 * donor sees and what they're charged can never drift apart.
 */
const effectiveRate = (c) => getLiveRate(c.code) ?? c.rate;

/** Groups thousands with commas without relying on Intl (Hermes-safe). */
const groupThousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * Rounds a raw converted local figure to a clean, donation-friendly number so
 * the cards read nicely (e.g. CA$14.09 → CA$15, £75.1 → £75), with the step
 * scaling by magnitude. Small tiers snap to 5s, mid tiers to 10s, large to
 * 25/100/500. Never returns 0 for a positive input (floors at one step).
 */
export const niceRoundLocal = (value) => {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  let step;
  if (v < 30) step = 5;
  else if (v < 150) step = 10;
  else if (v < 600) step = 25;
  else if (v < 2000) step = 100;
  else step = 500;
  return Math.max(step, Math.round(v / step) * step);
};

/** A USD base amount → its raw localised figure at the effective rate (whole). */
export const usdToLocal = (usd, currency) => {
  const c = asCurrency(currency);
  return Math.round((Number(usd) || 0) * effectiveRate(c));
};

/**
 * A locally-entered/displayed figure → the USD amount to hand to Qgiv, converted
 * at the same effective (live) rate and **rounded to whole US dollars** — Qgiv is
 * prefilled with a clean figure, and it matches the donor's ₹1000 → $10 mental
 * model. Floors at $1 so a hand-off can never be $0.
 */
export const localToUsd = (local, currency) => {
  const c = asCurrency(currency);
  const usd = (Number(local) || 0) / effectiveRate(c);
  if (!(usd > 0)) return 0;
  return Math.max(1, Math.round(usd));
};

/** Rounds UP to a clean figure, with the step growing by magnitude. */
const roundUpToStep = (value) => {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  let step = 50;
  if (v < 10) step = 1;
  else if (v < 500) step = 10;
  return Math.ceil(v / step) * step;
};

/**
 * The smallest local amount worth handing to Qgiv.
 *
 * Qgiv charges in USD and enforces a $1 minimum of its own, and localToUsd
 * floors at $1 — so ANY positive local figure below a dollar was handed over as
 * $1 regardless. A donor who typed ₹1 got a Qgiv form prefilled with $1, about
 * ₹96: a ninety-six-fold gap between what they chose and what they would be
 * charged, and on a monthly plan it repeated.
 *
 * Derived from the effective (live) rate rather than tabled per currency, so it
 * cannot go stale as rates move, and rounded UP so it reads as a deliberate
 * floor rather than a conversion artefact — ₹100, £1, €1, CA$2, A$2, $1 at
 * current rates. Always at or above one dollar, so the donor is never charged
 * more than the figure they entered.
 */
export const minLocalAmount = (currency) => roundUpToStep(effectiveRate(asCurrency(currency)));

/** A whole number with thousands grouping and no symbol, e.g. 1000 → "1,000". */
export const formatNumber = (amount) => groupThousands(Math.round(Number(amount) || 0));

/** "₹1,000" / "$10" — symbol + grouped whole figure. */
export const formatCurrency = (amount, currency) => {
  const c = asCurrency(currency);
  return `${c.symbol}${formatNumber(amount)}`;
};

/**
 * Maps the USD preset ladder to localised **display** figures — converted at the
 * live rate, then nice-rounded so the cards show clean numbers (CA$15, not
 * CA$14.09). USD itself stays exact (its rate is 1, so nice-rounding a round
 * base tier is a no-op).
 */
export const localPresets = (usdPresets, currency) =>
  (usdPresets || []).map((usd) => niceRoundLocal(usdToLocal(usd, currency)));

/**
 * The LOCAL preset ladder to display for a currency, resolving in priority order:
 *   1. backend per-currency override — `backendPresets[currency.code]`, used
 *      verbatim (already local figures, e.g. INR [100,1000,5000]);
 *   2. the currency's own built-in local ladder (`currency.presets` — INR);
 *   3. the backend USD base `amounts` converted to local figures.
 * Always returns a non-empty array of positive whole local figures, so the
 * donate widget can never render an empty tier row.
 * @param {{code:string, presets?:number[]}} currency
 * @param {number[]} [backendAmounts]   USD base ladder from the backend
 * @param {Record<string, number[]>} [backendPresets]  per-currency local overrides
 */
export const resolveLocalPresets = (currency, backendAmounts, backendPresets) => {
  const c = asCurrency(currency);
  const override = backendPresets && backendPresets[c.code];
  const cleanOverride = Array.isArray(override)
    ? override.map((n) => Math.round(Number(n) || 0)).filter((n) => n > 0)
    : [];
  if (cleanOverride.length) return cleanOverride;
  if (Array.isArray(currency.presets) && currency.presets.length) return currency.presets;
  const base =
    Array.isArray(backendAmounts) && backendAmounts.length ? backendAmounts : [10, 50, 100];
  return localPresets(base, c);
};
