import { useEffect, useRef } from "react";
import { InteractionManager } from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import DeviceInfo from "react-native-device-info";
import { logNetworkError } from "@common";
import constant from "../constant";
import { useNetwork } from "../context";
import { setAudioCatalogEntries, setAudioCatalogMeta } from "../actions";
import { reconcileDownloads } from "./audioReconcile";
import { fetchRawBaniAudio } from "../../services/audioApi";
import { ensureLyricsCached } from "../../ReaderScreen/components/AudioPlayer/utils/lyricsCache";

// ─────────────────────────────────────────────────────────────────────────────
// Eager audio-catalog prefetch.
//
// Warms the persisted offline manifest cache for every bani in
// constant.AUDIO_BANI_IDS, and pre-caches (and conditionally revalidates) each
// track's lyrics JSON to disk, so the audio player and sync-scroll work fully
// offline for banis the user has never opened — the offline parity the old
// bundled data used to provide, now entirely backend-driven. Because the sweep
// re-runs on update / past-TTL, it doubles as the periodic freshness check that
// picks up server-side lyrics corrections at the same URL.
//
// Runs once per app session, only when it's actually needed: a fresh install,
// an app update (new build may add bani IDs / new audio), or once the cache has
// aged past the TTL. Present-but-stale cache is left untouched here — the
// per-bani lazy refresh in useAudioManifest handles individual freshness on
// visit. Best-effort and fully non-blocking; a 404 (bani without audio) or an
// offline device simply leaves that entry uncached.
//
// There is deliberately no bulk "all banis" endpoint, so this fans out
// per-bani GETs with a small concurrency cap. Swap for a catalog endpoint (and
// drop AUDIO_BANI_IDS) if the backend adds one.
// ─────────────────────────────────────────────────────────────────────────────

const safeGetAppVersion = () => {
  try {
    return DeviceInfo.getVersion() || "unknown";
  } catch (_) {
    return "unknown";
  }
};

// Minimal promise pool — process `items` with at most `limit` in flight.
const runWithConcurrency = async (items, limit, worker) => {
  const queue = [...items];
  const size = Math.max(1, Math.min(limit || 1, queue.length));
  const runners = Array.from({ length: size }, async () => {
    while (queue.length) {
      const item = queue.shift();
      // eslint-disable-next-line no-await-in-loop
      await worker(item);
    }
  });
  await Promise.all(runners);
};

const collectLyricsUrls = (groups, sink) => {
  if (!groups || typeof groups !== "object") return;
  Object.values(groups).forEach((group) => {
    (group?.artists || []).forEach((artist) => {
      if (artist?.lyricsUrl) sink.add(artist.lyricsUrl);
    });
  });
};

const runCatalogSync = async (dispatch, getState, appVersion) => {
  const baniIds = constant.AUDIO_BANI_IDS || [];
  const concurrency = constant.AUDIO_CATALOG_SYNC_CONCURRENCY || 4;
  const lyricsUrls = new Set();

  // 1. Manifest for every audio bani → persist raw groups for offline use.
  //    Collected and dispatched as ONE action: every dispatch re-serializes the
  //    whole persisted store, so a per-bani dispatch loop scales its cost with
  //    the catalog. One write covers eight banis or eighty.
  const entries = {};
  await runWithConcurrency(baniIds, concurrency, async (baniId) => {
    const raw = await fetchRawBaniAudio(baniId);
    if (!raw) return; // 404 (no audio) or offline — skip, leave uncached.
    entries[baniId] = {
      groups: raw.groups,
      baniName: raw.baniName,
      fetchedAt: Date.now(),
    };
    collectLyricsUrls(raw.groups, lyricsUrls);
  });
  if (Object.keys(entries).length) dispatch(setAudioCatalogEntries(entries));

  // 2. Pre-cache every reciter's lyrics JSON → offline sync-scroll parity, and
  //    revalidate ones already on disk so server-side lyrics corrections (e.g.
  //    timestamp fixes at the same URL) are picked up. Conditional GETs make an
  //    unchanged file a near-free 304; only genuinely changed files re-download.
  await runWithConcurrency([...lyricsUrls], concurrency, async (url) => {
    await ensureLyricsCached(url, { revalidate: true }).catch(() => {});
  });

  // 3. Bring every DOWNLOADED track in line with the manifests that just
  //    arrived: re-cut audio is replaced, corrected lyrics refetched, removed
  //    tracks and orphaned files deleted, renamed artists corrected. Only the
  //    banis that answered 200 are passed — a bani that did not is not known
  //    to have changed, so nothing of its is touched.
  const manifests = {};
  Object.entries(entries).forEach(([baniId, entry]) => {
    manifests[baniId] = entry.groups;
  });
  await reconcileDownloads({ manifests, getState, dispatch });

  // 4. Record the sweep so it doesn't re-run until the next update / TTL.
  dispatch(setAudioCatalogMeta({ lastFullSyncAt: Date.now(), appVersion }));
};

const useAudioCatalogSync = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const isRehydrated = useSelector((state) => state._persist?.rehydrated);
  const meta = useSelector((state) => state.audioCatalogMeta) || {};
  const { isOnline } = useNetwork();
  // Guards against re-running within the same app session (the effect re-fires
  // on isOnline transitions).
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!isRehydrated || !isOnline || hasRunRef.current) return;

    const appVersion = safeGetAppVersion();
    const lastSyncAt = Number(meta.lastFullSyncAt) || 0;
    const versionChanged = meta.appVersion !== appVersion;
    const isPastTtl = Date.now() - lastSyncAt > constant.AUDIO_CATALOG_TTL_MS;

    // Fresh install (lastSyncAt === 0), app update, or aged-out cache.
    if (lastSyncAt > 0 && !versionChanged && !isPastTtl) return undefined;

    // Deferred: the sweep's result is only ever read on a LATER visit to a
    // bani, so it has no deadline — but at launch it competes with everything
    // that does (the fresh-install DB seed, the first Home mount). It waits
    // out the launch window, then waits again for any running interaction.
    let cancelled = false;
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (cancelled || hasRunRef.current) return;
        hasRunRef.current = true;
        runCatalogSync(dispatch, () => store.getState(), appVersion).catch((error) =>
          logNetworkError(`Audio catalog sync failed: ${error?.message || error}`, error)
        );
      });
    }, constant.AUDIO_CATALOG_SYNC_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRehydrated, isOnline]);
};

export default useAudioCatalogSync;
