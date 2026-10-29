import AsyncStorage from "@react-native-async-storage/async-storage";
import { constant, logNetworkError } from "@common";
import { parseSevaContent } from "../SevaScreen/utils/sevaContentParser";
import { buildBundledMeansPage } from "./sevaBundledContent";

/**
 * "Seva by other means" content service — server-driven UI that mirrors the Seva
 * page's own content pipeline (services/sevaConfig.js):
 *
 *   • fetch a constrained HTML content fragment from the Khalis backend,
 *   • cache the last good copy per (page + language) for offline use,
 *   • fall back to that cache offline, then to a bundled default fragment so a
 *     brand-new offline user still sees a full page — exactly the
 *     network → cache → bundled-default order the Seva page uses,
 *   • parse the fragment with the SAME parseSevaContent() the Seva page uses, so
 *     the app renders it natively (no WebView).
 */

/** App-facing page keys → backend path segments. */
export const SEVA_MEANS_PATHS = {
  social: "seva-by-social-media",
  coding: "seva-by-coding",
  qa: "seva-by-qa",
  other: "seva-by-other",
};

export const SEVA_MEANS_PAGE_KEYS = Object.keys(SEVA_MEANS_PATHS);

const SUPPORTED_LANGS = ["en", "hi", "pa", "fr", "it", "es"];

// Cache key is versioned so a shape change is a clean miss (→ bundled default
// until the next successful fetch), never a crash on an old cached shape.
const CACHE_PREFIX = "@seva_means_v1";

/** Maps the app's language state (e.g. "DEFAULT", "en-US", "pa") to an API lang. */
export const langToApi = (lang) => {
  const l = String(lang || "")
    .trim()
    .toLowerCase();
  if (!l || l === "default") return "en";
  const primary = l.split(/[-_]/)[0];
  return SUPPORTED_LANGS.includes(primary) ? primary : "en";
};

const cacheKey = (path, lang) => `${CACHE_PREFIX}:${path}:${lang}`;

// The first-run offline fallback content is generated per-language by
// buildBundledMeansPage (services/sevaBundledContent.js) — a faithful, full
// mirror of the backend's translated content across all six app languages. Used
// only when a page has never been fetched AND the device is offline; real
// backend content (translated) always replaces it the moment it's fetched.

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const readCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Returns { title, version, segments, source } for a page. `segments` is the
 * ordered output of parseSevaContent (same shape SevaScreen consumes), so the
 * caller renders it natively. Never rejects: on any failure it returns cached
 * content, then the bundled default — never an empty/blank page.
 *
 * @param {{page:string, lang:string}} args
 */
export const getSevaMeansPage = async ({ page, lang }) => {
  const path = SEVA_MEANS_PATHS[page] || page;
  const apiLang = langToApi(lang);
  const key = cacheKey(path, apiLang);
  const base = constant.SEVA_MEANS_API_BASE;

  try {
    if (!base) throw new Error("SEVA_MEANS_API_BASE not set");
    const url = `${base}/${path}?lang=${encodeURIComponent(apiLang)}`;
    const resp = await fetchJson(url);
    const content = resp?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("empty content");
    const payload = {
      content,
      title: resp?.title || "",
      version: resp?.version ?? 0,
      at: Date.now(),
    };
    AsyncStorage.setItem(key, JSON.stringify(payload)).catch(() => {});
    return { ...payload, segments: parseSevaContent(content), source: "network" };
  } catch (err) {
    const cached = await readCache(key);
    if (cached?.content) {
      return {
        ...cached,
        segments: parseSevaContent(cached.content),
        source: "cache",
      };
    }
    // Never fetched + offline: localized bundled default so the page is never
    // blank AND is shown in the user's language (full parity with the backend).
    logNetworkError(`getSevaMeansPage(${page}) fell back to bundled: ${err?.message || err}`, err);
    const bundled = buildBundledMeansPage(path, apiLang);
    const content = bundled?.content || "";
    return {
      content,
      title: bundled?.title || "",
      version: 0,
      segments: parseSevaContent(content),
      source: "fallback",
    };
  }
};

/**
 * Fire-and-forget prewarm of all four pages for the given language, so a single
 * online visit to the Seva screen caches every pill for later offline use.
 * Failures are swallowed. (Mirrors the Seva page fetching its own content on
 * mount so it's cached for offline.)
 *
 * @param {{lang:string}} args
 */
export const prewarmSevaMeans = async ({ lang }) => {
  const apiLang = langToApi(lang);
  await Promise.all(
    SEVA_MEANS_PAGE_KEYS.map(async (page) => {
      try {
        await getSevaMeansPage({ page, lang: apiLang });
      } catch (_) {
        // best-effort — offline / transient failures are fine
      }
    })
  );
};
