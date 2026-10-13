import React from "react";
import SoundPlayer from "react-native-sound-player";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { STRINGS } from "@common";
import SelectSheet from "./SelectSheet";

// Dispatches a redux action for the chosen option. A thin adapter over
// `SelectSheet`, which owns the presentation for every chooser in Settings.
const BottomSheetComponent = ({
  isVisible,
  actionConstant,
  value,
  title,
  action,
  toggleVisible,
  onChange = undefined,
}) => {
  const dispatch = useDispatch();

  const onSelect = (key) => {
    toggleVisible(false);
    dispatch(action(key));
    // Some settings need work doing OUTSIDE the store once the value changes.
    // The reminder sound is one: the chosen sound is baked into each scheduled
    // notification when it is scheduled, so storing a new one changes nothing
    // that is already in the OS queue until the schedule is rewritten.
    onChange?.(key);
    // Reminder-sound options are named after their audio file; play a preview
    // so the choice can be heard rather than guessed from its label.
    if (key.includes(".mp3")) {
      SoundPlayer.playSoundFile(key.split(".mp3")[0], ".mp3");
    }
  };

  return (
    <SelectSheet
      visible={isVisible}
      title={title}
      options={actionConstant}
      value={value}
      onSelect={onSelect}
      onClose={() => toggleVisible(false)}
      closeLabel={STRINGS.cancel}
    />
  );
};

BottomSheetComponent.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  actionConstant: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  value: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  toggleVisible: PropTypes.func.isRequired,
  /** Runs after the value is stored, for side effects the store cannot do. */
  onChange: PropTypes.func,
};

export default BottomSheetComponent;
