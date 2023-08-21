import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setLanguage, LANGUAGES } from "../../common/actions";
import colors from "../../common/colors";

const renderItem = (item, dispatch, language, toggleVisible) => {
  const { key, title } = item;
  return (
    <ListItem
      key={key}
      bottomDivider
      onPress={() => {
        toggleVisible(false);
        dispatch(setLanguage(key));
      }}
    >
      <ListItem.Content>
        <ListItem.Title>{title}</ListItem.Title>
      </ListItem.Content>
      {language === key && <Icon name="check" />}
    </ListItem>
  );
};

function LanguageComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { language, isNightMode } = useSelector((state) => state);
  const dispatch = useDispatch();

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
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={styles.bottomSheetTitle}>{STRINGS.language}</Text>
          {LANGUAGES.map((item) => renderItem(item, dispatch, language, toggleVisible))}
        </BottomSheet>
      )}
    </>
  );
}

export default LanguageComponent;
