import { useState, useEffect, useRef } from "react";
import { exists, stat, unlink } from "react-native-fs";
import { useSelector, useDispatch, useStore } from "react-redux";
import constant from "@common/constant";
import { reconcileDownloads } from "@common/services/audioReconcile";
import { actions, logError, logNetworkError, STRINGS, useNetwork } from "@common";
import { fetchRawBaniAudio, selectTracksForBani } from "@service";
import { getLocalTrackPath, AUDIO_DIRECTORY_PATH } from "../../utils/audioDownloader";

// ─────────────────────────────────────────────────────────────────────────────
// Audio manifest hook — fully backend-driven, offline-capable.
//
// Source of truth is the backend /audios manifest (services/audioApi.js). Its
// offline copy lives in the persisted `audioCatalog` Redux slice as the RAW
// length-grouped response per bani; this hook selects the right length group at
// read time (selectTracksForBani) and merges in any locally-downloaded files.
//
// Read order per bani:
//   1. Persisted catalog cache → instant, works offline.
//   2. If online and the cache is missing/stale → fetch fresh, persist, use it.
//      (A stale-but-present cache is always used immediately; the refresh is a
//      background upgrade, never a blocker.)
//   3. Merge downloaded tracks so local files play offline and integrity-check.
//   4. When the manifest came from the network, reconcile the downloads
//      against it in the background (audioReconcile) and re-merge if anything
//      on disk changed — the list that is already showing is never held up.
//
// There is NO hardcoded track data and no bundled fallback: a bani that has
// never been cached and can't be fetched (offline first-run) surfaces a
// network-retry state rather than stale baked-in URLs.
// ─────────────────────────────────────────────────────────────────────────────

// How fresh a manifest must be for opening the track list to skip the network.
const SILENT_REFRESH_MIN_AGE_MS = 5 * 60 * 1000;

const useAudioManifest = (baniID) => {
  const [tracks, setTracks] = useState([]);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [isTracksLoading, setIsLoading] = useState(true);
  const [manifestError, setManifestError] = useState(null);
  const defaultAudio = useSelector((state) => state.defaultAudio);
  const baniLength = useSelector((state) => state.baniLength);

  const dispatch = useDispatch();
  const store = useStore();
  const audioManifest = useSelector((state) => state.audioManifest);
  // Persisted offline manifest cache (raw length-grouped API responses per bani).
  const audioCatalog = useSelector((state) => state.audioCatalog) || {};
  // Authoritative download records — carries the exact downloaded byte size,
  // used for deterministic integrity checks below. Defaulted so a missing slice
  // (e.g. in tests) never throws.
  const downloadRegistry = useSelector((state) => state.downloadRegistry) || {};
  // Gate manifest fetch on redux-persist rehydration — prevents re-downloading
  // tracks that are already on disk but whose manifest hasn't been restored yet.
  // eslint-disable-next-line no-underscore-dangle -- _persist is redux-persist's own key
  const isRehydrated = useSelector((state) => state._persist?.rehydrated);
  const { isOnline } = useNetwork();
  // Tracks whether we've observed an offline period since mount, so the
  // reconnect-refresh effect below only fires on a real offline→online
  // transition, never on first mount (which already fetches on its own).
  const wasOfflineRef = useRef(false);
  // The fetch in progress, if any — a list opening while the mount fetch is
  // still running joins it instead of starting a second one.
  const inFlightRef = useRef(null);
  // The most recently started fetch. Only it may apply results: an older run
  // that finishes later — even after the newer one has cleared inFlightRef —
  // would otherwise show its own (old) bani or length.
  const latestRunRef = useRef(null);

  // Map intermediate manifest items (services/audioApi shape) to the player's
  // track shape. Artist display names come straight from the backend, which is
  // authoritative and already returns the canonical names.
  const mapIntermediateToTracks = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items
      .filter((item) => item != null && item.track_url)
      .map((item) => {
        const hasExplicitLyricsUrl = Object.prototype.hasOwnProperty.call(item, "lyrics_url");
        // eslint-disable-next-line no-nested-ternary -- explicit lyrics_url, else derived from track_url, else null
        const lyricsUrl = hasExplicitLyricsUrl
          ? item.lyrics_url
          : item.track_url
          ? item.track_url.replace(/\.m4a$/i, ".json")
          : null;

        return {
          id: item.track_id,
          track_id: item.track_id,
          artistID: item.artist_id,
          audioUrl: item.track_url,
          remoteUrl: item.track_url,
          displayName: item.artist_name,
          trackLengthSec: item.track_length_seconds,
          trackSizeMB: item.track_size_mb,
          lyricsUrl,
          isLocallyDownloaded: false,
        };
      });
  };

  // Resolve the track list for this bani + length from a raw `groups` object.
  const tracksFromGroups = (groups) =>
    mapIntermediateToTracks(groups ? selectTracksForBani(groups, baniID, baniLength) : []);

  // The companion lyrics file a download keeps beside its audio.
  const lyricsPathOf = (audioRelativePath) =>
    audioRelativePath ? audioRelativePath.replace(/\.[^/.]+$/, ".json") : null;

  // Every download of this bani, not only the ones this session played.
  //
  // `audioManifest` (the session list) is not persisted and only gains the
  // track that was just downloaded or played, so after a restart every other
  // download was missing from it and its row kept the remote URL — streaming,
  // and failing offline, although the persisted registry knew the file was on
  // disk. Each catalog track the registry holds is added (and with no catalog,
  // the registry's own entries for this bani), and every download points at
  // its companion lyrics file; the merge below validates both before use.
  const withRegistryDownloads = (apiTracks, sessionDownloads, registry) => {
    const list = (sessionDownloads || []).map((t) => ({
      ...t,
      lyricsUrl: t.lyricsUrl || lyricsPathOf(t.audioUrl),
    }));
    const has = (id) => list.some((d) => String(d.id) === String(id));
    if (apiTracks && apiTracks.length > 0) {
      // Downloads the previous release left are adopted with no bani (see
      // useStorageMigration). The catalog identifies them by path, so record
      // the bani now — that is what lets them show offline later, when there
      // is no catalog to match against.
      const banisLearned = {};
      apiTracks.forEach((apiTrack) => {
        const rel = apiTrack?.audioUrl ? getLocalTrackPath(apiTrack.audioUrl) : null;
        if (rel && registry?.[rel] && registry[rel].baniId == null) {
          banisLearned[rel] = { baniId: Number(baniID) };
        }
      });
      if (Object.keys(banisLearned).length > 0) {
        dispatch(actions.updateDownloadEntries(banisLearned));
      }
      apiTracks.forEach((apiTrack) => {
        const rel = apiTrack?.audioUrl ? getLocalTrackPath(apiTrack.audioUrl) : null;
        if (!rel || !registry?.[rel] || has(apiTrack.id)) return;
        list.push({
          id: apiTrack.id,
          track_id: apiTrack.track_id,
          artistID: apiTrack.artistID,
          displayName: apiTrack.displayName,
          trackLengthSec: apiTrack.trackLengthSec,
          trackSizeMB: apiTrack.trackSizeMB,
          audioUrl: rel,
          lyricsUrl: lyricsPathOf(rel),
          remoteUrl: apiTrack.audioUrl,
        });
      });
    } else {
      // KNOWN: a download the previous release left, never yet matched to a
      // catalog (adopted offline before any catalog arrived), has no bani, so
      // it cannot be offered here until the device is online once.
      Object.values(registry || {}).forEach((entry) => {
        if (String(entry?.baniId) !== String(baniID)) return;
        const rel = entry.relativePath;
        if (!rel || list.some((d) => d.audioUrl === rel)) return;
        list.push({
          id: rel,
          displayName: entry.artistDisplayName,
          trackSizeMB: entry.sizeMB,
          audioUrl: rel,
          lyricsUrl: lyricsPathOf(rel),
        });
      });
    }
    return list;
  };

  // Merge downloaded tracks with remote (catalog) tracks. `registry` is passed
  // in rather than read from the closure because the merge also runs after the
  // reconcile pass has just changed it.
  // KNOWN: the on-disk integrity check (exists, stat, exact bytes or 90% of the
  // manifest size, unlink, mark corrupt) is written out twice below, once per
  // branch. A shared validateLocalTrack helper is planned in an upcoming PR so
  // the two cannot drift.
  const mergeDownloadedTracks = async (
    apiTracks,
    sessionDownloads,
    registry = downloadRegistry
  ) => {
    const downloadedTracks = withRegistryDownloads(apiTracks, sessionDownloads, registry);
    if (!apiTracks || apiTracks.length === 0) {
      // No remote data → surface valid downloaded tracks straight from disk.
      if (!downloadedTracks || downloadedTracks.length === 0) {
        return [];
      }
      const corruptIds1 = new Set();
      const corruptKeys1 = new Set();
      const validatedDownloads = await Promise.all(
        downloadedTracks.map(async (track) => {
          const fullLocalPath = `${AUDIO_DIRECTORY_PATH}/${track.audioUrl}`;
          const lyricsUrlPath = track.lyricsUrl
            ? `${AUDIO_DIRECTORY_PATH}/${track.lyricsUrl}`
            : null;
          let hasAudio = false;
          let hasLyrics = true;
          try {
            hasAudio = await exists(fullLocalPath);
            if (hasAudio) {
              // Prefer an EXACT byte match against the recorded download size;
              // fall back to the 90%-of-manifest-MB heuristic for legacy
              // downloads that predate sizeBytes.
              const exactBytes = Number(registry[track.audioUrl]?.sizeBytes) || 0;
              const expectedBytes = (track.trackSizeMB || 0) * 1024 * 1024;
              if (exactBytes > 0 || expectedBytes > 0) {
                const size = Number((await stat(fullLocalPath)).size);
                const corrupt = exactBytes > 0 ? size !== exactBytes : size < expectedBytes * 0.9;
                if (corrupt) {
                  await unlink(fullLocalPath).catch(() => {});
                  corruptIds1.add(String(track.id));
                  corruptKeys1.add(track.audioUrl);
                  hasAudio = false;
                }
              }
            }
          } catch (error) {
            // If file existence check fails, treat as missing
            hasAudio = false;
          }
          if (lyricsUrlPath) {
            try {
              hasLyrics = await exists(lyricsUrlPath);
            } catch (error) {
              // If file existence check fails, treat as missing
              hasLyrics = false;
            }
          }
          if (!hasAudio) {
            return null;
          }

          return {
            id: track.id,
            track_id: track.track_id,
            artistID: track.artistID,
            audioUrl: fullLocalPath,
            displayName: track.displayName,
            trackLengthSec: track.trackLengthSec,
            trackSizeMB: track.trackSizeMB,
            lyricsUrl: track.lyricsUrl && hasLyrics ? lyricsUrlPath : null,
            isLocallyDownloaded: true,
          };
        })
      );

      if (corruptIds1.size > 0) {
        dispatch(
          actions.setAudioManifest(
            baniID,
            (sessionDownloads || []).filter((t) => !corruptIds1.has(String(t.id)))
          )
        );
        // Clear the registry entry too so the track shows as not-downloaded and
        // the auto-download-on-stream path re-fetches a clean copy.
        if (corruptKeys1.size > 0) dispatch(actions.removeDownloadEntries([...corruptKeys1]));
      }
      // Filter out any missing/broken downloads
      return validatedDownloads.filter((track) => track !== null);
    }

    // Merge downloaded tracks with API tracks, falling back to remote if local file is missing
    const corruptIds2 = new Set();
    const corruptKeys2 = new Set();
    const mergedTracks = await Promise.all(
      apiTracks.map(async (apiTrack) => {
        const downloadedTrack = downloadedTracks.find(
          (downloaded) => String(downloaded.id) === String(apiTrack.id)
        );

        // For bani-length variants, the same track_id maps to different audio
        // files depending on the selected length. If the cached entry's
        // remoteUrl doesn't match the currently expected URL, the local file
        // belongs to a different length — ignore it and stream the correct one.
        // Compare by artist/file PATH (not the full URL) so a host change (e.g.
        // blob → CDN) never invalidates an existing download: only a genuinely
        // different file (different length variant) fails the match.
        const remoteUrlMatches =
          !downloadedTrack?.remoteUrl ||
          getLocalTrackPath(downloadedTrack.remoteUrl) === getLocalTrackPath(apiTrack.audioUrl);
        const validDownloadedTrack = downloadedTrack && remoteUrlMatches ? downloadedTrack : null;

        const fullLocalPath = validDownloadedTrack
          ? `${AUDIO_DIRECTORY_PATH}/${validDownloadedTrack.audioUrl}`
          : null;
        const lyricsUrlPath =
          validDownloadedTrack && validDownloadedTrack.lyricsUrl
            ? `${AUDIO_DIRECTORY_PATH}/${validDownloadedTrack.lyricsUrl}`
            : null;

        let hasAudio = false;
        let hasLyrics = true;
        if (fullLocalPath) {
          try {
            hasAudio = await exists(fullLocalPath);
            if (hasAudio) {
              const exactBytes = Number(registry[validDownloadedTrack.audioUrl]?.sizeBytes) || 0;
              const expectedBytes =
                (validDownloadedTrack.trackSizeMB || apiTrack.trackSizeMB || 0) * 1024 * 1024;
              if (exactBytes > 0 || expectedBytes > 0) {
                const size = Number((await stat(fullLocalPath)).size);
                const corrupt = exactBytes > 0 ? size !== exactBytes : size < expectedBytes * 0.9;
                if (corrupt) {
                  await unlink(fullLocalPath).catch(() => {});
                  corruptIds2.add(String(apiTrack.id));
                  corruptKeys2.add(validDownloadedTrack.audioUrl);
                  hasAudio = false;
                }
              }
            }
          } catch (error) {
            // If file existence check fails, treat as missing
            hasAudio = false;
          }
        }
        if (lyricsUrlPath) {
          try {
            hasLyrics = await exists(lyricsUrlPath);
          } catch (error) {
            // If file existence check fails, treat as missing
            hasLyrics = false;
          }
        }

        if (validDownloadedTrack && hasAudio) {
          return {
            ...apiTrack,
            audioUrl: fullLocalPath,
            // If local lyrics are missing, keep remote lyricsUrl for sync-scroll.
            lyricsUrl:
              validDownloadedTrack.lyricsUrl && hasLyrics ? lyricsUrlPath : apiTrack.lyricsUrl,
            remoteUrl: apiTrack.audioUrl,
            isLocallyDownloaded: true,
          };
        }

        // Fallback to remote API track when local file is missing or wrong length
        return {
          ...apiTrack,
          remoteUrl: apiTrack.audioUrl,
          isLocallyDownloaded: false,
        };
      })
    );

    if (corruptIds2.size > 0) {
      dispatch(
        actions.setAudioManifest(
          baniID,
          (sessionDownloads || []).filter((t) => !corruptIds2.has(String(t.id)))
        )
      );
      if (corruptKeys2.size > 0) dispatch(actions.removeDownloadEntries([...corruptKeys2]));
    }

    return mergedTracks;
  };

  // Set default track based on user preferences
  const setDefaultTrack = (trackList) => {
    if (!trackList || trackList.length === 0) {
      return;
    }

    // Determine which artistID to prefer:
    //  1. Saved user preference (defaultAudio) — primary source
    //  2. Currently playing track — used when baniLength changes while audio
    //     is active; ensures currentPlaying gets the new-length URL instantly
    const preferredArtistId =
      // eslint-disable-next-line no-nested-ternary -- saved preference, then current track, then none
      defaultAudio[baniID]?.artistID != null
        ? defaultAudio[baniID].artistID.toString()
        : currentPlaying?.artistID != null
        ? currentPlaying.artistID.toString()
        : null;

    if (preferredArtistId) {
      const defaultTrack = trackList.find(
        (track) => track.artistID.toString() === preferredArtistId
      );
      if (defaultTrack && defaultTrack.audioUrl) {
        setCurrentPlaying(defaultTrack);
      }
    }
  };

  const fileOf = (track) => getLocalTrackPath(track.remoteUrl || track.audioUrl || "");

  // A refreshed list while something is playing. The same file keeps the
  // SAME currentPlaying object — replacing it re-fires every effect keyed on
  // it, and the player would reload a track that did not change — and only
  // takes a corrected reciter name. A different file for the artist (the
  // other length variant) is adopted, as setDefaultTrack always did.
  const syncCurrentPlaying = (trackList) => {
    setCurrentPlaying((prev) => {
      if (!prev?.artistID) return prev;
      const next = trackList.find((t) => String(t.artistID) === String(prev.artistID));
      if (!next || !next.audioUrl) return prev;
      if (fileOf(next) !== fileOf(prev)) return next;
      return next.displayName !== prev.displayName
        ? { ...prev, displayName: next.displayName }
        : prev;
    });
  };

  // Select tracks for the current length from `groups`, merge the files on
  // disk, and show the result. `registry` / `downloadedTracks` default to the
  // render's values; the post-reconcile re-run passes the store's current ones.
  const applyGroups = async (groups, registry, downloadedTracks) => {
    let mappedData = tracksFromGroups(groups);
    const reg = registry || {};
    if ((downloadedTracks && downloadedTracks.length > 0) || Object.keys(reg).length > 0) {
      mappedData = await mergeDownloadedTracks(mappedData || [], downloadedTracks || [], reg);
    }

    if (mappedData && mappedData.length > 0) {
      setTracks(mappedData);
      if (currentPlaying) syncCurrentPlaying(mappedData);
      else setDefaultTrack(mappedData);
      setManifestError(null);
    } else {
      setTracks([]);
      // No manifest at all — offline with nothing cached, or online but the
      // request failed (server error, timeout, captive portal) with nothing
      // cached — is not "this bani has no audio": offer a retry rather than
      // the dead "no audio" screen. A manifest that exists but has nothing for
      // this length still shows the reader's normal "no audio for this
      // length" message.
      if (!groups) {
        setManifestError(STRINGS.NETWORK_ERROR || STRINGS.PLEASE_TRY_AGAIN);
      }
    }
  };

  // Once a manifest has come from the network, bring the downloads in line
  // with it in the background; if anything on disk changed, merge again so the
  // showing list reflects it. Never awaited by the caller.
  const reconcileAgainst = (groups) => {
    reconcileDownloads({
      manifests: { [baniID]: groups },
      getState: () => store.getState(),
      dispatch,
    })
      .then((result) => {
        if (!result?.changed) return null;
        const state = store.getState();
        return applyGroups(groups, state.downloadRegistry || {}, state.audioManifest?.[baniID]);
      })
      .catch(() => {});
  };

  /**
   * @param {boolean} forceRefresh bypass the TTL and ask the network.
   * @param {{ silent?: boolean }} [options] silent: keep the current list on
   *   screen while refreshing (used when the user opens the track list) instead
   *   of showing the loading state. A refresh already in flight is joined.
   */
  const fetchAudioManifest = async (forceRefresh = false, options = {}) => {
    // A refresh in flight is joined only if it is for the SAME bani and length.
    // It captured those in its closure, so a length (or bani) change during a
    // slow fetch used to join the old run and show the old length's tracks.
    const requestKey = `${baniID}|${baniLength}`;
    if (inFlightRef.current && inFlightRef.current.key === requestKey) {
      return inFlightRef.current.run;
    }
    // Whether a newer request has taken over; a superseded run applies nothing.
    const token = {};
    latestRunRef.current = token;
    const isCurrent = () => latestRunRef.current === token;
    const { silent = false } = options;
    const run = (async () => {
      try {
        if (!silent || tracks.length === 0) setIsLoading(true);
        setManifestError(null);

        // 1. Start from the persisted cache (raw length-grouped response).
        const cacheEntry = audioCatalog[baniID];
        let groups = cacheEntry?.groups || null;
        let fetchedFresh = false;
        const isStale =
          forceRefresh ||
          !cacheEntry ||
          Date.now() - (cacheEntry.fetchedAt || 0) > constant.AUDIO_CATALOG_TTL_MS;

        // 2. Refresh from the network when online and the cache is missing/stale.
        //    A failed fetch keeps whatever (possibly stale) cache we already have.
        if (isOnline && isStale) {
          const raw = await fetchRawBaniAudio(baniID);
          if (raw?.noAudio) {
            // A definite "no audio for this bani" (the server answered 404).
            // Cached, so tracks the backend has removed stop showing and the
            // entry is fresh again rather than refetched on every open — but
            // never reconciled against: an empty manifest would read as every
            // downloaded track removed, and one wrong 404 must not delete them.
            groups = {};
            dispatch(
              actions.setAudioCatalogEntry(baniID, {
                groups: {},
                baniName: cacheEntry?.baniName || "",
                fetchedAt: Date.now(),
              })
            );
          } else if (raw) {
            ({ groups } = raw);
            fetchedFresh = true;
            dispatch(
              actions.setAudioCatalogEntry(baniID, {
                groups: raw.groups,
                baniName: raw.baniName,
                fetchedAt: Date.now(),
              })
            );
          }
        }

        // 3. Select tracks for the current length, then merge downloaded files.
        if (!isCurrent()) return;
        await applyGroups(groups, downloadRegistry, audioManifest[baniID]);

        // 4. A fresh 200 is the only thing the reconcile is allowed to act on.
        if (fetchedFresh) reconcileAgainst(groups);
      } catch (error) {
        logNetworkError(`Error fetching manifest: ${error?.message || error}`, error);
        if (!isCurrent()) return;

        // Best-effort offline reconstruction: play whatever is already on disk.
        const offlineTracks = audioManifest?.[baniID] || [];
        if (offlineTracks.length > 0 || Object.keys(downloadRegistry || {}).length > 0) {
          try {
            const merged = await mergeDownloadedTracks([], offlineTracks);
            if (merged.length > 0) {
              setTracks(merged);
              setDefaultTrack(merged);
              return; // Loaded from local disk — don't surface a network error
            }
          } catch (mergeErr) {
            logError("Offline merge failed:", mergeErr);
          }
        }

        setManifestError(error?.message || STRINGS.NETWORK_ERROR || STRINGS.PLEASE_TRY_AGAIN);
      } finally {
        if (isCurrent()) {
          setIsLoading(false);
          inFlightRef.current = null;
        }
      }
    })();
    inFlightRef.current = { key: requestKey, run };
    return run;
  };

  const addTrackToManifest = (track, localPath, jsonPath) => {
    const trackData = {
      id: track.id,
      track_id: track.track_id,
      artistID: track.artistID,
      audioUrl: localPath,
      displayName: track.displayName,
      trackLengthSec: track.trackLengthSec,
      trackSizeMB: track.trackSizeMB,
      lyricsUrl: jsonPath,
      remoteUrl: track.remoteUrl,
    };

    const existingTracks = audioManifest[baniID] || [];
    const trackExists = existingTracks.some(
      (existingTrack) => String(existingTrack.id) === String(trackData.id)
    );

    if (!trackExists) {
      dispatch(actions.setAudioManifest(baniID, [...existingTracks, trackData]));
    }
  };

  const isTrackDownloaded = (trackId) => {
    try {
      const existingTracks = audioManifest[baniID] || [];
      const track = existingTracks.find((t) => String(t.id) === String(trackId));

      if (!track) {
        return false;
      }

      // Check if audio is downloaded (not a remote URL)
      const isAudioDownloaded =
        track.audioUrl &&
        !track.audioUrl.startsWith("http://") &&
        !track.audioUrl.startsWith("https://");

      // Check if lyrics are downloaded (lyricsUrl exists and is not a remote URL)
      // Note: lyricsUrl can be null if lyrics aren't available remotely, which is acceptable
      const isLyricsDownloaded =
        track.lyricsUrl &&
        !track.lyricsUrl.startsWith("http://") &&
        !track.lyricsUrl.startsWith("https://");

      // Track is considered downloaded if:
      // 1. Audio is downloaded AND
      // 2. (Lyrics are downloaded OR lyrics aren't available/needed)
      return isAudioDownloaded && (isLyricsDownloaded || !track.lyricsUrl);
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (baniID && isRehydrated) {
      fetchAudioManifest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baniID, isRehydrated, baniLength]);

  // Auto-refresh the moment connectivity returns. Without this, a manifest
  // served from a stale cache while offline stays stale until the user manually
  // taps "Retry" or force-closes the app — even once the device is genuinely
  // back online. forceRefresh=true bypasses the TTL, so this is a real network
  // call to the Khalis API.
  useEffect(() => {
    if (!baniID || !isRehydrated) return;
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      fetchAudioManifest(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, baniID, isRehydrated]);

  const isAudioUnavailableForCurrentLengthOnly =
    constant.BANI_IDS_WITH_LENGTH_VARIANTS.includes(Number(baniID)) && tracks.length === 0;

  return {
    tracks,
    currentPlaying,
    setCurrentPlaying,
    isTracksLoading,
    addTrackToManifest,
    isTrackDownloaded,
    manifestError,
    isAudioUnavailableForCurrentLengthOnly,
    refetchManifest: () => fetchAudioManifest(true),
    // The track list opening: the cached list is already showing, so the
    // network answer and any corrections swap in behind it.
    // Opening the track list re-asks the network only if this bani's manifest
    // is more than a few minutes old: each forced fetch also runs a reconcile
    // (a HEAD per download, a GET per lyrics file, a walk of the audio folder),
    // and opening and closing the list while reading repeated all of it.
    refreshManifestSilently: () => {
      if (!isRehydrated) return Promise.resolve();
      const fetchedAt = audioCatalog[baniID]?.fetchedAt || 0;
      const recent = Date.now() - fetchedAt < SILENT_REFRESH_MIN_AGE_MS;
      return fetchAudioManifest(!recent, { silent: true });
    },
  };
};

export default useAudioManifest;
