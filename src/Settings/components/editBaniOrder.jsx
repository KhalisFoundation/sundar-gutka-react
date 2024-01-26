import React from "react";
import { ListItem, Avatar } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { nightModeStyles, nightModeColor } from "../styles/nightModeStyles";
import STRINGS from "../../common/localization";

function EditBaniOrder({ navigate }) {
  const { isNightMode } = useSelector((state) => state.isNightMode);
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
      <Avatar title="Edit bani order icon" source={rearrangeIcon} />
      <ListItem.Content>
        <ListItem.Title style={nightColor}>{EDIT_BANI_ORDER}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
}
EditBaniOrder.propTypes = { navigate: PropTypes.func.isRequired };
export default EditBaniOrder;
