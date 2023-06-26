import React from "react";
import { Text, Linking, ScrollView } from "react-native";
import { ListItem, Avatar, Switch, Icon } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import STRINGS from "../common/localization";
import styles from "./styles";
import colors from "../common/colors";
import FontSizeComponent from "./components/fontSize";
import FontFaceComponent from "./components/fontFace";
import LanguageComponent from "./components/language";
import TransliterationComponent from "./components/transliteration";
import ThemeComponent from "./components/theme";
import {
  toggleAutoScroll,
  toggleScreenAwake,
  toggleStatusBar,
  toggleParagraphMode,
  toggleStatistics,
} from "../common/actions";
import BaniLengthComponent from "./components/baniLength";
import LarivaarComponent from "./components/larivaar";
import PadchedSettingsComponent from "./components/padched";
import VishraamComponent from "./components/vishraam";
import TranslationComponent from "./components/translation";

function ListComponent({ navigation }) {
  const { navigate } = navigation;
  const { isAutoScroll, isScreenAwake, isStatusBar, isParagraphMode, isStatistics, isNightMode } =
    useSelector((state) => state);
  const dispatch = useDispatch();
  return (
    <ScrollView>
      <Text
        style={[
          styles.displayOptionsText,
          {
            backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.LABEL_COLORS,
          },
          { color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK },
        ]}
      >
        {STRINGS.display_options}
      </Text>
      <FontSizeComponent isNightMode={isNightMode} dispatch={dispatch} />
      <FontFaceComponent isNightMode={isNightMode} dispatch={dispatch} />
      <LanguageComponent isNightMode={isNightMode} dispatch={dispatch} />
      <TransliterationComponent isNightMode={isNightMode} dispatch={dispatch} />
      <TranslationComponent isNightMode={isNightMode} dispatch={dispatch} />
      <ThemeComponent isNightMode={isNightMode} dispatch={dispatch} />
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        {!isStatusBar && (
          <Icon
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
            name="visibility-off"
            type="material"
          />
        )}
        {isStatusBar && (
          <Icon
            color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
            name="visibility"
            type="material"
          />
        )}
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.hide_status_bar}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isStatusBar} onValueChange={(value) => dispatch(toggleStatusBar(value))} />
      </ListItem>
      {/** Auto Scroll */}
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="auto-fix-high"
          type="material"
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.auto_scroll}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isAutoScroll} onValueChange={(value) => dispatch(toggleAutoScroll(value))} />
      </ListItem>
      {/** Keep awake */}
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={require("../../images/screenonicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.keep_awake}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isScreenAwake}
          disabled={isAutoScroll}
          onValueChange={(value) => dispatch(toggleScreenAwake(value))}
        />
      </ListItem>
      {/* Bani Options */}
      <Text
        style={[
          styles.displayOptionsText,
          {
            backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.LABEL_COLORS,
          },
          { color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK },
        ]}
      >
        {STRINGS.bani_options}
      </Text>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => navigate("EditBaniOrder")}
      >
        <Avatar source={require("../../images/rearrangeicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.edit_bani_order}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      <BaniLengthComponent isNightMode={isNightMode} dispatch={dispatch} />
      <LarivaarComponent isNightMode={isNightMode} dispatch={dispatch} />
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="view-headline"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.paragraph_mode}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isParagraphMode}
          onValueChange={(value) => dispatch(toggleParagraphMode(value))}
        />
      </ListItem>
      <PadchedSettingsComponent isNightMode={isNightMode} dispatch={dispatch} />
      <VishraamComponent isNightMode={isNightMode} dispatch={dispatch} />
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="timer"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.reminders}
          </ListItem.Title>
        </ListItem.Content>
        <Switch />
      </ListItem>
      <Text
        style={[
          styles.displayOptionsText,
          {
            backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.LABEL_COLORS,
          },
          { color: isNightMode ? colors.WHITE_COLOR : colors.NIGHT_BLACK },
        ]}
      >
        {STRINGS.other_options}
      </Text>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={require("../../images/analyticsicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.collect_statistics}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isStatistics} onValueChange={(value) => dispatch(toggleStatistics(value))} />
      </ListItem>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => Linking.openURL("https://khalisfoundation.org/donate/")}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="volunteer-activism"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.donate}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      <ListItem
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        bottomDivider
        onPress={() => navigate("About")}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="info"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.about}
          </ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      <Text
        style={[
          styles.end,
          { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR },
        ]}
      ></Text>
    </ScrollView>
  );
}
export default ListComponent;
