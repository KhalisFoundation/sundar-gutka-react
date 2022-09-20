import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Linking,
  Platform,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { ListItem, Avatar, Switch } from "react-native-elements";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesomeIcons from "react-native-vector-icons/FontAwesome";
import FontAwesome5Icons from "react-native-vector-icons/FontAwesome5";
import Entypo from "react-native-vector-icons/Entypo";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ActionSheet, ActionSheetItem } from "react-native-action-sheet-component";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import { SafeAreaView } from "react-native-safe-area-context";
import { baniLengthInfo } from "../utils/helpers";
import GLOBAL from "../utils/globals";
import AnalyticsManager from "../utils/analytics";
import * as actions from "../actions/actions";
import Strings from "../utils/localization";
import NotificationsManager from "../utils/notifications";
import CONSTANT from "../utils/constant";

class Settings extends React.Component {
  constructor(props) {
    super(props);
    const { englishTranslations, punjabiTranslations, spanishTranslations } = this.props;

    const isPortrait = () => {
      const dim = Dimensions.get("screen");
      return dim.height >= dim.width;
    };

    Dimensions.addEventListener("change", () => {
      this.setState({
        orientation: isPortrait() ? CONSTANT.PORTRAIT : CONSTANT.LANDSCAPE,
      });
    });
    this.state = {
      orientation: isPortrait() ? CONSTANT.PORTRAIT : CONSTANT.LANDSCAPE,
      showTranslationOptions: englishTranslations || punjabiTranslations || spanishTranslations,
    };
  }

  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView("In App Settings", this.constructor.name);
  }

  actionSheetOptions = (names, options, checkedIcon, dispatch) => {
    const items = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < names.length; i++) {
      items.push(
        <ActionSheetItem
          text={names[i]}
          value={options[i]}
          style={{ paddingTop: 15, paddingBottom: 15 }}
          selectedIcon={checkedIcon}
          onPress={(value) => {
            dispatch(value);
          }}
          key={i}
        />
      );
    }
    return items;
  };

  remindersToggle = (value) => {
    const { toggleReminders, reminders } = this.props;
    toggleReminders(value);
    if (reminders) {
      const notifications = new NotificationsManager();
      notifications.cancelAllReminders();
    }
  };

  render() {
    const styles = StyleSheet.create({
      actionSheetTitle: {
        fontSize: 18,
        alignSelf: "center",
        padding: 10,
      },
      imageStyle: {
        marginRight: 6,
        alignSelf: "center",
        width: 28,
        height: 28,
        justifyContent: "center",
      },
      titleInfoStyle: {
        fontSize: 12,
      },
      headerStyle: {
        padding: 5,
        paddingLeft: 10,
      },
      titleText: {},
    });

    const {
      navigation,
      nightMode,
      fontSize,
      fontFace,
      language,
      transliteration,
      transliterationLanguage,
      englishTranslations,
      toggleEnglishTranslations,
      punjabiTranslations,
      togglePunjabiTranslations,
      spanishTranslations,
      toggleSpanishTranslations,
      toggleNightMode,
      toggleTransliteration,
      statusBar,
      toggleStatusBar,
      autoScroll,
      toggleAutoScroll,
      screenAwake,
      toggleScreenAwake,
      baniLength,
      larivaar,
      toggleLarivaar,
      larivaarAssist,
      toggleLarivaarAssist,
      paragraphMode,
      toggleParagraphMode,
      padchhedSetting,
      visram,
      vishraamOption,
      toggleVisram,
      reminders,
      reminderSound,
      statistics,
      toggleStatistics,
      setFontSize,
      setFontFace,
      setLanguage,
      setTransliterationLanguage,
      setBaniLength,
      setPadchhedSetting,
      setVishraamOption,
      vishraamSource,
      setVishraamSource,
      setReminderSound,
    } = this.props;
    const { navigate, goBack } = navigation;
    const { showTranslationOptions, orientation } = this.state;

    const checkedIcon = <MaterialIcons name="check" size={30} />;

    const switchStyle =
      Platform.OS === "ios"
        ? {
            trackColor: {
              false: null,
              true: GLOBAL.COLOR.SETTING_SWITCH_COLOR,
            },
          }
        : {};
    const backColor =
      orientation === CONSTANT.PORTRAIT ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT : GLOBAL.COLOR.NIGHT_BLACK;
    const darModeBackColor =
      orientation === CONSTANT.PORTRAIT
        ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE
        : GLOBAL.COLOR.NIGHT_BLACK;

    return (
      <SafeAreaView
        style={[{ backgroundColor: backColor }, nightMode && { backgroundColor: darModeBackColor }]}
      >
        <StatusBar
          backgroundColor={
            nightMode ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
          }
          barStyle={nightMode ? "light-content" : "dark-content"}
        />
        <View
          style={[
            { backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR_ALT },
            nightMode && { backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE },
          ]}
        >
          <Icon
            style={{ position: "absolute", left: 10, bottom: 15, zIndex: 10 }}
            name="arrow-back"
            color={nightMode ? GLOBAL.COLOR.TOOLBAR_TINT : GLOBAL.COLOR.TOOLBAR_TINT_DARK}
            size={30}
            onPress={() => goBack()}
          />
          <Text
            style={[
              {
                color: nightMode ? GLOBAL.COLOR.TOOLBAR_TINT : GLOBAL.COLOR.TOOLBAR_TINT_DARK,
                fontSize: 18,
                textAlign: "center",
                padding: 15,
              },
            ]}
          >
            {Strings.settings}
          </Text>
        </View>
        {/* <Header
          containerStyle={{}}
          backgroundColor={
            nightMode ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
          }
          leftComponent={
            <Icon
              style={{}}
              name="arrow-back"
              color={nightMode ? GLOBAL.COLOR.TOOLBAR_TINT : GLOBAL.COLOR.TOOLBAR_TINT_DARK}
              size={30}
              onPress={() => goBack()}
            />
          }
          centerComponent={{
            text: Strings.settings,
            style: {
              color: nightMode ? GLOBAL.COLOR.TOOLBAR_TINT : GLOBAL.COLOR.TOOLBAR_TINT_DARK,
              fontSize: 18,
            },
          }}
        /> */}
        <ScrollView
          style={{
            backgroundColor: nightMode
              ? GLOBAL.COLOR.NIGHT_BLACK
              : GLOBAL.COLOR.SETTING_BACKGROUND_COLOR,
          }}
        >
          <Text style={[styles.headerStyle, nightMode && { color: GLOBAL.COLOR.WHITE_COLOR }]}>
            {Strings.display_options}
          </Text>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => this.FontSizeActionSheet.show()}
          >
            <Avatar source={require("../images/fontsizeicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.font_size}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title
              right
              style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
            >
              {actions.fontSizeNames[actions.FONT_SIZES.indexOf(fontSize)]}
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => this.FontFaceActionSheet.show()}
          >
            <Avatar source={require("../images/fontfaceicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.font_face}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title
              right
              style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
            >
              {actions.fontFaceNames[actions.FONT_FACES.indexOf(fontFace)]}
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => this.LanguageActionSheet.show()}
          >
            <Icon
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="language"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.language}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title
              right
              style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
            >
              {actions.languageNames[actions.LANGUAGES.indexOf(language)]}
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <Avatar source={require("../images/romanizeicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.transliteration}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={transliteration}
              onValueChange={toggleTransliteration}
            />
          </ListItem>

          {transliteration && (
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
              onPress={() => this.TransliterationActionSheet.show()}
            >
              <Avatar />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.language}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title
                right
                style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
              >
                {
                  actions.transliterationLanguageNames[
                    actions.TRANSLITERATION_LANGUAGES.indexOf(transliterationLanguage)
                  ]
                }
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}

          <ListItem.Accordion
            bottomDivider
            containerStyle={[nightMode && { backgroundColor: "#464646" }]}
            isExpanded={showTranslationOptions}
            onPress={() =>
              this.setState({
                showTranslationOptions: !showTranslationOptions,
              })
            }
            content={
              <>
                <Avatar source={require("../images/englishicon.png")} />
                <ListItem.Content>
                  <ListItem.Title style={[{ paddingLeft: 16 }, nightMode && { color: "#fff" }]}>
                    {Strings.translations}
                  </ListItem.Title>
                </ListItem.Content>
              </>
            }
          >
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            >
              <Avatar />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.en_translations}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={englishTranslations}
                onValueChange={toggleEnglishTranslations}
              />
            </ListItem>

            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            >
              <Avatar />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.pu_translations}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={punjabiTranslations}
                onValueChange={togglePunjabiTranslations}
              />
            </ListItem>

            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            >
              <Avatar />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.es_translations}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={spanishTranslations}
                onValueChange={toggleSpanishTranslations}
              />
            </ListItem>
          </ListItem.Accordion>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <Avatar source={require("../images/bgcoloricon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.dark_mode}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={nightMode} onValueChange={toggleNightMode} />
          </ListItem>
          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="eye-off"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.hide_status_bar}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={statusBar} onValueChange={toggleStatusBar} />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="auto-fix"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.auto_scroll}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={autoScroll} onValueChange={toggleAutoScroll} />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <Avatar source={require("../images/screenonicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.keep_awake}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={screenAwake || autoScroll}
              onValueChange={toggleScreenAwake}
              disabled={autoScroll}
            />
          </ListItem>
          <Text style={[styles.headerStyle, nightMode && { color: "#fff" }]}>
            {Strings.bani_options}
          </Text>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => navigate("EditBaniOrder")}
          >
            <Avatar source={require("../images/rearrangeicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.edit_bani_order}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => this.BaniLengthActionSheet.show()}
          >
            <Avatar source={require("../images/banilengthicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.bani_length}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title
              right
              style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
            >
              {actions.baniLengthNames[actions.BANI_LENGTHS.indexOf(baniLength)]}
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <Avatar source={require("../images/larivaaricon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.larivaar}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={larivaar} onValueChange={toggleLarivaar} />
          </ListItem>
          {larivaar && (
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            >
              <Icon
                style={styles.imageStyle}
                color={
                  nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="opacity"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.larivaar_assist}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={larivaarAssist}
                onValueChange={toggleLarivaarAssist}
              />
            </ListItem>
          )}
          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <FontAwesomeIcons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="paragraph"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.paragraph_mode}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={paragraphMode} onValueChange={toggleParagraphMode} />
          </ListItem>
          {/* <ListItem bottomDivider 
            containerStyle={[
              styles.titleText,
              nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.ManglacharanPositionActionSheet.show()}
          >
            <Avatar source={require("../images/manglacharanicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[nightMode && { color: "#fff" }]}>
                {Strings.manglacharan_position}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: nightMode ? "#fff" : "#a3a3a3" }
              ]}>
              {
                actions.manglacharanPositionNames[
                actions.MANGLACHARAN_POSITIONS.indexOf(
                  this.props.manglacharanPosition
                )
                ]
              }
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem> */}

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => this.PadchhedSettingsActionSheet.show()}
          >
            <Avatar source={require("../images/larivaaricon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.padchhed_settings}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title
              right
              style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
            >
              {actions.padchhedSettingNames[actions.PADCHHED_SETTINGS.indexOf(padchhedSetting)]}
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>
          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="pause"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.show_vishraams}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={visram} onValueChange={toggleVisram} />
          </ListItem>

          {visram && (
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
              onPress={() => this.VishraamOptionsActionSheet.show()}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="format-color-fill"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.vishraam_options}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title
                right
                style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
              >
                {actions.vishraamOptionNames[actions.VISHRAAM_OPTIONS.indexOf(vishraamOption)]}
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}

          {visram && (
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
              onPress={() => this.VishraamSourcesActionSheet.show()}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="book-open"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.vishraam_source}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title
                right
                style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
              >
                {actions.vishraamSourceNames[actions.VISHRAAM_SOURCES.indexOf(vishraamSource)]}
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="timer"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.reminders}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={reminders} onValueChange={this.remindersToggle} />
          </ListItem>

          {reminders && (
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
              onPress={() => navigate("ReminderOptions")}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="timetable"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.set_reminder_options}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          )}

          {reminders && (
            <ListItem
              bottomDivider
              containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
              onPress={() => this.ReminderSoundsActionSheet.show()}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="cellphone-sound"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                  {Strings.reminder_sound}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title
                right
                style={[styles.titleInfoStyle, { color: nightMode ? "#fff" : "#a3a3a3" }]}
              >
                {actions.reminderSoundNames[actions.REMINDER_SOUNDS.indexOf(reminderSound)]}
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}

          <Text style={[styles.headerStyle, nightMode && { color: "#fff" }]}>
            {Strings.other_options}
          </Text>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
          >
            <Avatar source={require("../images/analyticsicon.png")} />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.collect_statistics}
              </ListItem.Title>
            </ListItem.Content>
            <Switch style={switchStyle} value={statistics} onValueChange={toggleStatistics} />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => Linking.openURL("https://khalisfoundation.org/donate/")}
          >
            <FontAwesome5Icons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="donate"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.donate}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>

          <ListItem
            bottomDivider
            containerStyle={[styles.titleText, nightMode && { backgroundColor: "#464646" }]}
            onPress={() => navigate("About")}
          >
            <FontAwesomeIcons
              style={styles.imageStyle}
              color={
                nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="question-circle"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title style={[nightMode && { color: "#fff" }]}>
                {Strings.about}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        </ScrollView>

        <ActionSheet
          ref={(actionSheet) => {
            this.FontSizeActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={fontSize}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.font_size}</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontSizeNames,
            actions.FONT_SIZES,
            checkedIcon,
            setFontSize
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.FontFaceActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={fontFace}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.font_face}</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontFaceNames,
            actions.FONT_FACES,
            checkedIcon,
            setFontFace
          )}
        </ActionSheet>
        <ActionSheet
          ref={(actionSheet) => {
            this.LanguageActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={language}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.language}</Text>
          </View>
          {this.actionSheetOptions(
            actions.languageNames,
            actions.LANGUAGES,
            checkedIcon,
            setLanguage
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.TransliterationActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={transliterationLanguage}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.language}</Text>
          </View>
          {this.actionSheetOptions(
            actions.transliterationLanguageNames,
            actions.TRANSLITERATION_LANGUAGES,
            checkedIcon,
            setTransliterationLanguage
          )}
        </ActionSheet>
        <ActionSheet
          ref={(actionSheet) => {
            this.BaniLengthActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={baniLength}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 15,
            }}
            onPress={() => baniLengthInfo()}
          >
            <Text style={styles.actionSheetTitle}>{Strings.bani_length}</Text>

            <Entypo color={GLOBAL.COLOR.TOOLBAR_COLOR_ALT} name="info-with-circle" size={30} />
          </TouchableOpacity>
          {this.actionSheetOptions(
            actions.baniLengthNames,
            actions.BANI_LENGTHS,
            checkedIcon,
            setBaniLength
          )}
        </ActionSheet>

        {/* <ActionSheet
          ref={(actionSheet) => {
            this.ManglacharanPositionActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.manglacharanPosition}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.manglacharan_position}</Text>
          </View>
          {this.actionSheetOptions(
            actions.manglacharanPositionNames,
            actions.MANGLACHARAN_POSITIONS,
            checkedIcon,
            this.props.setManglacharanPosition
          )}
        </ActionSheet> */}

        <ActionSheet
          ref={(actionSheet) => {
            this.PadchhedSettingsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={padchhedSetting}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.padchhed_settings}</Text>
          </View>
          {this.actionSheetOptions(
            actions.padchhedSettingNames,
            actions.PADCHHED_SETTINGS,
            checkedIcon,
            setPadchhedSetting
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.VishraamOptionsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={vishraamOption}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.vishraam_options}</Text>
          </View>
          {this.actionSheetOptions(
            actions.vishraamOptionNames,
            actions.VISHRAAM_OPTIONS,
            checkedIcon,
            setVishraamOption
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.VishraamSourcesActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={vishraamSource}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.vishraam_source}</Text>
          </View>
          {this.actionSheetOptions(
            actions.vishraamSourceNames,
            actions.VISHRAAM_SOURCES,
            checkedIcon,
            setVishraamSource
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.ReminderSoundsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={reminderSound}
        >
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.reminder_sound}</Text>
          </View>
          {this.actionSheetOptions(
            actions.reminderSoundNames,
            actions.REMINDER_SOUNDS,
            checkedIcon,
            setReminderSound
          )}
        </ActionSheet>
      </SafeAreaView>
    );
  }
}
Settings.propTypes = {
  englishTranslations: PropTypes.bool.isRequired,
  punjabiTranslations: PropTypes.bool.isRequired,
  spanishTranslations: PropTypes.bool.isRequired,
  navigation: PropTypes.shape().isRequired,
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  transliteration: PropTypes.bool.isRequired,
  transliterationLanguage: PropTypes.string.isRequired,
  toggleEnglishTranslations: PropTypes.func.isRequired,
  togglePunjabiTranslations: PropTypes.func.isRequired,
  toggleSpanishTranslations: PropTypes.func.isRequired,
  toggleNightMode: PropTypes.func.isRequired,
  toggleTransliteration: PropTypes.func.isRequired,
  statusBar: PropTypes.bool.isRequired,
  toggleStatusBar: PropTypes.func.isRequired,
  autoScroll: PropTypes.bool.isRequired,
  toggleAutoScroll: PropTypes.func.isRequired,
  screenAwake: PropTypes.bool.isRequired,
  toggleScreenAwake: PropTypes.func.isRequired,
  baniLength: PropTypes.string.isRequired,
  larivaar: PropTypes.bool.isRequired,
  toggleLarivaar: PropTypes.func.isRequired,
  larivaarAssist: PropTypes.bool.isRequired,
  toggleLarivaarAssist: PropTypes.func.isRequired,
  paragraphMode: PropTypes.bool.isRequired,
  toggleParagraphMode: PropTypes.func.isRequired,
  padchhedSetting: PropTypes.string.isRequired,
  visram: PropTypes.bool.isRequired,
  vishraamOption: PropTypes.string.isRequired,
  toggleVisram: PropTypes.func.isRequired,
  reminders: PropTypes.bool.isRequired,
  toggleReminders: PropTypes.func.isRequired,
  reminderSound: PropTypes.string.isRequired,
  statistics: PropTypes.bool.isRequired,
  toggleStatistics: PropTypes.func.isRequired,
  setFontFace: PropTypes.func.isRequired,
  setFontSize: PropTypes.func.isRequired,
  setLanguage: PropTypes.func.isRequired,
  setTransliterationLanguage: PropTypes.func.isRequired,
  setBaniLength: PropTypes.func.isRequired,
  setPadchhedSetting: PropTypes.func.isRequired,
  setVishraamOption: PropTypes.func.isRequired,
  setVishraamSource: PropTypes.func.isRequired,
  setReminderSound: PropTypes.func.isRequired,
  vishraamSource: PropTypes.string.isRequired,
};
function mapStateToProps(state) {
  return {
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    language: state.language,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    englishTranslations: state.englishTranslations,
    punjabiTranslations: state.punjabiTranslations,
    spanishTranslations: state.spanishTranslations,
    nightMode: state.nightMode,
    screenAwake: state.screenAwake,
    baniLength: state.baniLength,
    larivaar: state.larivaar,
    larivaarAssist: state.larivaarAssist,
    manglacharanPosition: state.manglacharanPosition,
    padchhedSetting: state.padchhedSetting,
    statistics: state.statistics,
    statusBar: state.statusBar,
    paragraphMode: state.paragraphMode,
    autoScroll: state.autoScroll,
    visram: state.visram,
    vishraamOption: state.vishraamOption,
    vishraamSource: state.vishraamSource,
    reminders: state.reminders,
    reminderSound: state.reminderSound,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
