import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createDownloadTask,
  getExistingDownloadTasks,
  completeHandler,
  setConfig,
} from '@kesha-antonov/react-native-background-downloader';
import NetInfo from '@react-native-community/netinfo';
import { exists, stat, unlink, readDir, getFSInfo } from 'react-native-fs';
import {
  logNetworkError,
  logMessage,
  trackTrackDownload,
  showSuccessToast,
  requestNotificationPermission,
  STRINGS,
} from '@common';
import {
  updateDownloadStatus,
  updateDownloadProgress,
  removeDownloadQueueEntry,
  requeuePausedDownloads,
  addDownloadEntry,
  enqueueDownload,
} from '../actions';
import {
  AUDIO_DIRECTORY_PATH,
  downloadLyricsOnly,
  ensureArtistDirectory,
} from '../../ReaderScreen/components/AudioPlayer/utils/audioDownloader';
import withDeadline from '../withDeadline';

// ─────────────────────────────────────────────────────────────────────────────
// Native download engine — download / cancel / delete only (no pause/resume).
//
// Bani audio files are small (3–20 MB) and served from a CDN, so a download is a
// ~1 s operation. Pause/resume (and its byte-preserving Range machinery) buys
// nothing at that size and adds a large bug surface, so it's intentionally gone:
// the only transitions a download makes are queued → downloading → completed,
// with cancel and retry as the escape hatches. Anything that interrupts a
// transfer (stall, network drop, WiFi-only switch) simply stops it and re-queues
// it to start fresh from byte 0 — cheap and robust at these sizes.
//
// The native layer (iOS NSURLSession background, Android DownloadManager +
// foreground service) still owns the transfer and keeps running while the app is
// backgrounded; this hook is a thin coordinator that:
//   1. starts native tasks for Redux 'queued' entries,
//   2. mirrors native begin/progress/done/error events into Redux for the UI,
//   3. on app start, adopts any still-running task and finalizes completed ones.
//
// Redux (downloadQueue / downloadRegistry) is the source of truth for the UI;
// native is the source of truth for an in-flight transfer.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PARALLEL         = 3;
// How long the app-start reconcile waits for the download engine's answer.
const REATTACH_TIMEOUT_MS = 10000;
const MIN_VALID_BYTES      = 100_000;   // a real bani m4a is always well over 100 KB
const RETRY_DELAYS         = [5_000, 15_000, 45_000];
const COMPLETED_CLEANUP_MS = 2_000;

// Statuses that count as "a download is still in flight". Used to decide when a
// batch has fully drained so we show a single "complete" toast at the end.
const ACTIVE_STATUSES = [
  'queued',
  'downloading',
  'paused_wifi_only',
  'paused_no_network',
  'paused_retry',
];

// If a 'downloading' task emits no progress for this long, treat it as dead and
// restart it from scratch. Generous enough to cover TCP/TLS setup on a slow
// connection without false-positives; cheap to trigger since restart is from 0.
const STALL_TIMEOUT_MS = 20_000;

// How long the notification-permission prompt may hold a download up. The
// prompt only decides whether the PROGRESS NOTIFICATION can be drawn — the
// transfer does not need it — so a prompt that never answers must not be
// allowed to hold the queue. notifee's requestPermission can sit unresolved
// when the OS declines to show the dialog at all (backgrounded activity,
// permanently denied), and it was awaited with no bound.
const NOTIF_PERMISSION_TIMEOUT_MS = 5_000;

// The first NetInfo read gates the whole queue processor. If it never settles
// nothing downloads for the life of the process, so it is bounded too.
const NETWORK_READY_TIMEOUT_MS = 5_000;

// How long a track may sit in the "currently starting" guard before the guard
// is treated as stale and dropped. Starting a task is a handful of filesystem
// calls, so anything still holding the guard after this is wedged, not busy.
// Comfortably longer than the two deadlines above so a slow-but-live start is
// never interrupted.
const STARTING_STALE_MS = 30_000;

// trackKey is the artist-relative path ("artist/file.m4a"). Native task ids must
// avoid path separators, so derive a flat id and keep the real key in metadata.
// The id is salted per attempt so a fresh download never reuses a previously
// COMPLETED id (the native lib persists a per-id DONE record; reusing it after
// the file was deleted makes the downloader attempt a stale resume against a
// missing file). Since we never resume, a fresh id per start is exactly right.
const taskIdForKey = (trackKey) =>
  `dl_${trackKey.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;

const parseUrl = (url) => {
  const parts = url.split('/');
  return { artistName: parts[parts.length - 2], fileName: parts[parts.length - 1] };
};

const pctOf = (downloaded, total) =>
  total > 0 ? Math.min(100, Math.max(0, Math.round((downloaded / total) * 100))) : 0;

// Remove ".tmp_*" / "*_range" files written by the previous react-native-fs engine.
const cleanupLegacyTempFiles = async () => {
  if (!(await exists(AUDIO_DIRECTORY_PATH).catch(() => false))) return;
  const artists = await readDir(AUDIO_DIRECTORY_PATH).catch(() => []);
  await Promise.all(
    artists
      .filter((a) => a.isDirectory?.())
      .map(async (artist) => {
        const files = await readDir(artist.path).catch(() => []);
        await Promise.all(
          files
            .filter((f) => f.name.startsWith('.tmp_') || f.name.endsWith('_range'))
            .map((f) => unlink(f.path).catch(() => {}))
        );
      })
  );
};

// Applies the native download config. OS progress notifications are ENABLED so
// the download foreground service (dataSync on Android <14) surfaces its standard
// system progress notification — which on Android 13+ only shows if the user has
// granted POST_NOTIFICATIONS (requested once via ensureNotificationPermission
// before the first task starts). In-app toasts still confirm start/finish; the
// notification adds the conventional Android download UI on top.
const applyDownloadConfig = () => {
  setConfig({
    progressInterval: 1000,
    maxParallelDownloads: MAX_PARALLEL,
    showNotificationsEnabled: true,
  });
};

// Imperative bridge so the UI (DownloadButton) can cancel the engine's live
// native tasks, which live inside the hook. The hook installs the real
// implementation on mount; before that it's a safe no-op.
export const downloadControls = {
  cancel: async (_trackKey) => {},
};

const useGlobalDownloadManager = () => {
  const dispatch = useDispatch();
  const downloadQueue = useSelector((s) => s.downloadQueue);
  const downloadWifiOnly = useSelector((s) => s.downloadWifiOnly);
  const downloadRegistry = useSelector((s) => s.downloadRegistry);

  // Refs so the long-lived native callbacks always read current values.
  const queueRef = useRef(downloadQueue);
  const wifiOnlyRef = useRef(downloadWifiOnly);
  const registryRef = useRef(downloadRegistry);
  // Conservative default: treat network as UNKNOWN until NetInfo.fetch() resolves.
  const networkRef = useRef({ isConnected: false, isWifi: false });
  const dispatchRef = useRef(dispatch);
  // trackKey -> native DownloadTask. Prevents double-starting a live task.
  const activeTasksRef = useRef(new Map());
  // trackKeys whose startTask() is mid-flight (async gap before activeTasksRef
  // is populated) — closes the double-start race when the processor re-runs.
  // trackKey -> the time its start began. A Map rather than a Set so a guard
  // that outlives STARTING_STALE_MS can be identified and dropped: without
  // that, one wedged start left a track on "queued" for the whole session.
  const startingRef = useRef(new Map());
  const configAppliedRef = useRef(false);
  // Caches the one-time notification-permission request (see
  // ensureNotificationPermission) so the whole first download batch awaits a
  // single OS prompt instead of racing several.
  const notifPermPromiseRef = useRef(null);
  // trackKey -> stall-detection timer id. Re-armed on every progress event.
  const stallTimersRef = useRef(new Map());
  const [networkReady, setNetworkReady] = useState(false);
  // Bumped on every NetInfo event so the queue processor re-evaluates whenever
  // the connection changes. Without it the processor only woke when the QUEUE
  // changed, so a network that came back without moving any entry's status left
  // "queued" downloads sitting there until something else happened to touch the
  // queue. Regaining a connection is exactly when they should start.
  const [networkTick, setNetworkTick] = useState(0);

  useEffect(() => { queueRef.current = downloadQueue; }, [downloadQueue]);
  useEffect(() => { wifiOnlyRef.current = downloadWifiOnly; }, [downloadWifiOnly]);
  useEffect(() => { registryRef.current = downloadRegistry; }, [downloadRegistry]);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);

  // ── Low-level task control ─────────────────────────────────────────────────
  const clearStallTimer = (trackKey) => {
    const t = stallTimersRef.current.get(trackKey);
    if (t) {
      clearTimeout(t);
      stallTimersRef.current.delete(trackKey);
    }
  };

  // Stop a live native task and forget its handle. The native lib discards its
  // own partial temp file on stop(); the destination file only ever appears on
  // successful completion, so there is nothing of ours to clean up here.
  const stopActiveTask = (trackKey) => {
    clearStallTimer(trackKey);
    const task = activeTasksRef.current.get(trackKey);
    if (task) {
      task.stop().catch(() => {});
      activeTasksRef.current.delete(trackKey);
    }
  };

  // Arm (or re-arm) the stall watchdog for a downloading task. If no progress
  // arrives within STALL_TIMEOUT_MS, stop the task and re-queue it for a clean
  // restart from byte 0.
  const armStallTimer = (trackKey) => {
    clearStallTimer(trackKey);
    const t = setTimeout(() => {
      stallTimersRef.current.delete(trackKey);
      if (queueRef.current[trackKey]?.status !== 'downloading') return;
      // A stalled transfer is the network's doing and heals itself here — a
      // message, not a Crashlytics error.
      logMessage(`Stall detected for ${trackKey} — restarting`);
      stopActiveTask(trackKey);
      dispatchRef.current(updateDownloadStatus(trackKey, 'queued'));
    }, STALL_TIMEOUT_MS);
    stallTimersRef.current.set(trackKey, t);
  };

  // Install the imperative cancel control used by the UI.
  useEffect(() => {
    downloadControls.cancel = async (trackKey) => {
      stopActiveTask(trackKey);
      const entry = queueRef.current[trackKey];
      dispatchRef.current(removeDownloadQueueEntry(trackKey));
      // Defensive: if the file had just reached its destination, remove it so a
      // cancel never leaves a half-registered orphan behind.
      if (entry?.audioUrl) {
        const { artistName, fileName } = parseUrl(entry.audioUrl);
        await unlink(`${AUDIO_DIRECTORY_PATH}/${artistName}/${fileName}`).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Failure → retry with backoff, then 'failed' ────────────────────────────
  const handleFailure = (trackKey, message) => {
    clearStallTimer(trackKey);
    activeTasksRef.current.delete(trackKey);
    const current = queueRef.current[trackKey];
    if (!current) return;
    const retryCount = (current.retryCount ?? 0) + 1;
    if (retryCount >= 3) {
      dispatchRef.current(updateDownloadStatus(trackKey, 'failed', { errorMessage: message, retryCount }));
      return;
    }
    dispatchRef.current(updateDownloadStatus(trackKey, 'paused_retry', { retryCount }));
    setTimeout(() => {
      if (queueRef.current[trackKey]?.status === 'paused_retry') {
        dispatchRef.current(updateDownloadStatus(trackKey, 'queued', { retryCount }));
      }
    }, RETRY_DELAYS[Math.min(retryCount - 1, 2)]);
  };

  // ── Finalize (idempotent) ──────────────────────────────────────────────────
  // Runs when a download completes — from the live `done` event, OR on the next
  // app start for downloads that finished while the app was terminated.
  const finalizeDownload = async (meta) => {
    const { trackKey, audioUrl, displayName, baniTitle, baniNameUni, baniId, sizeMB, relativePath, finalPath, downloadNetwork } = meta;
    clearStallTimer(trackKey);
    try {
      if (registryRef.current[relativePath]) {
        dispatchRef.current(removeDownloadQueueEntry(trackKey));
        return;
      }
      // The native layer only moves the file to `destination` once complete, so
      // its presence + size is our integrity check.
      if (!(await exists(finalPath))) throw new Error('Completed file missing on disk');
      const { size } = await stat(finalPath);
      if (Number(size) < MIN_VALID_BYTES) {
        await unlink(finalPath).catch(() => {});
        throw new Error(`File too small: ${size} bytes`);
      }

      // Companion lyrics file (small; best-effort, JS-thread fetch).
      await downloadLyricsOnly(audioUrl, displayName, { skipDirectorySetup: true }).catch(() => {});

      dispatchRef.current(addDownloadEntry({
        relativePath,
        artistDisplayName: displayName,
        baniTitle,
        // Unicode Gurmukhi name — ManageDownloads renders this with the Unicode
        // BalooPaaji font, so without it the row falls back to the legacy-ASCII
        // baniTitle and shows gibberish ("jpuji swibh" instead of ਜਪੁਜੀ ਸਾਹਿਬ).
        baniNameUni,
        baniId,
        sizeMB: sizeMB ?? 0,
        // Exact on-disk byte count — used for deterministic integrity checks
        // (a file that isn't exactly this size is truncated/corrupt).
        sizeBytes: Number(size) || 0,
        hasLyrics: false,
        downloadedAt: Date.now(),
      }));
      trackTrackDownload(baniId, displayName, baniTitle, downloadNetwork);
      dispatchRef.current(updateDownloadStatus(trackKey, 'completed'));
      logMessage(`Download complete: ${relativePath}`);

      // Show a single "complete" toast once nothing else is still downloading —
      // so a batch ("download all") produces one toast at the end, not one per
      // track. (Exclude this track: its 'completed' status may not be in the ref
      // yet.) Active downloads notify the user; finished ones confirm via toast.
      const othersActive = Object.entries(queueRef.current).some(
        ([k, t]) => k !== trackKey && ACTIVE_STATUSES.includes(t.status)
      );
      if (!othersActive) showSuccessToast(STRINGS.DOWNLOAD_COMPLETE);

      setTimeout(() => dispatchRef.current(removeDownloadQueueEntry(trackKey)), COMPLETED_CLEANUP_MS);
    } catch (err) {
      logNetworkError(`Finalize failed for ${displayName}: ${err?.message}`, err);
      handleFailure(trackKey, err?.message);
    } finally {
      activeTasksRef.current.delete(trackKey);
    }
  };

  // ── Wire native task events → Redux ────────────────────────────────────────
  const attachHandlers = (task, meta) => {
    task
      .begin(() => {
        dispatchRef.current(updateDownloadStatus(meta.trackKey, 'downloading'));
        dispatchRef.current(updateDownloadProgress(meta.trackKey, 0));
        armStallTimer(meta.trackKey);
      })
      .progress(({ bytesDownloaded, bytesTotal }) => {
        // Re-arm on every tick — the watchdog only fires if bytes stop flowing.
        armStallTimer(meta.trackKey);
        dispatchRef.current(updateDownloadProgress(meta.trackKey, pctOf(bytesDownloaded, bytesTotal)));
      })
      .done(() => {
        finalizeDownload(meta).finally(() => {
          // Required so iOS releases the background URLSession; harmless on Android.
          try { completeHandler(task.id); } catch (_) { /* best effort */ }
        });
      })
      .error(({ error }) => {
        logNetworkError(`Native download error for ${meta.displayName}: ${error}`, error);
        handleFailure(meta.trackKey, error);
      });
  };

  // Request notification permission once, lazily — the first time a real
  // download is about to start (never at app launch). This lets the download
  // foreground service show its progress notification on Android 13+, where it's
  // suppressed unless POST_NOTIFICATIONS is granted. Cached as a promise so every
  // task in the first batch awaits the same single prompt; a no-op on Android <13
  // / iOS / once the user has already decided.
  const ensureNotificationPermission = () => {
    if (!notifPermPromiseRef.current) {
      notifPermPromiseRef.current = requestNotificationPermission().catch(() => false);
    }
    return notifPermPromiseRef.current;
  };

  // ── Start one queued entry as a native task ────────────────────────────────
  const startTask = async (entry) => {
    const { trackKey, audioUrl } = entry;
    if (activeTasksRef.current.has(trackKey)) return;
    const startedAt = startingRef.current.get(trackKey);
    if (startedAt != null) {
      // Still within the window: a start is genuinely in flight, so leave it be.
      if (Date.now() - startedAt < STARTING_STALE_MS) return;
      logMessage(`Stale start guard cleared for ${trackKey} — retrying`);
    }
    startingRef.current.set(trackKey, Date.now());

    // EVERYTHING below is inside the try, and the guard is released in the
    // finally. It used to await the notification prompt and parse the URL
    // outside both: either one hanging or throwing skipped the finally and left
    // the key in `startingRef` for the life of the process. Every later run of
    // the queue processor then returned at the guard above, so the entry sat on
    // "queued" for ever — no error, no retry, nothing transferring. That is the
    // stuck-in-queued bug; this shape is what makes it unreachable.
    let meta = { trackKey, displayName: entry.displayName };
    try {
      // The prompt only decides whether the progress NOTIFICATION can be drawn.
      // The transfer does not depend on it, so it gets a deadline instead of the
      // queue waiting on the OS indefinitely — and because the promise is
      // memoised, one unanswered prompt used to block every later download too.
      await withDeadline(ensureNotificationPermission(), NOTIF_PERMISSION_TIMEOUT_MS, false);

      const { artistName, fileName } = parseUrl(audioUrl);
      const relativePath = `${artistName}/${fileName}`;
      const finalPath = `${AUDIO_DIRECTORY_PATH}/${relativePath}`;
      meta = {
        trackKey,
        audioUrl,
        displayName: entry.displayName,
        baniTitle: entry.baniTitle,
        baniNameUni: entry.baniNameUni,
        baniId: entry.baniId,
        sizeMB: entry.sizeMB ?? 0,
        relativePath,
        finalPath,
        // Connection the download starts on — recorded so the completion
        // analytics reports what the user actually used (always a concrete
        // value, never null).
        downloadNetwork: networkRef.current.isWifi
          ? 'wifi'
          : networkRef.current.isConnected
          ? 'mobile_data'
          : 'unknown',
        // Bani name (Punjabi) + artist (English) — the notification title.
        groupName: [entry.baniNameUni || entry.baniTitle, entry.displayName]
          .filter(Boolean)
          .join('  •  ') || 'Sundar Gutka',
      };

      // Already fully downloaded (e.g. re-enqueued) → finalize immediately.
      if (await exists(finalPath)) {
        const { size } = await stat(finalPath);
        if (Number(size) >= MIN_VALID_BYTES) {
          await finalizeDownload(meta);
          return;
        }
        await unlink(finalPath).catch(() => {});
      }

      // Low-storage guard: never start a download that can't fit (with headroom).
      if (meta.sizeMB > 0) {
        const fsInfo = await getFSInfo().catch(() => null);
        const needBytes = meta.sizeMB * 1024 * 1024 * 1.1; // 10% headroom
        if (fsInfo && Number(fsInfo.freeSpace) < needBytes) {
          throw new Error('NOT_ENOUGH_STORAGE');
        }
      }

      await ensureArtistDirectory(artistName);

      dispatchRef.current(updateDownloadStatus(trackKey, 'downloading'));

      if (!configAppliedRef.current) {
        configAppliedRef.current = true;
        applyDownloadConfig();
      }

      // Always allow metered at the OS level — "WiFi-only" is enforced in JS (the
      // queue processor / NetInfo gate won't START on cellular when it's on), so
      // the native metered restriction is unnecessary and only risks the OS
      // parking the transfer ("waiting for WiFi") on networks Android flags metered.
      const task = createDownloadTask({
        id: taskIdForKey(trackKey),
        url: audioUrl,
        destination: finalPath,
        metadata: meta,
        isAllowedOverMetered: true,
        isAllowedOverRoaming: true,
      });
      activeTasksRef.current.set(trackKey, task);
      attachHandlers(task, meta);
      task.start();
    } catch (err) {
      logNetworkError(`Failed to start download for ${meta.displayName}: ${err?.message}`, err);
      if (err?.message === 'NOT_ENOUGH_STORAGE') {
        activeTasksRef.current.delete(trackKey);
        dispatchRef.current(updateDownloadStatus(trackKey, 'failed', {
          errorMessage: 'NOT_ENOUGH_STORAGE',
          retryCount: 3,
        }));
      } else {
        handleFailure(trackKey, err?.message);
      }
    } finally {
      startingRef.current.delete(trackKey);
    }
  };

  // ── Native config — applied once before the queue processor runs ───────────
  useEffect(() => {
    applyDownloadConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Queue processor — starts allowed 'queued' entries ──────────────────────
  useEffect(() => {
    if (!networkReady) return;

    const { isConnected, isWifi } = networkRef.current;
    const queued = Object.values(downloadQueue).filter((t) => t.status === 'queued');
    if (queued.length === 0) return;

    if (!isConnected) {
      queued.forEach((t) => dispatch(updateDownloadStatus(t.trackKey, 'paused_no_network')));
      return;
    }
    if (!isWifi && downloadWifiOnly) {
      queued.forEach((t) => dispatch(updateDownloadStatus(t.trackKey, 'paused_wifi_only')));
      return;
    }
    queued.forEach((entry) => startTask(entry));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadQueue, downloadWifiOnly, networkReady, networkTick]);

  // ── Initial network state fetch (runs once on mount) ───────────────────────
  //
  // `networkReady` gates the queue processor, so this one read decides whether
  // ANYTHING downloads. It was awaited unbounded: a fetch that never settles
  // (neither resolve nor reject, so the .catch below never fires either) left
  // the flag false and every entry sitting on "queued" for the life of the
  // process. It is bounded now, and the live NetInfo listener corrects
  // whatever the fallback assumed on its first event.
  useEffect(() => {
    let mounted = true;
    withDeadline(NetInfo.fetch(), NETWORK_READY_TIMEOUT_MS, null).then((state) => {
      if (!mounted) return;
      if (state) {
        networkRef.current = {
          isConnected: Boolean(state.isConnected),
          isWifi: state.type === 'wifi',
        };
      } else {
        // Assume an allowed network rather than stalling the queue. If that is
        // wrong the download fails and retries, which is recoverable; never
        // starting is not.
        logMessage('NetInfo did not answer in time — assuming an allowed network');
        networkRef.current = { isConnected: true, isWifi: true };
      }
      setNetworkReady(true);
    });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── App-start reconcile ────────────────────────────────────────────────────
  // Adopt tasks still running in the background, finalize ones that completed
  // while the app was terminated, and restart anything the OS left paused.
  useEffect(() => {
    let cancelled = false;

    const reattach = async () => {
      // Bounded: the engine answers by asking the system downloads provider,
      // which some OEM builds start slowly or have disabled. Waiting on it
      // forever would leave every download in the queue un-adopted for the
      // whole session; giving up leaves them where they were, and the next
      // launch asks again.
      const existing = await Promise.race([
        getExistingDownloadTasks().catch((err) => {
          logNetworkError(`Reattach failed: ${err?.message}`, err);
          return [];
        }),
        new Promise((resolve) => {
          setTimeout(() => resolve(null), REATTACH_TIMEOUT_MS);
        }),
      ]);
      if (cancelled) return;
      if (existing === null) {
        logMessage("Reattach skipped: download engine did not answer in time");
        return;
      }

      await Promise.all(existing.map(async (task) => {
        const meta = task.metadata && task.metadata.trackKey ? task.metadata : null;
        if (!meta) {
          await task.stop().catch(() => {});
          return;
        }
        // Ensure a Redux queue entry exists for the UI.
        if (!queueRef.current[meta.trackKey]) {
          dispatch(enqueueDownload({
            trackKey: meta.trackKey,
            audioUrl: meta.audioUrl,
            displayName: meta.displayName,
            baniTitle: meta.baniTitle,
            baniId: meta.baniId,
            sizeMB: meta.sizeMB,
          }));
        }

        if (task.state === 'DONE') {
          attachHandlers(task, meta);
          await finalizeDownload(meta);
          try { completeHandler(task.id); } catch (_) { /* best effort */ }
          return;
        }

        if (task.state === 'DOWNLOADING') {
          // Still transferring in the background — adopt it and let it finish.
          activeTasksRef.current.set(meta.trackKey, task);
          attachHandlers(task, meta);
          dispatch(updateDownloadStatus(meta.trackKey, 'downloading'));
          armStallTimer(meta.trackKey);
          return;
        }

        // Anything else (PAUSED by the OS, etc.) — we don't resume; stop and
        // re-queue for a clean restart from byte 0.
        await task.stop().catch(() => {});
        dispatch(updateDownloadStatus(meta.trackKey, 'queued'));
      }));
    };

    reattach();
    cleanupLegacyTempFiles().catch(() => {});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Network listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(({ isConnected, type }) => {
      const isWifi = type === 'wifi';
      networkRef.current = { isConnected: Boolean(isConnected), isWifi };
      // Wake the queue processor on every event, whatever the branches below
      // decide: coming back online must restart a queued download on its own.
      setNetworkTick((n) => n + 1);

      if (!isConnected) {
        // Offline: stop any in-flight transfer and mark everything waiting.
        Object.values(queueRef.current).forEach((t) => {
          if (t.status === 'downloading') stopActiveTask(t.trackKey);
          if (t.status === 'downloading' || t.status === 'queued') {
            dispatch(updateDownloadStatus(t.trackKey, 'paused_no_network'));
          }
        });
      } else if (!isWifi && wifiOnlyRef.current) {
        // Switched to cellular while WiFi-only is ON — stop so no metered bytes
        // flow, and mark waiting. Restarts from zero when WiFi returns.
        Object.values(queueRef.current).forEach((t) => {
          if (t.status === 'downloading') stopActiveTask(t.trackKey);
          if (t.status === 'downloading' || t.status === 'queued') {
            dispatch(updateDownloadStatus(t.trackKey, 'paused_wifi_only'));
          }
        });
      } else {
        // Back on an allowed network — re-queue everything that was waiting,
        // plus anything that exhausted its retries while offline ('failed') so
        // it heals itself without the user needing to tap retry. Storage
        // failures are skipped in the reducer (retrying won't free space).
        dispatch(requeuePausedDownloads(['paused_no_network', 'paused_wifi_only', 'failed']));
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When WiFi-only is turned OFF while on cellular, release the gate.
  useEffect(() => {
    if (!downloadWifiOnly && networkRef.current.isConnected) {
      dispatch(requeuePausedDownloads(['paused_wifi_only']));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadWifiOnly]);

  // Clean up all stall timers on unmount (defensive; mounted for the app's life).
  useEffect(() => () => {
    stallTimersRef.current.forEach((t) => clearTimeout(t));
    stallTimersRef.current.clear();
  }, []);
};

export default useGlobalDownloadManager;
