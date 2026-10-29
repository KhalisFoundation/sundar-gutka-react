import { exists, readFile, unlink, writeFile } from "react-native-fs";

// ─────────────────────────────────────────────────────────────────────────────
// HTTP validator sidecars.
//
// A file fetched from the CDN is remembered with the validators the server sent
// for it — ETag, Last-Modified and, where the blob store provides one,
// Content-MD5 — in a `<file>.meta` sidecar beside it. That is what lets the app
// tell "same URL, different bytes" apart from "same URL, same bytes" later,
// with a HEAD or a conditional GET instead of a download: an unchanged file
// answers 304 (or the same validators), a re-cut one answers with new ones.
//
// Sidecars, rather than one shared index, keep concurrent validations race-free:
// the catalog sweep touches many files in parallel, and two writers on one
// index file would truncate it.
//
// Shared by the streamed-lyrics cache and by downloaded audio + its companion
// JSON, so every cached asset is validated the same way.
// ─────────────────────────────────────────────────────────────────────────────

export const metaPathFor = (fullPath) => `${fullPath}.meta`;

export const readValidatorMeta = async (fullPath) => {
  try {
    const metaPath = metaPathFor(fullPath);
    if (!(await exists(metaPath))) return null;
    return JSON.parse(await readFile(metaPath, "utf8"));
  } catch (_) {
    return null;
  }
};

export const writeValidatorMeta = async (fullPath, meta) => {
  try {
    await writeFile(metaPathFor(fullPath), JSON.stringify(meta), "utf8");
  } catch (_) {
    // Best-effort — a missing sidecar just means the next check has nothing to
    // compare against and falls back to a full fetch / a byte-length compare.
  }
};

export const removeValidatorMeta = async (fullPath) => {
  await unlink(metaPathFor(fullPath)).catch(() => {});
};

export const headerValue = (response, name) => {
  try {
    return response?.headers?.get?.(name) || null;
  } catch (_) {
    return null;
  }
};

/** The validators a response carries, in the shape the sidecar stores. */
export const validatorsFromResponse = (response) => ({
  etag: headerValue(response, "etag"),
  lastModified: headerValue(response, "last-modified"),
  contentMd5: headerValue(response, "content-md5"),
  contentLength: Number(headerValue(response, "content-length")) || null,
});

/**
 * True when the stored validators say the live file is the same bytes.
 * Compared strongest-first; a validator missing on either side is not a
 * mismatch, so a CDN that drops one header never forces a re-download. `null`
 * (rather than false) when there is nothing at all to compare — the caller
 * decides what an unknown means.
 */
export const validatorsMatch = (stored, live) => {
  if (!stored || !live) return null;
  const pairs = [
    [stored.contentMd5, live.contentMd5],
    [stored.etag, live.etag],
    [stored.lastModified, live.lastModified],
  ].filter(([a, b]) => a && b);
  if (pairs.length === 0) return null;
  return pairs.every(([a, b]) => a === b);
};

// A validation request must reach the origin's answer, not a disk cache. The
// CDN sends max-age of a year on every blob, which licenses the device's own
// HTTP cache (iOS NSURLSession in particular) to answer from disk forever.
export const NO_CACHE_HEADERS = { "Cache-Control": "no-cache", Pragma: "no-cache" };

const HEAD_TIMEOUT_MS = 8000;

/**
 * The live validators for a URL via HEAD, or `null` when the request fails or
 * the resource is not there. Never throws.
 */
export const fetchValidators = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: NO_CACHE_HEADERS,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return validatorsFromResponse(response);
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
