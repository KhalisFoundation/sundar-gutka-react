import { useEffect } from "react";
import { AppState } from "react-native";
import { State, usePlaybackState } from "react-native-track-player";
import { useSelector } from "react-redux";
import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";

/**
 * BAT-02: Enhanced keep-awake hook that respects AppState.
 * The wakelock is released when the app is backgrounded/inactive and
 * re-acquired when it returns to the foreground — only if isScreenAwake is enabled.
 * Previously the lock was never released on background, draining battery unnecessarily.
 */
const useKeepAwake = () => {
  const isScreenAwake = useSelector((state) => state.isScreenAwake);
  // Audio keeps the screen on while it plays, whatever the setting says.
  //
  // Someone listening is usually reading along, and the screen going dark mid
  // bani is the interruption Keep Screen Awake exists to prevent. Unlike
  // auto-scroll this does NOT flip the saved setting: that would overwrite the
  // user's choice, sync it to their other devices, and leave it on after the
  // audio stops. It only widens when the lock is held, so the moment playback
  // pauses or ends the screen goes back to following the setting.
  //
  // Buffering counts as playing, so a stall mid-track does not let it sleep.
  // usePlaybackState is safe before the player is set up: it ignores that
  // failure and picks up playback from its event listener.
  const playbackState = usePlaybackState()?.state;
  const isAudioPlaying = playbackState === State.Playing || playbackState === State.Buffering;
  const shouldStayAwake = isScreenAwake || isAudioPlaying;

  // Activate/deactivate based on the setting and playback
  useEffect(() => {
    if (shouldStayAwake) {
      activateKeepAwake();
    } else {
      deactivateKeepAwake();
    }
  }, [shouldStayAwake]);

  // Release lock when backgrounded, re-acquire when foregrounded
  useEffect(() => {
    if (!shouldStayAwake) return; // nothing to hold

    const handleAppStateChange = (nextState) => {
      if (nextState === "active") {
        activateKeepAwake();
      } else {
        // "background" or "inactive" — release the wakelock so screen can dim/sleep
        deactivateKeepAwake();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [shouldStayAwake]);
};

export default useKeepAwake;
