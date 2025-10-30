import React from "react";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { STRINGS, useThemedStyles, ListItemTitle } from "@common";
import createStyles from "../styles";

const EditBaniOrder = ({ navigate }) => {
  const styles = useThemedStyles(createStyles);
  const { EDIT_BANI_ORDER } = STRINGS;
  const rearrangeIcon = require("../../../images/rearrangeicon.png");
  return (
    <ListItem
      bottomDivider
      containerStyle={styles.containerNightStyles}
      onPress={() => navigate("EditBaniOrder")}
    >
      <Avatar source={rearrangeIcon} avatarStyle={styles.avatarStyle} />
      <ListItem.Content>
        <ListItemTitle title={EDIT_BANI_ORDER} style={styles.listItemTitle} />
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};
EditBaniOrder.propTypes = {
  navigate: PropTypes.func.isRequired,
};
export default EditBaniOrder;
