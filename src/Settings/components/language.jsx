import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import styles from "../styles/styles";
import { setLanguage } from "../../common/actions";
import { LANGUAGES } from "../../common/actions/constant";
import colors from "../../common/colors";
import RenderBottomSheetItem from "./comon/render";

function LanguageComponent() {
  const [isVisible, toggleVisible] = useState(false);
  const { language, isNightMode } = useSelector((state) => state);

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
          {LANGUAGES.map((item) => (
            <RenderBottomSheetItem
              key={item.key}
              item={item}
              toggleVisible={toggleVisible}
              value={language}
              action={setLanguage}
            />
          ))}
        </BottomSheet>
      )}
    </>
  );
}

export default LanguageComponent;
