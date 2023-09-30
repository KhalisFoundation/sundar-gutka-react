import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar } from "@rneui/themed";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setPadched } from "../../common/actions";
import { PADCHED_SETTINGS } from "../../common/actions/constant";
import colors from "../../common/colors";
import RenderBottomSheetItem from "./comon/render";

function PadchedSettingsComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { padched, isNightMode } = useSelector((state) => state);

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
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.padchhed_settings}
          </Text>
          {PADCHED_SETTINGS.map((item) => (
            <RenderBottomSheetItem
              key={item.key}
              item={item}
              toggleVisible={toggleVisible}
              value={padched}
              action={setPadched}
            />
          ))}
        </BottomSheet>
      )}
    </>
  );
}

export default PadchedSettingsComponent;
