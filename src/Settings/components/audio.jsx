import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleAudioAutoPlay } from "@common/actions";
import { STRINGS } from "@common";
import { SettingsToggleRow } from "./comon/SettingsRow";

const Audio = () => {
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const dispatch = useDispatch();

  return (
    <SettingsToggleRow
      title={STRINGS.AUDIO_AUTO_PLAY}
      icon="play-circle-outline"
      value={isAudioAutoPlay}
      onValueChange={(value) => dispatch(toggleAudioAutoPlay(value))}
    />
  );
};

export default Audio;
