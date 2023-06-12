import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setFontFace, FONT_FACES } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";

function FontFaceComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { fontFace } = useSelector((state) => state);

  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        onPress={() => {
          toggleVisible(false);
          dispatch(setFontFace(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title>{item.title}</ListItem.Title>
        </ListItem.Content>
        {fontFace === item.key && <Icon name="check" />}
      </ListItem>
    );
  };
  const BottomSheetContent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={styles.bottomSheetTitle}>{STRINGS.font_face}</Text>
      {FONT_FACES.map((item) => renderItem(item, dispatch))}
    </BottomSheet>
  );

  const TriggerComponent = () => {
    return (
      <ListItem
        bottomDivider
        containerStyle={[{ backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : null }]}
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
    );
  };
  return (
    <>
      <TriggerComponent />
      {isVisible && <BottomSheetContent />}
    </>
  );
}
export default FontFaceComponent;
