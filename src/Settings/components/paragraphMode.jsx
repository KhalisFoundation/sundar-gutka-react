import React from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { toggleParagraphMode } from "../../common/actions";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import STRINGS from "../../common/localization";

function ParagraphMode() {
  const { isParagraphMode, isNightMode } = useSelector((state) => state);
  const dispatch = useDispatch();
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { PARAGRAPH_MODE } = STRINGS;
  return (
    <ListItem bottomDivider containerStyle={containerNightStyles}>
      <Icon color={iconColor} name="view-headline" size={30} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{PARAGRAPH_MODE}</ListItem.Title>
      </ListItem.Content>
      <Switch
        value={isParagraphMode}
        onValueChange={(value) => dispatch(toggleParagraphMode(value))}
      />
    </ListItem>
  );
}
export default ParagraphMode;
