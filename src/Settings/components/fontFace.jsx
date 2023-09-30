import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar } from "@rneui/themed";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setFontFace } from "../../common/actions";
import { FONT_FACES } from "../../common/actions/constant";
import colors from "../../common/colors";
import RenderBottomSheetItem from "./comon/render";

function FontFaceComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { fontFace, isNightMode } = useSelector((state) => state);

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
          {FONT_FACES.map((item) => (
            <RenderBottomSheetItem
              key={item.key}
              item={item}
              toggleVisible={toggleVisible}
              value={fontFace}
              action={setFontFace}
            />
          ))}
        </BottomSheet>
      )}
    </>
  );
}

export default FontFaceComponent;
