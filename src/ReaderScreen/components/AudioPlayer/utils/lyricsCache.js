import {
  DocumentDirectoryPath,
  exists,
  mkdir,
  readFile,
  writeFile,
  unlink,
} from "react-native-fs";
import {
  NO_CACHE_HEADERS,
  readValidatorMeta,
  validatorsFromResponse,
  writeValidatorMeta,
} from "./validatorMeta";

// ─────────────────────────────────────────────────────────────────────────────
// Lyrics (LRC/JSON) disk cache — the offline home for STREAMED tracks' lyrics.
//
// Lyrics used to be bundled into the app (Metro-inlined JSON). They are now
// fetched from the CDN like any other asset and cached here on first use, so:
//   • the first sync-scroll of a streamed track fetches once, then plays offline
//     forever after,
//   • the eager catalog sync can pre-warm every reciter's lyrics for full
//     offline parity with the old bundle,
//   • nothing lyrics-related ships hardcoded in the app binary.
//
// Content freshness: a lyrics JSON can be corrected server-side (e.g. timestamp
// fixes) at the SAME URL. To pick that up without re-downloading unchanged files
// on every launch, the eager sync revalidates with an HTTP conditional GET —
// each file's ETag/Last-Modified is stored in a sidecar (`<file>.meta`) and sent
// as If-None-Match / If-Modified-Since. A 304 keeps the cached copy (near-zero
// bytes); a 200 overwrites it. The on-view path stays cache-first (no network),
// so revalidation only happens on the throttled ~daily sync, never on the hot
// sync-scroll path.
//
// This cache is for STREAMED tracks. A DOWNLOADED track keeps its own companion
// JSON next to the audio (see audioDownloader.downloadLyricsOnly); that copy is
// guaranteed present with the audio and is preferred when the track is local.
//
// Keyed on the host-independent "Artist/file.json" path (last two URL segments)
// so a CDN/host change never invalidates the cache — only the asset path matters.
// Lives under DocumentDirectoryPath (app-internal, wiped by "Clear Data").
// ─────────────────────────────────────────────────────────────────────────────

const LYRICS_CACHE_DIR = `${DocumentDirectoryPath}/audio_lyrics`;
const REQUEST_TIMEOUT_MS = 15000;

// Last two path segments → "Artist/file.json". Query strings are stripped.
const cacheKeyFromUrl = (url) => {
  if (!url) return "";
  const parts = String(url).split("?")[0].split("/");
  return parts.slice(-2).join("/");
};

export const getCachedLyricsRelativePath = (url) => cacheKeyFromUrl(url);

export const getCachedLyricsFullPath = (url) => {
  const relativePath = cacheKeyFromUrl(url);
  return relativePath ? `${LYRICS_CACHE_DIR}/${relativePath}` : null;
};

const ensureDirFor = async (fullPath) => {
  const dir = fullPath.slice(0, fullPath.lastIndexOf("/"));
  if (!(await exists(dir))) {
    await mkdir(dir, { NSURLIsExcludedFromBackupKey: true });
  }
};

// In-flight downloads keyed by destination path, so concurrent callers (a
// sync-scroll open + the eager prefetch warming the same file) share one task
// instead of racing to write — interleaved writes would truncate the JSON.
const inFlight = new Map();

/**
 * Ensure a remote lyrics JSON is cached on disk, returning its full local path
 * (or `null` for a non-remote url or a fetch/parse failure with nothing cached).
 * Idempotent and concurrency-safe. The body is validated as JSON before it is
 * persisted, so a captive-portal HTML page or an error response is never cached.
 *
 * @param {string} url
 * @param {{ revalidate?: boolean }} [options]
 *   revalidate=false (default): pure cache — if the file exists, return it with
 *     zero network. Used on the hot on-view path (offline-safe).
 *   revalidate=true: if the file exists, send a conditional GET (ETag /
 *     Last-Modified). 304 → keep; 200 → overwrite with the corrected content;
 *     a network failure NEVER drops the existing good copy. Used by the ~daily
 *     eager sync to pick up server-side lyrics corrections.
 */
export const ensureLyricsCached = async (url, options = {}) => {
  const { revalidate = false } = options;
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const fullPath = getCachedLyricsFullPath(url);
  if (!fullPath) return null;

  // Dedupe only fast-path (non-revalidating) calls; a revalidation should still
  // run even if an on-view fetch of the same file is in flight.
  if (!revalidate && inFlight.has(fullPath)) return inFlight.get(fullPath);

  const task = (async () => {
    const fileExisted = await exists(fullPath);
    if (fileExisted && !revalidate) return fullPath;

    // Build conditional headers when revalidating an existing file. The
    // request must also bypass the device's own HTTP cache, or the year-long
    // max-age the CDN sends lets it answer from disk without asking the edge.
    const headers = {};
    let stored = null;
    if (fileExisted) {
      stored = await readValidatorMeta(fullPath);
      Object.assign(headers, NO_CACHE_HEADERS);
      if (stored?.etag) headers["If-None-Match"] = stored.etag;
      else if (stored?.lastModified) headers["If-Modified-Since"] = stored.lastModified;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });

      // Unchanged since last fetch — keep the cached copy, refresh the sidecar.
      if (fileExisted && response.status === 304) {
        const live = validatorsFromResponse(response);
        await writeValidatorMeta(fullPath, {
          etag: live.etag || stored?.etag || null,
          lastModified: live.lastModified || stored?.lastModified || null,
          contentMd5: live.contentMd5 || stored?.contentMd5 || null,
          revalidatedAt: Date.now(),
        });
        return fullPath;
      }

      // Any non-OK response — keep an existing good copy; only fail a cold fetch.
      if (!response.ok) {
        return fileExisted ? fullPath : null;
      }

      const text = await response.text();
      // Reject anything that isn't valid JSON before it touches disk.
      try {
        JSON.parse(text);
      } catch (_) {
        return fileExisted ? fullPath : null;
      }

      await ensureDirFor(fullPath);
      await writeFile(fullPath, text, "utf8");
      await writeValidatorMeta(fullPath, {
        ...validatorsFromResponse(response),
        revalidatedAt: Date.now(),
      });
      return fullPath;
    } catch (_) {
      // Never drop a previously-good cache on a transient/offline error.
      if (fileExisted) return fullPath;
      await unlink(fullPath).catch(() => {});
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  if (!revalidate) {
    inFlight.set(fullPath, task);
    task.finally(() => inFlight.delete(fullPath));
  }
  return task;
};

/**
 * Read + parse cached lyrics for a url, or `null` if not cached / unreadable.
 * A corrupt cache file is deleted so the next fetch re-downloads a clean copy.
 */
export const readCachedLyrics = async (url) => {
  const fullPath = getCachedLyricsFullPath(url);
  if (!fullPath) return null;
  try {
    if (!(await exists(fullPath))) return null;
    return JSON.parse(await readFile(fullPath, "utf8"));
  } catch (_) {
    await unlink(fullPath).catch(() => {});
    return null;
  }
};
