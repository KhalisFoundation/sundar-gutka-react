import React from "react";
import { ListItem, Avatar, Icon, Switch } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import STRINGS from "../../common/localization";
import { toggleLarivaar, toggleLarivaarAssist } from "../../common/actions";
import colors from "../../common/colors";

function LarivaarComponent({ isNightMode, dispatch }) {
  const { isLarivaar, isLarivaarAssist } = useSelector((state) => state);

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={require("../../../images/larivaaricon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.larivaar}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isLarivaar} onValueChange={(value) => dispatch(toggleLarivaar(value))} />
      </ListItem>
      {isLarivaar && (
        <ListItem bottomDivider>
          <Icon name="opacity" size={30} />
          <ListItem.Content>
            <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
              {STRINGS.larivaar_assist}
            </ListItem.Title>
          </ListItem.Content>
          <Switch
            value={isLarivaarAssist}
            onValueChange={(value) => dispatch(toggleLarivaarAssist(value))}
          />
        </ListItem>
      )}
    </>
  );
}
LarivaarComponent.propTypes = {
  isNightMode: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};
export default LarivaarComponent;
