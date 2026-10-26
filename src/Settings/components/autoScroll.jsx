import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleScreenAwake, toggleAutoScroll } from "@common/actions";
import { stopTrack, resetPlayer } from "@common/TrackPlayerUtils";
import { STRINGS } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const AutoScroll = () => {
  const dispatch = useDispatch();
  const isAutoScroll = useSelector((state) => state.isAutoScroll);

  const onValueChange = (value) => {
    /* The screen should remain active whenever Auto Scroll is enabled. */
    dispatch(toggleScreenAwake(value));
    dispatch(toggleAutoScroll(value));
    if (value) {
      // Fire-and-forget native cleanup; reducer mutex already flipped audio state.
      (async () => {
        try {
          await stopTrack();
          await resetPlayer();
        } catch (_) {
          // Best effort cleanup
        }
      })();
    }
  };

  return (
    <SettingsToggleRow
      title={STRINGS.AUTO_SCROLL}
      icon="auto-fix-high"
      value={isAutoScroll}
      onValueChange={onValueChange}
    />
  );
};

export default AutoScroll;
