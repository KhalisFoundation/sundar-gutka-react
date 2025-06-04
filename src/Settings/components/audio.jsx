import React from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { STRINGS } from "@common";
import { toggleAudio } from "@common/actions";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";

const Audio = () => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const isAudio = useSelector((state) => state.isAudio);
  const dispatch = useDispatch();
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { AUDIO } = STRINGS;

  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      <Icon color={iconColor} name="music-note" type="material" />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{AUDIO || "Audio"}</ListItem.Title>
      </ListItem.Content>
      <Switch
        value={isAudio}
        onValueChange={(value) => {
          dispatch(toggleAudio(value));
        }}
      />
    </ListItem>
  );
};

export default Audio;
