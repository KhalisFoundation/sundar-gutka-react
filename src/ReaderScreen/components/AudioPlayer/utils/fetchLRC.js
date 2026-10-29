// Function to fetch JSON lyrics content, disk-cache-first.

import { readFile } from "react-native-fs";
import { ensureLyricsCached, onLyricsChanged, readCachedLyrics } from "./lyricsCache";
import { checkIsRemote, extractFilePath } from "./urlHelper";

// Module-level cache: avoids re-fetching the same LRC data when switching back
// to a previously played track in the same session.
// eslint-disable-next-line no-underscore-dangle -- module-private cache
const _lrcCache = new Map();
const LAST_RESORT_TIMEOUT_MS = 10000;

// A corrected lyrics file (revalidated by the catalog sync or reconcile) must
// reach sync-scroll on the next play, not after a restart. Local keys may carry
// a file:// prefix the notifier's path does not.
onLyricsChanged((key) => {
  [..._lrcCache.keys()].forEach((cached) => {
    if (cached === key || cached.endsWith(key)) _lrcCache.delete(cached);
  });
});

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLrcRows = (data) => {
  if (!Array.isArray(data)) {
    return data;
  }

  return data
    .map((row, index) => {
      const start = toFiniteNumber(row?.start);
      const end = toFiniteNumber(row?.end);

      if (start == null || end == null) {
        return null;
      }

      const explicitSequence = toFiniteNumber(row?.sequence);
      const textSequence = toFiniteNumber(row?.text);
      const derivedSequence = explicitSequence ?? textSequence ?? index + 1;

      return {
        ...row,
        start,
        end,
        sequence: derivedSequence,
      };
    })
    .filter(Boolean);
};

const fetchLRCData = async (jsonUrl) => {
  if (_lrcCache.has(jsonUrl)) {
    return _lrcCache.get(jsonUrl);
  }

  try {
    const isRemote = checkIsRemote(jsonUrl);
    let data;

    if (isRemote) {
      // ── Disk-cache-first ──────────────────────────────────────────────────
      // A previously-viewed (or eagerly-prefetched) track's lyrics live on disk
      // and are read with zero network — full offline sync-scroll. On a miss,
      // fetch once from the CDN, persist to the cache, then read it back so the
      // next open (even offline) is instant.
      const cached = await readCachedLyrics(jsonUrl);
      if (cached) {
        data = normalizeLrcRows(cached);
        _lrcCache.set(jsonUrl, data);
        return data;
      }

      const localPath = await ensureLyricsCached(jsonUrl);
      // Nothing came back: the cache layer has already asked the network (with
      // its own timeout) and got no usable answer — offline, 404, or not JSON.
      // Asking again would only add a second, unbounded request.
      if (!localPath) return false;
      const persisted = await readCachedLyrics(jsonUrl);
      if (persisted) {
        data = normalizeLrcRows(persisted);
        _lrcCache.set(jsonUrl, data);
        return data;
      }

      // Last resort: the file was written but could not be read back — fetch
      // directly so playback still syncs this session. Bounded like every
      // other request here.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LAST_RESORT_TIMEOUT_MS);
      try {
        const response = await fetch(jsonUrl, { signal: controller.signal });
        data = await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // Local file — a downloaded track's companion JSON on disk.
      const filePath = extractFilePath(jsonUrl);
      data = JSON.parse(await readFile(filePath, "utf8"));
    }

    data = normalizeLrcRows(data);
    _lrcCache.set(jsonUrl, data);
    return data;
  } catch (error) {
    return false;
  }
};

export default fetchLRCData;
