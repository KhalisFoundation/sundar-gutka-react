import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar } from "@rneui/themed";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setFontSize, FONT_SIZES } from "../../common/actions";
import colors from "../../common/colors";
import RenderItem from "./comon/render";

function FontSizeComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { fontSize, isNightMode } = useSelector((state) => state);

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
        <Avatar source={require("../../../images/fontsizeicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_size}
          </ListItem.Title>
        </ListItem.Content>
        {fontSize && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {FONT_SIZES.filter((item) => item.key === fontSize).map((item) => item.title)[0]}
          </ListItem.Title>
        )}
        <ListItem.Chevron />
      </ListItem>
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_size}
          </Text>
          {FONT_SIZES.map((item) => (
            <RenderItem
              key={item.key}
              item={item}
              toggleVisible={toggleVisible}
              value={fontSize}
              action={setFontSize}
            />
          ))}
        </BottomSheet>
      )}
    </>
  );
}

export default FontSizeComponent;
