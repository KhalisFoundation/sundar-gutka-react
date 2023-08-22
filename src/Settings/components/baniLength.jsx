import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar } from "@rneui/themed";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setBaniLength, BANI_LENGTHS } from "../../common/actions";
import colors from "../../common/colors";
import RenderItem from "./comon/render";

function BaniLengthComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { baniLength, isNightMode } = useSelector((state) => state);

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
        <Avatar source={require("../../../images/banilengthicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.bani_length}
          </ListItem.Title>
        </ListItem.Content>
        {baniLength && (
          <ListItem.Title
            style={[{ color: isNightMode ? colors.WHITE_COLOR : colors.DISABLED_TEXT_COLOR }]}
          >
            {BANI_LENGTHS.filter((item) => item.key === baniLength).map((item) => item.title)[0]}
          </ListItem.Title>
        )}
        <ListItem.Chevron />
      </ListItem>
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.bani_length}
          </Text>
          {BANI_LENGTHS.map((item) => (
            <RenderItem
              key={item.key}
              item={item}
              toggleVisible={toggleVisible}
              value={baniLength}
              action={setBaniLength}
            />
          ))}
        </BottomSheet>
      )}
    </>
  );
}

export default BaniLengthComponent;
