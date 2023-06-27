import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setFontFace, FONT_FACES } from "../../common/actions";
import colors from "../../common/colors";

const renderItem = (item, dispatch, isNightMode, toggleVisible, fontFace) => {
  return (
    <ListItem
      key={item.key}
      bottomDivider
      containerStyle={[
        { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
      ]}
      onPress={() => {
        toggleVisible(false);
        dispatch(setFontFace(item.key));
      }}
    >
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {item.title}
        </ListItem.Title>
      </ListItem.Content>
      {fontFace === item.key && <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />}
    </ListItem>
  );
};
function FontFaceComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { fontFace } = useSelector((state) => state);

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleVisible(true);
        }}
      >
        <Avatar source={require("../../../images/fontfaceicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_face}
          </ListItem.Title>
        </ListItem.Content>
        {fontFace && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {FONT_FACES.filter((item) => item.key === fontFace).map((item) => item.title)[0]}
          </ListItem.Title>
        )}
        <ListItem.Chevron />
      </ListItem>
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_face}
          </Text>
          {FONT_FACES.map((item) =>
            renderItem(item, dispatch, isNightMode, toggleVisible, fontFace)
          )}
        </BottomSheet>
      )}
    </>
  );
}
FontFaceComponent.propTypes = {
  isNightMode: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};
export default FontFaceComponent;
