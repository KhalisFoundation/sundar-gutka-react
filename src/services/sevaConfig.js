import AsyncStorage from "@react-native-async-storage/async-storage";
import { constant, logNetworkError } from "@common";
import STRINGS from "../common/localization";
import { parseSevaContent } from "../SevaScreen/utils/sevaContentParser";
import { buildBundledSevaLayout } from "./sevaBundledContent";

/**
 * Seva configuration service.
 *
 * Fetches the dynamic Seva config from the Khalis backend (constant.SEVA_CONFIG_API_URL)
 * and maps it onto the app-facing SevaConfig shape that SevaScreen + BottomNavigation
 * already consume. The backend drives the page content (translated per `lang`), payment
 * (Qgiv) config, donation amounts/presets, country + raw countryCode, and the Seva dot
 * (redDot/version). FILLER_CONFIG below supplies only the few remaining app-local bits
 * (fixed English literals used before any fetch ever completes, and the taxMessage/
 * footerText/description STRINGS overwritten onto it per render). Falls back to the last
 * cached config, then bundled defaults, offline.
 */

/** @typedef {'one_time' | 'recurring' | 'unknown'} DonorType */
/** @typedef {'stripe' | 'qgiv' | 'unknown'} DonorSource */
/** @typedef {'qgiv_prefill_open' | 'stripe' | 'qgiv_embedded'} PaymentMode */

/**
 * @typedef {Object} SevaConfig
 * @property {string}      configVersion
 * @property {string}      country          - ISO 3166-1 alpha-2, e.g. "US"
 * @property {Object}      content
 * @property {string}      content.headline
 * @property {string}      content.description
 * @property {Array<{type: 'html', value: string} | {type: 'slot', name: string}>}
 *                          content.segments  - Server-driven content, parsed
 *                          from the backend's raw `content` HTML string via
 *                          parseSevaContent(). Empty when the backend hasn't
 *                          populated content yet — SevaScreen renders the
 *                          native fields below (headline/description/etc.) instead.
 * @property {number[]}    amounts
 * @property {number}      selectedAmount
 * @property {PaymentMode} payment_mode
 * @property {boolean}     showSevaDot   - true whenever sevaDotCount > 0
 * @property {number}      sevaDotCount  - 0 none / 1 plain dot / 2+ numbered badge
 */

/** App-local copy + fixed donation amounts, used as the base and the offline fallback. */
const FILLER_CONFIG = {
  configVersion: "mock-v1",
  country: "US",
  content: {
    headline: "ਸੁੰਦਰ ਗੁਟਕਾ",
    description:
      "Is built by volunteers at Khalis Foundation, a non-profit organization " +
      "that builds software like Sundar Gutka and SikhiToTheMax. Khalis helps " +
      "millions of Sikhs around the world connect with Gurbani. You can be part " +
      "of this seva as well; serve millions with a single donation.",
    descriptionLinks: [
      { text: "Khalis Foundation", url: "https://khalisfoundation.org/" },
      { text: "SikhiToTheMax", url: "https://sikhitothemax.org/" },
    ],
    taxMessage: "Your donation is tax-deductible. You will receive a receipt via email.",
    nonUsTaxMessage: "Thank you for your generous support of Khalis Foundation.",
    footerText: "Know coding? You can also do seva through open source contributions.",
    donatedHeadline: "ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ",
    donatedDescription:
      "Thank you for your generous support. Your seva helps Sikhs around the world connect with Gurbani.",
    recurringRetentionDescription:
      "Your monthly seva is making a difference. Thank you for your continued support.",
    convertToRecurringCTA: "Upgrade to Monthly Giving",
  },
  amounts: [10, 50, 100],
  selectedAmount: 10,
  payment_mode: "qgiv_prefill_open",
  showSevaDot: true,
};

// First-run / no-real-content fallback content is generated per-language by
// buildBundledSevaLayout (services/sevaBundledContent.js) — a faithful, full
// mirror of the backend's server-driven layout in all six app languages. Used
// whenever there is no actual backend content to show: a fresh install opened
// offline before ever reaching the server, a fetch that fails with nothing
// cached yet, or a server response whose `content` is empty. The moment the
// backend returns a non-empty `content`, that real value replaces it.

// Cached per LANGUAGE — `content` is the server-driven HTML for whichever
// language it was fetched in, so a single shared key would replay stale-language
// content when offline (e.g. switch to Italian offline with only an English
// fetch ever cached — without this, you'd see English until back online).
// Mirrors services/sevaMeans.js's per-(page,lang) cache key for the same reason.
// Keyed v2 — v1 didn't carry `content`; bumping the key rather than
// defensive-coding around old cached shapes, since a one-time cache miss on
// upgrade just falls through to the native STRINGS fallback until the next
// successful fetch.
const CACHE_KEY = "@seva_config_dynamic_v2";
const cacheKey = (lang) => `${CACHE_KEY}:${lang}`;
// Small language-agnostic marker for the version dot badge, which is the same
// across every language — kept separate from the per-language content cache so
// the badge still works even when nothing has been cached in the CURRENT
// language yet.
const LAST_VERSION_KEY = "@seva_config_last_version";
// The config version the user has acknowledged by OPENING the Seva page. Sent as
// ?v= so the backend computes redDot = currentVersion − seenVersion. Persisted
// separately from the cached config so the dot survives background refetches and
// only clears when the user actually opens Seva (see markSevaSeen). Defaults to 0
// (never opened) → the dot shows whenever the backend version is ≥ 1.
const SEEN_VERSION_KEY = "@seva_seen_version";

// Latest payment block from the backend. Kept module-level so buildQgivUrl() can use it
// without changing its call site in SevaScreen (no UI change).
let cachedPayment = null;
// Latest currentVersion observed from the backend — what markSevaSeen() records.
let latestVersion = 0;

// Tiny pub/sub so the Seva tab's red dot clears instantly when the user opens the
// Seva page (markSevaSeen), without waiting for the bottom bar's next refetch.
// Carries the actual missed-version count (0 = none), not just a boolean, so
// subscribers can render 0 none / 1 plain dot / 2+ numbered badge.
const dotListeners = new Set();
export const subscribeSevaDot = (listener) => {
  dotListeners.add(listener);
  return () => {
    dotListeners.delete(listener);
  };
};
const emitSevaDot = (count) => {
  dotListeners.forEach((fn) => {
    try {
      fn(count);
    } catch (_) {
      // one listener throwing must not stop the rest
    }
  });
};

const readSeenVersion = async () => {
  try {
    const raw = await AsyncStorage.getItem(SEEN_VERSION_KEY);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch (_) {
    return 0;
  }
};

// Whether the user has EVER opened the Seva page. Distinct from
// readSeenVersion() === 0, which cannot tell "never visited" apart from
// "visited before any version was ever fetched" — both read as 0.
const hasEverSeenSeva = async () => {
  try {
    return (await AsyncStorage.getItem(SEEN_VERSION_KEY)) !== null;
  } catch (_) {
    return false;
  }
};

// The badge count the backend would compute for a given version, done
// client-side for the offline/cached path: redDot = version − seenVersion.
// Mirrors seva.service.ts's `missedVersions` exactly.
const missedVersionsFor = (version, seenVersion) => {
  const v = Number(version) || 0;
  return v > seenVersion ? v - seenVersion : 0;
};

/**
 * Merge the backend dynamic bits onto the app-local copy → SevaConfig.
 * `source` records where the config came from: "network" (fresh fetch),
 * "cache" (last good, offline) or "fallback" (never fetched + offline). The
 * Seva page uses "fallback" to suppress the tax-deductible note — with no net
 * and nothing cached, the donor's country is unknown, so a US-specific
 * tax-deductible claim would be a guess (see SIO-155 comment thread).
 */
const buildConfig = (dyn, source = "network", lang = "en") => ({
  ...FILLER_CONFIG,
  source,
  configVersion: dyn?.version != null ? String(dyn.version) : FILLER_CONFIG.configVersion,
  country: dyn?.country || FILLER_CONFIG.country,
  // Raw ISO country code from the backend (e.g. "IN"), null when unavailable
  // (offline/fallback, or the CDN sent no country header). Passed to
  // currency.resolveCurrency() as an override; null makes it fall back to the
  // device locale, so this is safe in every source state.
  countryCode: dyn?.countryCode ?? null,
  payment_mode: dyn?.payment?.mode || FILLER_CONFIG.payment_mode,
  // Donation tiers are backend-driven: `amounts` is the USD base ladder (the app
  // localises it per currency), and `amountPresets` is an optional per-currency
  // map of LOCAL ladders (e.g. { INR: [100,1000,5000] }). Both fall back to the
  // app-local defaults when the backend hasn't sent them (offline / old server).
  amounts:
    Array.isArray(dyn?.amounts) && dyn.amounts.length ? dyn.amounts : FILLER_CONFIG.amounts,
  amountPresets:
    dyn?.amountPresets && typeof dyn.amountPresets === "object" ? dyn.amountPresets : {},
  // Only let the backend control the dot once we actually have a response.
  showSevaDot: dyn ? (dyn.redDot ?? 0) > 0 : FILLER_CONFIG.showSevaDot,
  // Real count for the numbered-badge UI (0 none / 1 plain dot / 2+ shows the
  // number). No response yet (offline, first-ever launch) falls back to 1
  // rather than a real count, since we can't know the true value.
  sevaDotCount: dyn ? dyn.redDot ?? 0 : Number(FILLER_CONFIG.showSevaDot),
  content: {
    ...FILLER_CONFIG.content,
    description: STRINGS.SEVA_DESCRIPTION,
    footerText: STRINGS.SEVA_FOOTER_TEXT,
    taxMessage: STRINGS.SEVA_TAX_DEDUCTIBLE,
    nonUsTaxMessage: STRINGS.SEVA_NON_US_TAX,
    // Server-driven content, split into an ordered sequence of HTML
    // fragments + native slots (donate_widget, tax_note). Falls back to
    // BUNDLED_DEFAULT_CONTENT whenever there's no real content — no network
    // yet, nothing cached, or the backend response's content is empty — so a
    // brand-new offline user still sees the full page instead of a bare
    // STRINGS-only fallback. Real backend content always wins the moment
    // it's actually populated.
    segments: parseSevaContent(dyn?.content || buildBundledSevaLayout(lang)),
  },
});

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const readCache = async (lang) => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(lang));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const readLastVersion = async () => {
  try {
    const raw = await AsyncStorage.getItem(LAST_VERSION_KEY);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch (_) {
    return 0;
  }
};

/** Maps the app language state (e.g. "DEFAULT", "en-US", "pa") to an API lang. */
const langToApi = (lang) => {
  const l = String(lang || "")
    .trim()
    .toLowerCase();
  if (!l || l === "default") return "en";
  const primary = l.split(/[-_]/)[0];
  return ["en", "hi", "pa", "fr", "it", "es"].includes(primary) ? primary : "en";
};

/**
 * Returns the Seva configuration (backend server-driven content + payment/dot).
 * @param {string} [langInput] current app language, so the backend returns the
 *   page content translated to it. Both callers (SevaScreen, BottomNavigation)
 *   pass the same current language so the cached content stays consistent.
 * @returns {Promise<SevaConfig>}
 */
export const getSevaConfig = async (langInput) => {
  const apiLang = langToApi(langInput);
  const cached = await readCache(apiLang);
  const url = constant.SEVA_CONFIG_API_URL;
  try {
    if (!url) throw new Error("SEVA_CONFIG_API_URL not set");
    // Send the version the user has SEEN (not merely the last one fetched): the
    // backend returns redDot = currentVersion − seenVersion, so the dot stays up
    // until the user opens the Seva page (markSevaSeen). A background refetch by
    // the bottom bar must NOT clear it. `lang` drives the server-driven copy.
    const seenVersion = await readSeenVersion();
    const resp = await fetchJson(
      `${url}?v=${encodeURIComponent(seenVersion)}&lang=${encodeURIComponent(apiLang)}`
    );
    const dyn = {
      version: resp?.version,
      country: resp?.country,
      countryCode: resp?.countryCode ?? null,
      payment: resp?.payment,
      redDot: resp?.redDot,
      content: resp?.content,
      amounts: resp?.amounts,
      amountPresets: resp?.amountPresets,
    };
    latestVersion = Number(resp?.version) || 0;
    cachedPayment = resp?.payment ?? null;
    // Persist everything EXCEPT redDot. redDot is DERIVED, not durable: the
    // server computes it per-request as (version − seenVersion), so a stored
    // copy goes stale the instant the user opens Seva and seenVersion moves.
    // Replaying it offline would resurrect a dot the user already cleared —
    // the cache-read path below recomputes it from durable values instead.
    const { redDot: _derivedRedDot, ...persistable } = dyn;
    AsyncStorage.setItem(cacheKey(apiLang), JSON.stringify(persistable)).catch(() => {});
    AsyncStorage.setItem(LAST_VERSION_KEY, String(latestVersion)).catch(() => {});

    // Re-derive the badge from the seen-version as of NOW, rather than trusting
    // resp.redDot, which the server computed from the `?v=` we sent BEFORE the
    // round-trip. If the user opened Seva while this request was in flight,
    // that value is already stale-high and would resurrect the dot they just
    // cleared. Same formula the backend uses, and the same one the offline
    // path below uses — one source of truth for the badge.
    const seenVersionNow = await readSeenVersion();
    const redDot = missedVersionsFor(resp?.version, seenVersionNow);
    emitSevaDot(redDot);
    return buildConfig({ ...dyn, redDot }, "network", apiLang);
  } catch (err) {
    logNetworkError(`getSevaConfig failed: ${err?.message || err}`, err);
    if (cached) {
      cachedPayment = cached.payment ?? null;
      latestVersion = Number(cached.version) || latestVersion;
      // Recompute the badge from the two values that ARE durable — the cached
      // version and the persisted seen-version — rather than trusting any
      // redDot the cache may still carry (see the write path above).
      const seenVersion = await readSeenVersion();
      return buildConfig(
        {
          ...cached,
          redDot: missedVersionsFor(cached.version, seenVersion),
        },
        "cache",
        apiLang
      );
    }
    // Nothing was ever fetched, so no version is known and the badge can only
    // be a guess. Show it to advertise Seva to a brand-new user, but never to
    // someone who has already opened the page.
    const everSeen = await hasEverSeenSeva();
    return buildConfig(everSeen ? { redDot: 0 } : null, "fallback", apiLang);
  }
};

/**
 * Acknowledge the current Seva config version — call when the user opens the Seva
 * page. Persists it as the "seen" version so the next /seva/config sends
 * ?v=<current> (backend then returns redDot=0) and clears the tab dot right now.
 * The dot only reappears when the backend increments the version.
 */
export const markSevaSeen = async () => {
  let version = latestVersion;
  if (!version) {
    version = await readLastVersion();
  }
  try {
    // NEVER move the seen-version backwards. Versions only ever increase, so
    // once a user has acknowledged version X (online OR from cache) they must
    // not see the dot again until a genuinely newer version appears. If we
    // can't determine a current version right now (opened offline with no
    // cache, e.g. after a cache-key bump), keep whatever was already
    // acknowledged instead of resetting it to 0 — otherwise the dot would
    // wrongly reappear for a version they've already seen.
    const prevSeen = await readSeenVersion();
    const next = Math.max(prevSeen, version);
    await AsyncStorage.setItem(SEEN_VERSION_KEY, String(next));
  } catch (_) {
    // best-effort; the dot re-clears on the next successful fetch anyway
  }
  emitSevaDot(0);
};

/**
 * Builds a Qgiv prefill URL using Qgiv's path-segment format.
 *
 * Qgiv URL shortcuts stack as path segments:
 *   /amount/[value]          – selects a preset suggested amount on the form
 *   /amount/other/[value]    – pre-fills the "other amount" field
 *   /frequency/[letter]      – m=monthly, a=annually, w=weekly, q=quarterly, s=semiannually
 *   /onetime                 – forces the One Time option
 *
 * The form base comes from the backend payment config when available
 * (constant.SEVA_CONFIG_API_URL → payment.baseUrl), else the bundled default.
 *
 * @param {Object} params
 * @param {number} params.amount
 * @param {'one_time'|'recurring'} params.donationType
 * @param {'Monthly'|'Annually'} [params.frequency]
 * @returns {string}
 */
export const buildQgivUrl = ({ amount, donationType, frequency }) => {
  // Backend-owned Qgiv form (falls back to the bundled default).
  let url = cachedPayment?.baseUrl || "https://secure.qgiv.com/for/khalisfoundation";

  // Amount segment - always pre-fill the "other" field to guarantee pre-filling on the Qgiv form
  if (amount) {
    const formatted = Number(amount).toFixed(2);
    url += `/amount/other/${formatted}`;
  }

  // Frequency segment. Qgiv does NOT fall back to One Time when this is omitted —
  // it uses the form's default (Monthly), which made one-time donations open the
  // monthly form. So be explicit in both cases:
  //   recurring → /frequency/[letter]      one-time → /onetime
  if (donationType === "recurring") {
    const freqLetter = frequency === "Annually" ? "a" : "m"; // default monthly
    url += `/frequency/${freqLetter}`;
  } else {
    url += "/onetime";
  }

  return url;
};
