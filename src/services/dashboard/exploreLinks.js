import AsyncStorage from "@react-native-async-storage/async-storage";
import { constant, logNetworkError } from "@common";
import { bundledExploreLinks } from "./exploreBundled";

// The Dashboard's Explore tiles. The server's list IS the list; the app's own
// copy is a floor, not a default.
//
//   network  GET /explore-links?lang=xx — the tiles, in order, with labels in
//            the app's language and every destination each one has: the web
//            URL, the app's URL scheme, its Android package, its App Store id
//   cache    the last good answer per language, so a device offline for a
//            month still shows the tiles it last saw
//   bundled  what the app shipped with, reached only by a device that has
//            never once been answered — a fresh install with no connection
//
// Freshness is a short TTL rather than a fetch per mount. The Dashboard is
// opened many times a day and each open would otherwise be a request that
// could not return anything new, because the API caches its own rows for five
// minutes; matching that window is the shortest interval that can ever see a
// change. Inside it the cache answers instantly and offline is indistinguishable
// from fast.
//
// Only a fall to the bundled list is worth a breadcrumb: the cache saving the
// day is the design working, not a fault.

const SUPPORTED_LANGS = ["en", "hi", "pa", "fr", "it", "es"];
const CACHE_PREFIX = "@explore_links_v1";
const FETCH_TIMEOUT_MS = 8000;

/**
 * How long a cached list stays fresh.
 *
 * Five minutes, which is the API's own row cache (ExploreLinksService). Asking
 * more often than the server can answer differently returns the same bytes, so
 * this is the shortest interval that is not pure cost.
 */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** True when the cache is older than the TTL, or was never written. */
export const isStale = (cached, now = Date.now()) =>
  !cached || now - (cached.at || 0) >= CACHE_TTL_MS;

/** "DEFAULT" / "en-US" / "pa" → the API's short tag; unknown → en. */
export const langToApi = (lang) => {
  const l = String(lang || "")
    .trim()
    .toLowerCase();
  if (!l || l === "default") return "en";
  const primary = l.split(/[-_]/)[0];
  return SUPPORTED_LANGS.includes(primary) ? primary : "en";
};

const cacheKey = (lang) => `${CACHE_PREFIX}:${lang}`;

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const HTTPS = /^https:\/\/\S+$/i;
const str = (v) => (v == null ? null : String(v).trim() || null);

/**
 * One tile, or null when the server sent something this build cannot render.
 * Fields the tile does not need are dropped rather than passed through, so a
 * newer server cannot smuggle a shape into the cache an older build chokes on.
 */
export const sanitizeLink = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const id = str(raw.id);
  const url = str(raw.url);
  if (!id || !url || !HTTPS.test(url)) return null;
  return {
    id,
    position: Number.isFinite(Number(raw.position)) ? Number(raw.position) : 0,
    title: str(raw.title) || id,
    subtitle: str(raw.subtitle) || "",
    badge: str(raw.badge),
    url,
    androidPkg: str(raw.androidPkg),
    // `iosScheme` is what builds before this sent it under; either name is
    // accepted so a device is never stranded between an app and a backend.
    appLink: str(raw.appLink) || str(raw.iosScheme),
    iosAppId: str(raw.iosAppId),
    icon: str(raw.icon),
    plate: raw.plate === "pale" || raw.plate === "deep" ? raw.plate : null,
  };
};

const sanitizeList = (links) =>
  (Array.isArray(links) ? links : [])
    .map(sanitizeLink)
    .filter(Boolean)
    .sort((a, b) => a.position - b.position);

const readCache = async (lang) => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const links = sanitizeList(parsed?.links);
    return links.length
      ? { links, version: Number(parsed.version) || 0, at: Number(parsed.at) || 0 }
      : null;
  } catch (_) {
    return null;
  }
};

const writeCache = async (lang, payload) => {
  try {
    await AsyncStorage.setItem(cacheKey(lang), JSON.stringify({ ...payload, at: Date.now() }));
  } catch (_) {
    // A full disk must not break the tiles that are already on screen.
  }
};

/**
 * The Explore tiles for a language.
 *
 * A cache inside the TTL answers on its own; otherwise the server is asked and
 * its answer replaces the cache. A failed ask falls back to the cache however
 * old it is — offline, a captive portal and a backend that is down all look the
 * same from here and none may empty the row. Only a device that has never been
 * answered sees the bundled list.
 *
 * @param {{ lang?: string, force?: boolean }} [options] force ignores the TTL.
 * @returns {Promise<{ links: object[], version: number, source: "network"|"cache"|"bundled" }>}
 */
export const getExploreLinks = async ({ lang, force = false } = {}) => {
  const apiLang = langToApi(lang);
  const base = constant.EXPLORE_LINKS_API_URL;

  const fresh = await readCache(apiLang);
  if (!force && !isStale(fresh)) return { ...fresh, source: "cache" };

  try {
    if (!base) throw new Error("EXPLORE_LINKS_API_URL not set");
    const resp = await fetchJson(`${base}?lang=${encodeURIComponent(apiLang)}`);
    const links = sanitizeList(resp?.links);
    // An empty list is not a valid answer: the server always has its built-in
    // six, so nothing here means the response was not what this build expects.
    if (!links.length) throw new Error("empty links");
    const payload = { links, version: Number(resp.version) || 0 };
    await writeCache(apiLang, payload);
    return { ...payload, source: "network" };
  } catch (err) {
    if (fresh) return { ...fresh, source: "cache" };
    logNetworkError(`getExploreLinks failed: ${err?.message || err}`, err);
    return { links: bundledExploreLinks(), version: 0, source: "bundled" };
  }
};

export default getExploreLinks;
