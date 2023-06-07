import React from "react";
import { View, Text } from "react-native";
import { ListItem, Avatar, Switch, Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { toggleNightMode } from "../common/actions";
import STRINGS from "../common/localization";
import styles from "./styles";
import colors from "../common/colors";
import { FontSizeBottomSheet } from "./utils/actions";

function ListComponent() {
  const isNightMode = useSelector((state) => state.isNightMode);
  const dispatch = useDispatch();
  return (
    <View>
      <Text style={styles.displayOptionsText}>{STRINGS.display_options}</Text>
      {/* * Font Size */}
      <ListItem bottomDivider onPress={() => FontSizeBottomSheet()}>
        <Avatar source={require("../../images/fontsizeicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_size}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Title />
        <ListItem.Chevron />
      </ListItem>

      {/* Font face */}
      <ListItem bottomDivider>
        <Avatar source={require("../../images/fontfaceicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.font_face}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Title />
        <ListItem.Chevron />
      </ListItem>

      {/* Language */}

      <ListItem bottomDivider>
        <Icon
          style={styles.imageStyle}
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="language"
          size={30}
          type="material"
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.language}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Title />
        <ListItem.Chevron />
      </ListItem>

      {/** Transliteration */}
      <ListItem bottomDivider>
        <Avatar source={require("../../images/romanizeicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.transliteration}
          </ListItem.Title>
        </ListItem.Content>
        <Switch />
        <ListItem.Chevron />
      </ListItem>

      {/** Theme */}
      <ListItem bottomDivider>
        <Avatar source={require("../../images/bgcoloricon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.theme}
          </ListItem.Title>
        </ListItem.Content>
        <Switch />
        <ListItem.Chevron />
      </ListItem>
      {/** Hide Status Bar */}
      <ListItem bottomDivider>
        <Icon name="visibility-off" type="material" />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.hide_status_bar}
          </ListItem.Title>
        </ListItem.Content>
        <Switch />
        <ListItem.Chevron />
      </ListItem>
      {/** Auto Scroll */}
      <ListItem bottomDivider>
        <Icon name="auto-fix-high" type="material" />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.auto_scroll}
          </ListItem.Title>
        </ListItem.Content>
        <Switch />
        <ListItem.Chevron />
      </ListItem>

      {/** Keep awake */}
      <ListItem bottomDivider>
        <Avatar source={require("../../images/screenonicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.keep_awake}
          </ListItem.Title>
        </ListItem.Content>
        <Switch />
        <ListItem.Chevron />
      </ListItem>
    </View>
  );
}
export default ListComponent;
