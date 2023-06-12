import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon, Switch } from "@rneui/themed";
import STRINGS from "../../common/localization";
import {
  setTransliteration,
  toggleTransliteration,
  TRANSLITERATION_LANGUAGES,
} from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import styles from "../styles";

function TransliterationComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { transliterationLanguage, isTransliteration } = useSelector((state) => state);

  const renderItem = (item, dispatch) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        onPress={() => {
          toggleVisible(false);
          dispatch(setTransliteration(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title>{item.title}</ListItem.Title>
        </ListItem.Content>
        {transliterationLanguage === item.key && <Icon name="check" />}
      </ListItem>
    );
  };
  const BottomSheetComponent = () => (
    <BottomSheet modalProps={{}} isVisible>
      <Text style={styles.bottomSheetTitle}>{STRINGS.language}</Text>
      {TRANSLITERATION_LANGUAGES.map((item) => renderItem(item, dispatch))}
    </BottomSheet>
  );

  const TransliterationExpand = () => (
    <ListItem bottomDivider onPress={() => toggleVisible(true)}>
      <Avatar />
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {STRINGS.language}
        </ListItem.Title>
      </ListItem.Content>
      {transliterationLanguage && (
        <ListItem.Title
          style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
        >
          {
            TRANSLITERATION_LANGUAGES.filter((item) => item.key === transliterationLanguage).map(
              (item) => item.title
            )[0]
          }
        </ListItem.Title>
      )}
    </ListItem>
  );

  const TriggerComponent = () => {
    return (
      <ListItem
        bottomDivider
        containerStyle={[{ backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : null }]}
      >
        <Avatar source={require("../../../images/romanizeicon.png")} />
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
    );
  };
  return (
    <>
      <TriggerComponent />
      {isTransliteration && <TransliterationExpand />}
      {isVisible && <BottomSheetComponent />}
    </>
  );
}
export default TransliterationComponent;
