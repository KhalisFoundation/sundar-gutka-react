import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setLanguage, LANGUAGES } from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";

function LanguageComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { language } = useSelector((state) => state);

  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        onPress={() => {
          toggleVisible(false);
          dispatch(setLanguage(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title>{item.title}</ListItem.Title>
        </ListItem.Content>
        {language === item.key && <Icon name="check" />}
      </ListItem>
    );
  };
  const BottomSheetContent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={styles.bottomSheetTitle}>{STRINGS.language}</Text>
      {LANGUAGES.map((item) => renderItem(item, dispatch))}
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
        <Icon
          style={styles.imageStyle}
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="language"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.language}
          </ListItem.Title>
        </ListItem.Content>
        {language && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {LANGUAGES.filter((item) => item.key === language).map((item) => item.title)[0]}
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
export default LanguageComponent;
