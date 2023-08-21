import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import {
  setTransliteration,
  toggleTransliteration,
  TRANSLITERATION_LANGUAGES,
} from "../../common/actions";
import colors from "../../common/colors";
import styles from "../styles/styles";

const renderItem = (item, dispatch, isNightMode, toggleVisible, transliterationLanguage) => {
  return (
    <ListItem
      key={item.key}
      bottomDivider
      containerStyle={[
        { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
      ]}
      onPress={() => {
        toggleVisible(false);
        dispatch(setTransliteration(item.key));
      }}
    >
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {item.title}
        </ListItem.Title>
      </ListItem.Content>
      {transliterationLanguage === item.key && (
        <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />
      )}
    </ListItem>
  );
};
function TransliterationComponent() {
  const romanizedIcon = require("../../../images/romanizeicon.png");
  const [isVisible, toggleVisible] = useState(false);
  const { transliterationLanguage, isTransliteration, isNightMode } = useSelector((state) => state);
  const dispatch = useDispatch();

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={romanizedIcon} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.transliteration}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isTransliteration}
          onValueChange={(value) => dispatch(toggleTransliteration(value))}
        />
      </ListItem>
      {isTransliteration && (
        <ListItem
          bottomDivider
          onPress={() => toggleVisible(true)}
          containerStyle={[
            { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
          ]}
        >
          <Avatar />
          <ListItem.Content>
            <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
              {STRINGS.language}
            </ListItem.Title>
          </ListItem.Content>
          {transliterationLanguage && (
            <ListItem.Title
              style={[
                styles.titleInfoStyle,
                { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" },
              ]}
            >
              {
                TRANSLITERATION_LANGUAGES.filter(
                  (item) => item.key === transliterationLanguage
                ).map((item) => item.title)[0]
              }
            </ListItem.Title>
          )}
        </ListItem>
      )}
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.language}
          </Text>
          {TRANSLITERATION_LANGUAGES.map((item) =>
            renderItem(item, dispatch, isNightMode, toggleVisible, transliterationLanguage)
          )}
        </BottomSheet>
      )}
    </>
  );
}

export default TransliterationComponent;
