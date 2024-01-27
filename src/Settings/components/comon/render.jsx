import React from "react";
import { ListItem, Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { nightModeColor, nightModeStyles } from "../../styles/nightModeStyles";

function RenderBottomSheetItem({ item, toggleVisible, value, action }) {
  const isNightMode = useSelector((state) => state.isNightMode);
  const dispatch = useDispatch();
  const { key, title } = item;
  const { containerNightStyles } = nightModeStyles(isNightMode);
  const nightStyles = nightModeColor(isNightMode);
  return (
    <ListItem
      key={key}
      bottomDivider
      containerStyle={containerNightStyles}
      onPress={() => {
        toggleVisible(false);
        dispatch(action(key));
      }}
    >
      <ListItem.Content>
        <ListItem.Title style={nightStyles}>{title}</ListItem.Title>
      </ListItem.Content>
      {value === key && <Icon color={nightStyles.color} name="check" />}
    </ListItem>
  );
}
RenderBottomSheetItem.propTypes = {
  item: PropTypes.shape({ key: PropTypes.string.isRequired, title: PropTypes.string.isRequired })
    .isRequired,
  toggleVisible: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
};
export default RenderBottomSheetItem;
