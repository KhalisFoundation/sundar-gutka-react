import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setBaniLength, BANI_LENGTHS } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";

function BaniLengthComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { baniLength } = useSelector((state) => state);

  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleVisible(false);
          dispatch(setBaniLength(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {item.title}
          </ListItem.Title>
        </ListItem.Content>
        {baniLength === item.key && <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />}
      </ListItem>
    );
  };
  const BottomSheetContent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
        {STRINGS.bani_length}
      </Text>
      {BANI_LENGTHS.map((item) => renderItem(item, dispatch))}
    </BottomSheet>
  );

  const TriggerComponent = () => {
    return (
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
          <ListItem.Title style={[{ color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}>
            {BANI_LENGTHS.filter((item) => item.key === baniLength).map((item) => item.title)[0]}
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
export default BaniLengthComponent;
