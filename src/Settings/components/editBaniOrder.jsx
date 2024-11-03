import React from "react";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { STRINGS } from "@common";
import { nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import { styles } from "../styles";

const EditBaniOrder = ({ navigate, isNightMode }) => {
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightColor = nightModeColor(isNightMode);
  const { EDIT_BANI_ORDER } = STRINGS;
  const rearrangeIcon = require("../../../images/rearrangeicon.png");
  return (
    <ListItem
      bottomDivider
      containerStyle={containerNightStyles}
      onPress={() => navigate("EditBaniOrder")}
    >
      <Avatar source={rearrangeIcon} avatarStyle={styles.avatarStyle} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{EDIT_BANI_ORDER}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};
EditBaniOrder.propTypes = {
  navigate: PropTypes.func.isRequired,
  isNightMode: PropTypes.bool.isRequired,
};
export default EditBaniOrder;
