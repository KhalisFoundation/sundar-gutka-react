// Function to fetch JSON lyrics content, disk-cache-first.

import { readFile } from "react-native-fs";
import { checkIsRemote, extractFilePath } from "./urlHelper";
import { ensureLyricsCached, readCachedLyrics } from "./lyricsCache";

// Module-level cache: avoids re-fetching the same LRC data when switching back
// to a previously played track in the same session.
const _lrcCache = new Map();

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
      if (localPath) {
        const persisted = await readCachedLyrics(jsonUrl);
        if (persisted) {
          data = normalizeLrcRows(persisted);
          _lrcCache.set(jsonUrl, data);
          return data;
        }
      }

      // Last resort (e.g. the cache write failed) — fetch directly so playback
      // still syncs this session, even if it couldn't be persisted for offline.
      const response = await fetch(jsonUrl);
      data = await response.json();
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
