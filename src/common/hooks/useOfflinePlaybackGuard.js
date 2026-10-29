import { useEffect } from "react";
import TrackPlayer from "react-native-track-player";
import { pauseTrack } from "../TrackPlayerUtils";
import { useNetwork } from "../context";

// How long the device must stay DISCONNECTED before we pause a stream. A
// wifi<->cellular handoff briefly reports disconnected/unreachable and recovers
// well within this window, so a network *switch* never interrupts playback —
// only a genuine, sustained loss of connectivity does.
const OFFLINE_PAUSE_DELAY_MS = 4000;

/**
 * Offline-playback guard — the Spotify/YT-style reaction to losing connectivity.
 *
 * When the device genuinely loses its connection for a sustained moment, a track
 * STREAMING from the network can't continue, so we pause it (the player stays
 * open and the track loaded, so it's resumable). A downloaded (file://) track is
 * untouched.
 *
 * Deliberately uses raw `isConnected` (transport up/down), NOT `isOffline`: the
 * captive-portal / internet-reachability signal flickers during a network switch
 * and would falsely pause playback. And it waits OFFLINE_PAUSE_DELAY_MS before
 * acting, cancelling if connectivity returns — so switching networks mid-stream
 * never pauses the audio.
 *
 * Mounted once globally (see GlobalServices in app.js).
 */
const useOfflinePlaybackGuard = () => {
  const { isConnected } = useNetwork();

  useEffect(() => {
    // Only an explicit disconnect arms the timer; `true`/`null` (connected or
    // the unknown startup window) never pauses.
    if (isConnected !== false) return undefined;

    const timer = setTimeout(async () => {
      const activeTrack = await TrackPlayer.getActiveTrack().catch(() => null);
      const url = activeTrack?.url || "";
      // Nothing playing, or a LOCAL download is playing → leave it alone. Local
      // files are file:// on iOS but a bare absolute path (/…) on Android, so we
      // must accept both — otherwise downloaded tracks get wrongly paused offline.
      const isLocal = url.startsWith("file://") || url.startsWith("/");
      if (!activeTrack || isLocal) return;
      await pauseTrack().catch(() => {});
    }, OFFLINE_PAUSE_DELAY_MS);

    // Connectivity returned before the delay (it was just a switch/blip) →
    // cancel; playback is never interrupted.
    return () => clearTimeout(timer);
  }, [isConnected]);
};

export default useOfflinePlaybackGuard;
