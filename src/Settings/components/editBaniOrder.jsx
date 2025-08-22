import React from "react";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { STRINGS } from "@common";
import useThemedStyles from "@common/hooks/useThemedStyles";
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
        <ListItem.Title style={styles.listItemTitle}>{EDIT_BANI_ORDER}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
};
EditBaniOrder.propTypes = {
  navigate: PropTypes.func.isRequired,
};
export default EditBaniOrder;
