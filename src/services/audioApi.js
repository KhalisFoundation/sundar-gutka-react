import { constant } from "@common";

// ─────────────────────────────────────────────────────────────────────────────
// Audio manifest source — 100% backend-driven.
//
// The Khalis audio API (constant.AUDIO_API_BASE) is the single, authoritative
// source for every reciter, track URL, duration, size and lyrics URL. There is
// NO hardcoded track data, no bundled fallback, and no legacy secondary API:
// adding or changing a track is a backend data change, never an app release.
//
// GET /audios/:baniId shape:
//   {
//     baaniId, baaniName, source,
//     data: {
//       short:  { artists: [{ artistId, name, trackId, link, lyricsUrl,
//                             durationSeconds, sizeMb }, ...] },
//       medium: { artists: [...] },
//       long:   { artists: [...] },
//       // XL banis simply omit the group — no "xl" key is returned.
//     }
//   }
// A bani with no audio responds 404 ("No audio for baani N").
//
// The offline copy of this manifest lives in the persisted `audioCatalog` Redux
// slice (raw `groups` cached per bani); length-group selection happens at read
// time via selectTracksForBani, so one cache entry serves every bani length.
// ─────────────────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 15000;

// Maps the app's bani-length setting (constant.SHORT/MEDIUM/LONG/EXTRA_LONG) to
// the API's length-group key. EXTRA_LONG has no server group (no reciter has
// recorded the XL-only sections), so it resolves to a missing group → empty
// track list → the "we don't have audio for this length" message downstream.
const LENGTH_GROUP_BY_BANI_LENGTH = {
  [constant.SHORT]: "short",
  [constant.MEDIUM]: "medium",
  [constant.LONG]: "long",
  [constant.EXTRA_LONG]: "xl",
};

// Turn one API artist entry into the intermediate track shape the audio-manifest
// hook consumes. URLs are used verbatim — the API already returns fully-qualified
// CDN links, so there is no host rewriting to do.
const mapArtistEntry = (baniId, artist) => ({
  bani_id: Number(baniId),
  track_id: artist.trackId,
  track_url: artist.link,
  track_length_seconds: artist.durationSeconds ?? 0,
  track_size_mb: artist.sizeMb ?? 0,
  artist_name: artist.name ?? "",
  artist_id: artist.artistId,
  lyrics_url: artist.lyricsUrl ?? null,
});

const artistsOf = (group) => (Array.isArray(group?.artists) ? group.artists : []);

/**
 * Select the playable track list for a bani + length from a cached/fetched raw
 * `groups` object. Pure and synchronous — safe to call on every manifest read.
 *
 * - Length-variant banis (Chaupai/Rehras/Kirtan Sohila): pick strictly the group
 *   matching the selected length. A missing group (e.g. XL) yields an empty list,
 *   which the reader turns into the length-specific "maafi" message.
 * - All other banis: the length groups are identical, so union + dedupe by
 *   trackId to surface every reciter regardless of the (often unset) length.
 *
 * @returns {Array} intermediate track objects (possibly empty).
 */
export const selectTracksForBani = (groups, baniId, baniLength) => {
  if (!groups || typeof groups !== "object") return [];

  const numericBaniId = Number(baniId);
  const isLengthVariant = constant.BANI_IDS_WITH_LENGTH_VARIANTS.includes(numericBaniId);

  if (isLengthVariant) {
    const groupKey = LENGTH_GROUP_BY_BANI_LENGTH[baniLength];
    const selected = groupKey ? groups[groupKey] : null;
    return artistsOf(selected)
      .filter((a) => a && a.link)
      .map((a) => mapArtistEntry(numericBaniId, a));
  }

  // Non-variant bani: collapse all groups, keeping the first entry per trackId.
  const byTrackId = new Map();
  Object.values(groups).forEach((group) => {
    artistsOf(group).forEach((a) => {
      if (!a || !a.link || a.trackId == null || byTrackId.has(a.trackId)) return;
      byTrackId.set(a.trackId, mapArtistEntry(numericBaniId, a));
    });
  });
  return [...byTrackId.values()];
};

/**
 * Fetch the raw, length-grouped audio manifest for one bani from the backend.
 * Returns `{ baniId, baniName, groups }`, or `null` when the bani has no audio
 * (404), the response is malformed, or the network is unavailable. Never throws.
 *
 * The caller persists the returned `groups` into `audioCatalog` for offline use.
 */
export const fetchRawBaniAudio = async (baniId) => {
  const base = constant.AUDIO_API_BASE;
  if (!base) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/${baniId}`, { signal: controller.signal });
    if (!res.ok) return null; // 404 = no audio for this bani; treat as "nothing".
    const json = await res.json();
    const groups = json?.data;
    if (!groups || typeof groups !== "object") return null;
    return { baniId: Number(baniId), baniName: json.baaniName ?? "", groups };
  } catch (_) {
    // Offline / timeout / parse error — caller falls back to the persisted cache.
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Convenience: fetch + select in one call, returning the app's manifest shape
 * `{ status, data }` (or `null` when the bani has no audio / the fetch failed).
 * An empty-but-valid `data` (e.g. a length group the backend doesn't have) is
 * returned as `{ status: "success", data: [] }` so the length-variant "maafi"
 * message can distinguish "no audio for THIS length" from a network error.
 */
export const fetchManifest = async (baniId, baniLength) => {
  const raw = await fetchRawBaniAudio(baniId);
  if (!raw) return null;
  return { status: "success", data: selectTracksForBani(raw.groups, baniId, baniLength) };
};
