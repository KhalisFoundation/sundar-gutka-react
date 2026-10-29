import { useEffect } from "react";
import { AppState } from "react-native";
import { pauseTrack } from "../TrackPlayerUtils";

/**
 * Pause playback whenever the app loses focus, from any screen.
 *
 * Product decision: any focus loss — home button, back-out, recents, screen lock
 * (Android → "background"), or a transient interruption like the app switcher /
 * Control Center / an incoming call (iOS → "inactive") — should pause Gurbani
 * audio rather than let it keep streaming unattended. The one exception is honoured
 * for free: if the user then taps Play on the media notification, RNTP resumes and
 * we never re-pause it — a fresh non-active event only fires after the app has been
 * foregrounded again, so a deliberate notification resume is left alone.
 *
 * pause() on an idle/stopped player is a harmless no-op, so there's no need to
 * query playback state first.
 *
 * Mounted once globally (see GlobalServices in app.js).
 */
const usePauseAudioOnExit = () => {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        pauseTrack().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);
};

export default usePauseAudioOnExit;
