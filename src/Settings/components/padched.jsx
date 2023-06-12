import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setPadched, PADCHED_SETTINGS } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";

function PadchedSettingsComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { padched } = useSelector((state) => state);

  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        onPress={() => {
          toggleVisible(false);
          dispatch(setPadched(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title>{item.title}</ListItem.Title>
        </ListItem.Content>
        {padched === item.key && <Icon name="check" />}
      </ListItem>
    );
  };
  const BottomSheetContent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={styles.bottomSheetTitle}>{STRINGS.padchhed_settings}</Text>
      {PADCHED_SETTINGS.map((item) => renderItem(item, dispatch))}
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
        <Avatar source={require("../../../images/larivaaricon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.padchhed_settings}
          </ListItem.Title>
        </ListItem.Content>
        {padched && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {PADCHED_SETTINGS.filter((item) => item.key === padched).map((item) => item.title)[0]}
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
export default PadchedSettingsComponent;
