/**
 * DownloadButton — compact circular download indicator for the player row.
 *
 * No pause/resume: files are small + CDN-served, so a download is ~instant.
 * No progress %: an active download just shows an indeterminate spinner.
 *
 * States:
 *  • idle           — cloud-download icon; tap starts download
 *  • queued         — pulsing cloud icon; waiting for a slot
 *  • downloading    — indeterminate spinner; tap cancels
 *  • paused_retry   — pulsing cloud icon (automatic retry backoff)
 *  • paused_wifi    — wifi icon; tap → "use mobile data"
 *  • paused_no_net  — cloud-off icon (waiting for connection)
 *  • failed         — error icon; tap retries (or shows storage dialog)
 *  • completed      — offline-pin icon; tap → remove confirm
 */
import React, { useEffect, useRef, useCallback } from "react";
import { View, Pressable, Animated, Vibration, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { Icon } from "@rneui/themed";
import { Spinner } from "@common/components/ui";
import { DownloadIcon } from "@common/icons";
import PropTypes from "prop-types";
import { unlink } from "react-native-fs";
import { STRINGS, showConfirm, showInfoToast, navigate } from "@common";
import {
  enqueueDownload,
  retryDownload,
  removeDownloadQueueEntry,
  removeDownloadEntries,
  toggleDownloadWifiOnly,
} from "@common/actions";
import { downloadControls } from "@common/services/globalDownloadManager";
import { useAudioTheme } from "../../useAudioTheme";
import { getLocalTrackPath, AUDIO_DIRECTORY_PATH } from "../../utils/audioDownloader";

// Canvas size for the icon slot (keeps every state visually aligned in the row).
const SIZE = 40;

const DownloadButton = ({ track = null, baniTitle = "", baniNameUni = "", baniId = "" }) => {
  const { theme } = useAudioTheme();
  const dispatch = useDispatch();

  const downloadQueue = useSelector((s) => s.downloadQueue);
  const downloadRegistry = useSelector((s) => s.downloadRegistry);
  const downloadWifiOnly = useSelector((s) => s.downloadWifiOnly);

  const trackKey = track?.audioUrl ? getLocalTrackPath(track.audioUrl) : null;
  const queueEntry = trackKey ? downloadQueue[trackKey] : null;
  const inRegistry = Boolean(trackKey && downloadRegistry[trackKey]);

  const status = queueEntry?.status ?? (inRegistry ? "completed" : "idle");

  // ── Animation state (pulse for queued/retry only) ──────────────────────────
  const prevStatusRef = useRef(status);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  // Haptic on download completion.
  useEffect(() => {
    if (prevStatusRef.current === "downloading" && status === "completed") {
      Vibration.vibrate(12);
    }
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status === "queued" || status === "paused_retry") {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
      pulseAnim.setValue(1);
    }
    // Stop the loop on unmount too. Without this, a component that unmounts while
    // still 'queued' (e.g. leaving the reader mid-download) leaves the native
    // pulse loop running against a node that is about to be dropped, feeding the
    // NativeAnimated "connectAnimatedNodes: node does not exist" crash race.
    return () => {
      pulseLoopRef.current?.stop();
      pulseLoopRef.current = null;
    };
  }, [status, pulseAnim]);

  // ── Tap handlers ───────────────────────────────────────────────────────────
  const onTapIdle = useCallback(async () => {
    if (!track?.audioUrl || !trackKey) return;
    const enqueue = () => {
      dispatch(
        enqueueDownload({
          trackKey,
          audioUrl: track.remoteUrl || track.audioUrl,
          displayName: track.displayName,
          baniTitle,
          baniNameUni: baniNameUni || baniTitle,
          baniId,
          sizeMB: track.trackSizeMB,
        }),
      );
      showInfoToast(STRINGS.DOWNLOAD_STARTED);
    };

    const net = await NetInfo.fetch();
    // Wi-Fi-only is ON and we're on cellular — offer to use mobile data, which
    // turns the setting off and proceeds. (Positive `=== 'cellular'` test: never
    // misfire on VPN/ethernet/unknown, which `!== 'wifi'` wrongly flags.)
    if (downloadWifiOnly && net.type === "cellular") {
      showConfirm({
        title: STRINGS.WIFI_ONLY_ALERT_TITLE,
        message: STRINGS.WIFI_ONLY_ALERT_BODY,
        cancelText: STRINGS.cancel,
        confirmText: STRINGS.WIFI_ONLY_USE_MOBILE_DATA,
        onConfirm: () => {
          dispatch(toggleDownloadWifiOnly(false));
          enqueue();
        },
      });
      return;
    }
    enqueue();
  }, [track, trackKey, downloadWifiOnly, baniTitle, baniNameUni, baniId, dispatch]);

  const onCancel = useCallback(() => {
    if (!trackKey) return;
    showConfirm({
      title: STRINGS.CANCEL_DOWNLOAD_TITLE,
      message: STRINGS.CANCEL_DOWNLOAD_BODY.replace("{title}", track?.displayName ?? ""),
      cancelText: STRINGS.CANCEL_DOWNLOAD_KEEP,
      confirmText: STRINGS.CANCEL_DOWNLOAD_CONFIRM,
      destructive: true,
      // The manager stops the live native task and clears the queue entry.
      onConfirm: () => downloadControls.cancel(trackKey),
    });
  }, [track, trackKey]);

  const onTapCompleted = useCallback(() => {
    if (!trackKey) return;
    showConfirm({
      title: STRINGS.REMOVE_DOWNLOAD_TITLE,
      message: STRINGS.REMOVE_DOWNLOAD_BODY.replace("{title}", track?.displayName ?? ""),
      cancelText: STRINGS.cancel,
      neutralText: STRINGS.REMOVE_DOWNLOAD_MANAGE,
      confirmText: STRINGS.REMOVE_DOWNLOAD_CONFIRM,
      destructive: true,
      onNeutral: () => navigate("ManageDownloads"),
      onConfirm: async () => {
        const base = `${AUDIO_DIRECTORY_PATH}/${trackKey}`;
        await unlink(base).catch(() => {});
        await unlink(base.replace(/\.m4a$/, ".json")).catch(() => {});
        dispatch(removeDownloadEntries([trackKey]));
        dispatch(removeDownloadQueueEntry(trackKey));
      },
    });
  }, [track, trackKey, dispatch]);

  const onTapWifiOnly = useCallback(() => {
    showConfirm({
      title: STRINGS.WIFI_ONLY_ALERT_TITLE,
      message: STRINGS.WIFI_ONLY_ALERT_BODY,
      cancelText: STRINGS.cancel,
      confirmText: STRINGS.WIFI_ONLY_USE_MOBILE_DATA,
      // Turning Wi-Fi-only off triggers the manager's requeue effect, which
      // resumes any paused_wifi_only downloads.
      onConfirm: () => dispatch(toggleDownloadWifiOnly(false)),
    });
  }, [dispatch]);

  if (!track?.audioUrl) return null;

  // Every download state — idle, downloading, downloaded, waiting, offline —
  // draws in the one interactive blue, so the control keeps a single identity as
  // it changes state.
  //
  // `textBrand`, NOT `primary`. `primary` is brand chrome and stays navy in both
  // themes, which is right behind white on the bottom bar but measures about
  // 1.3:1 on the dark Reader ground — these icons were all but invisible there.
  // `textBrand` is the role that stays navy in light mode and lifts to the
  // bright blue in dark, which is exactly "the primary blue of each mode".
  const primary = theme.c.textBrand;
  const mutedIcon = theme.c.textBrand;
  const HIT = { top: 8, bottom: 8, left: 8, right: 8 };

  // ── COMPLETED ──────────────────────────────────────────────────────────────
  if (status === "completed") {
    return (
      <Pressable style={s.wrap} onPress={onTapCompleted} hitSlop={HIT}>
        <Icon name="offline-pin" type="material" size={22} color={primary} />
      </Pressable>
    );
  }

  // ── DOWNLOADING ────────────────────────────────────────────────────────────
  // Indeterminate spinner with a centered stop-square — the standard
  // "downloading, tap to cancel" affordance. Visually distinct from the idle
  // download icon (no percentage shown).
  if (status === "downloading") {
    return (
      <Pressable
        style={s.wrap}
        onPress={onCancel}
        hitSlop={HIT}
        accessibilityRole="button"
        accessibilityLabel="download-in-progress"
      >
        <Spinner size="small" color={primary} />
        <View style={[s.stopSquare, { backgroundColor: primary }]} />
      </Pressable>
    );
  }

  // ── QUEUED / RETRY-BACKOFF ─────────────────────────────────────────────────
  if (status === "queued" || status === "paused_retry") {
    return (
      <View style={s.wrap}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Icon name="cloud-download" type="material" size={22} color={primary} />
        </Animated.View>
      </View>
    );
  }

  // ── PAUSED_WIFI_ONLY ───────────────────────────────────────────────────────
  if (status === "paused_wifi_only") {
    return (
      <Pressable style={s.wrap} onPress={onTapWifiOnly} hitSlop={HIT}>
        <Icon name="wifi" type="material" size={22} color={mutedIcon} />
      </Pressable>
    );
  }

  // ── PAUSED_NO_NETWORK ──────────────────────────────────────────────────────
  if (status === "paused_no_network") {
    return (
      <View style={s.wrap}>
        <Icon name="cloud-off" type="material" size={22} color={mutedIcon} />
      </View>
    );
  }

  // ── FAILED ─────────────────────────────────────────────────────────────────
  if (status === "failed") {
    const isStorageError = queueEntry?.errorMessage === "NOT_ENOUGH_STORAGE";
    return (
      <Pressable
        style={s.wrap}
        hitSlop={HIT}
        onPress={() => {
          if (isStorageError) {
            showConfirm({
              title: STRINGS.NOT_ENOUGH_STORAGE_TITLE,
              message: STRINGS.NOT_ENOUGH_STORAGE_BODY,
              confirmText: STRINGS.ok,
            });
          } else if (trackKey) {
            dispatch(retryDownload(trackKey));
          }
        }}
      >
        <Icon name="error-outline" type="material" size={22} color={theme.c.error} />
      </Pressable>
    );
  }

  // ── IDLE ───────────────────────────────────────────────────────────────────
  return (
    <Pressable style={s.wrap} onPress={onTapIdle} hitSlop={HIT}>
      <DownloadIcon size={22} color={mutedIcon} strokeWidth={1.5} />
    </Pressable>
  );
};

const s = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  // Small square centered inside the spinner — the "stop / tap to cancel" cue.
  stopSquare: {
    position: "absolute",
    top: (SIZE - 8) / 2,
    left: (SIZE - 8) / 2,
    width: 8,
    height: 8,
    borderRadius: 1.5,
  },
});

DownloadButton.propTypes = {
  track: PropTypes.shape({
    audioUrl: PropTypes.string,
    remoteUrl: PropTypes.string,
    displayName: PropTypes.string,
    trackSizeMB: PropTypes.number,
  }),
  baniTitle: PropTypes.string,
  baniNameUni: PropTypes.string,
  baniId: PropTypes.string,
};

export default DownloadButton;
