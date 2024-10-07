import React from "react";
import { ListItem, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { STRINGS } from "@common";
import { iconNightColor, nightModeStyles, nightModeColor } from "../styles/nightModeStyles";

function About({ navigate }) {
  const isNightMode = useSelector((state) => state.isNightMode);
  const iconColor = iconNightColor(isNightMode);
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { about } = STRINGS;
  return (
    <ListItem containerStyle={containerNightStyles} bottomDivider onPress={() => navigate("About")}>
      <Icon color={iconColor} name="info" size={30} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{about}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
}
About.propTypes = { navigate: PropTypes.func.isRequired };
export default About;
