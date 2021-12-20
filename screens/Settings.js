import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Linking,
  Platform,
  TouchableOpacity,
  StatusBar,
  ScrollView
} from "react-native";
import { Header, ListItem, Avatar, Switch } from "react-native-elements";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesomeIcons from "react-native-vector-icons/FontAwesome";
import FontAwesome5Icons from "react-native-vector-icons/FontAwesome5";
import Entypo from "react-native-vector-icons/Entypo";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import { baniLengthInfo } from "../utils/helpers";
import {
  ActionSheet,
  ActionSheetItem
} from "react-native-action-sheet-component";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import AnalyticsManager from "../utils/analytics";
import * as actions from "../actions/actions";
import Strings from "../utils/localization";

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTranslationOptions: this.props.englishTranslations || this.props.punjabiTranslations || this.props.spanishTranslations,
    };
  }

  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView(
      "In App Settings",
      this.constructor.name
    );
  }

  render() {
    const { navigate } = this.props.navigation;

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

    return (
      <View
        style={[
          styles.viewStyle,
          this.props.nightMode && { backgroundColor: "#000" },
        ]}>
        <StatusBar
          backgroundColor={
            this.props.nightMode
              ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE
              : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
          }
          barStyle={this.props.nightMode ? "light-content" : "dark-content"}
        />
        <Header
          backgroundColor={
            this.props.nightMode
              ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE
              : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
          }
          containerStyle={[
            Platform.OS === "android" && { height: 56, paddingTop: 0 },
          ]}
          leftComponent={
            <Icon
              name="arrow-back"
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.TOOLBAR_TINT
                  : GLOBAL.COLOR.TOOLBAR_TINT_DARK
              }
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: Strings.settings,
            style: {
              color: this.props.nightMode
                ? GLOBAL.COLOR.TOOLBAR_TINT
                : GLOBAL.COLOR.TOOLBAR_TINT_DARK,
              fontSize: 18,
            },
          }}
        />
        <ScrollView
          style={{
            backgroundColor: this.props.nightMode
              ? "#000"
              : GLOBAL.COLOR.SETTING_BACKGROUND_COLOR,
          }}>
          <Text
            style={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" },
            ]}>
            {Strings.display_options}
          </Text>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.FontSizeActionSheet.show()}
          >
            <Avatar source={require("../images/fontsizeicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.font_size}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
              ]}>
              {
                actions.fontSizeNames[
                actions.FONT_SIZES.indexOf(this.props.fontSize)
                ]
              }
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.FontFaceActionSheet.show()}
          >
            <Avatar source={require("../images/fontfaceicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.font_face}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
              ]}>
              {
                actions.fontFaceNames[
                actions.FONT_FACES.indexOf(this.props.fontFace)
                ]
              }
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.LanguageActionSheet.show()}
          >
            <Icon
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="language"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.language}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
              ]}>
              {
                actions.languageNames[
                actions.LANGUAGES.indexOf(this.props.language)
                ]
              }
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <Avatar source={require("../images/romanizeicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.transliteration}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.transliteration}
              onValueChange={this.props.toggleTransliteration}
            />
          </ListItem>
          {this.props.transliteration && (
            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]} onPress={() => this.TransliterationActionSheet.show()}
            >
              <Avatar />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.language}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title right
                style={[
                  styles.titleInfoStyle,
                  { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
                ]}>
                {
                  actions.transliterationLanguageNames[
                  actions.TRANSLITERATION_LANGUAGES.indexOf(
                    this.props.transliterationLanguage
                  )
                  ]
                }
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}

          <ListItem.Accordion bottomDivider
            containerStyle={[
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
            isExpanded={this.state.showTranslationOptions}
            onPress={() =>
              this.setState({
                showTranslationOptions: !this.state.showTranslationOptions,
              })}
            content={
              <>
                <Avatar source={require("../images/englishicon.png")} />
                <ListItem.Content>
                  <ListItem.Title
                    style={[{ paddingLeft: 16 },
                    this.props.nightMode && { color: "#fff" }]}>
                    {Strings.translations}
                  </ListItem.Title>
                </ListItem.Content>
              </>
            }
          >

            <ListItem
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]}>
              <Avatar />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.en_translations}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={this.props.englishTranslations}
                onValueChange={this.props.toggleEnglishTranslations}
              />
            </ListItem>

            <ListItem
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]}>
              <Avatar />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.pu_translations}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={this.props.punjabiTranslations}
                onValueChange={this.props.togglePunjabiTranslations}
              />
            </ListItem>

            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]}>
              <Avatar />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.es_translations}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={this.props.spanishTranslations}
                onValueChange={this.props.toggleSpanishTranslations}
              />
            </ListItem>
          </ListItem.Accordion>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <Avatar source={require("../images/bgcoloricon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.dark_mode}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.nightMode}
              onValueChange={this.props.toggleNightMode}
            />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="eye-off"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.hide_status_bar}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.statusBar}
              onValueChange={this.props.toggleStatusBar}
            />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="auto-fix"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.auto_scroll}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.autoScroll}
              onValueChange={this.props.toggleAutoScroll}
            />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <Avatar source={require("../images/screenonicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.keep_awake}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.screenAwake || this.props.autoScroll}
              onValueChange={this.props.toggleScreenAwake}
              disabled={this.props.autoScroll}
            />
          </ListItem>

          <Text
            style={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" },
            ]}>
            {Strings.bani_options}
          </Text>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => navigate('EditBaniOrder')}
          >
            <Avatar source={require("../images/rearrangeicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.edit_bani_order}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.BaniLengthActionSheet.show()}
          >
            <Avatar source={require("../images/banilengthicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.bani_length}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
              ]}>
              {
                actions.baniLengthNames[
                actions.BANI_LENGTHS.indexOf(this.props.baniLength)
                ]
              }
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <Avatar source={require("../images/larivaaricon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.larivaar}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.larivaar}
              onValueChange={this.props.toggleLarivaar}
            />
          </ListItem>
          {this.props.larivaar && (
            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]}
            >
              <Icon
                style={styles.imageStyle}
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="opacity"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.larivaar_assist}
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                style={switchStyle}
                value={this.props.larivaarAssist}
                onValueChange={this.props.toggleLarivaarAssist}
              />
            </ListItem>
          )}

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <FontAwesomeIcons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="paragraph"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.paragraph_mode}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.paragraphMode}
              onValueChange={this.props.toggleParagraphMode}
            />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.ManglacharanPositionActionSheet.show()}
          >
            <Avatar source={require("../images/manglacharanicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.manglacharan_position}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
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
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => this.PadchhedSettingsActionSheet.show()}
          >
            <Avatar source={require("../images/larivaaricon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.padchhed_settings}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Title right
              style={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
              ]}>
              {
                actions.padchhedSettingNames[
                actions.PADCHHED_SETTINGS.indexOf(this.props.padchhedSetting)
                ]
              }
            </ListItem.Title>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="pause"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.show_vishraams}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.visram}
              onValueChange={this.props.toggleVisram}
            />
          </ListItem>
          {this.props.visram && (
            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]} onPress={() => this.VishraamOptionsActionSheet.show()}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="format-color-fill"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.vishraam_options}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title right
                style={[
                  styles.titleInfoStyle,
                  { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
                ]}>
                {
                  actions.vishraamOptionNames[
                  actions.VISHRAAM_OPTIONS.indexOf(this.props.vishraamOption)
                  ]
                }
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}
          {this.props.visram && (
            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]} onPress={() => this.VishraamSourcesActionSheet.show()}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="book-open"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.vishraam_source}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title right
                style={[
                  styles.titleInfoStyle,
                  { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
                ]}>
                {
                  actions.vishraamSourceNames[
                  actions.VISHRAAM_SOURCES.indexOf(this.props.vishraamSource)
                  ]
                }
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <MaterialIcons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="timer"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.reminders}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.reminders}
              onValueChange={this.props.toggleReminders}
            />
          </ListItem>
          {this.props.reminders && (
            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]} onPress={() => navigate('ReminderOptions')}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="timetable"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.set_reminder_options}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          )}
          {this.props.reminders && (
            <ListItem bottomDivider
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" }
              ]} onPress={() => this.ReminderSoundsActionSheet.show()}
            >
              <MaterialIcons
                style={styles.imageStyle}
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                name="cellphone-sound"
                size={30}
              />
              <ListItem.Content>
                <ListItem.Title
                  style={[this.props.nightMode && { color: "#fff" }]}>
                  {Strings.reminder_sound}
                </ListItem.Title>
              </ListItem.Content>
              <ListItem.Title right
                style={[
                  styles.titleInfoStyle,
                  { color: this.props.nightMode ? "#fff" : "#a3a3a3" }
                ]}>
                {
                  actions.reminderSoundNames[
                  actions.REMINDER_SOUNDS.indexOf(this.props.reminderSound)
                  ]
                }
              </ListItem.Title>
              <ListItem.Chevron />
            </ListItem>
          )}
          <Text
            style={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" },
            ]}>
            {Strings.other_options}
          </Text>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]}
          >
            <Avatar source={require("../images/analyticsicon.png")} />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.collect_statistics}
              </ListItem.Title>
            </ListItem.Content>
            <Switch
              style={switchStyle}
              value={this.props.statistics}
              onValueChange={this.props.toggleStatistics}
            />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => Linking.openURL("https://khalisfoundation.org/donate/")}
          >
            <FontAwesome5Icons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="donate"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
                {Strings.donate}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>

          <ListItem bottomDivider
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" }
            ]} onPress={() => navigate('About')}
          >
            <FontAwesomeIcons
              style={styles.imageStyle}
              color={
                this.props.nightMode
                  ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                  : GLOBAL.COLOR.COMPONENT_COLOR
              }
              name="question-circle"
              size={30}
            />
            <ListItem.Content>
              <ListItem.Title
                style={[this.props.nightMode && { color: "#fff" }]}>
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
          defaultValue={this.props.fontSize}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.font_size}</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontSizeNames,
            actions.FONT_SIZES,
            checkedIcon,
            this.props.setFontSize
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.FontFaceActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.fontFace}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.font_face}</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontFaceNames,
            actions.FONT_FACES,
            checkedIcon,
            this.props.setFontFace
          )}
        </ActionSheet>
        <ActionSheet
          ref={(actionSheet) => {
            this.LanguageActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.language}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.language}</Text>
          </View>
          {this.actionSheetOptions(
            actions.languageNames,
            actions.LANGUAGES,
            checkedIcon,
            this.props.setLanguage
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.TransliterationActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.transliterationLanguage}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.language}</Text>
          </View>
          {this.actionSheetOptions(
            actions.transliterationLanguageNames,
            actions.TRANSLITERATION_LANGUAGES,
            checkedIcon,
            this.props.setTransliterationLanguage
          )}
        </ActionSheet>
        <ActionSheet
          ref={(actionSheet) => {
            this.BaniLengthActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.baniLength}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 15,
            }}
            onPress={() => baniLengthInfo()}>
            <Text style={styles.actionSheetTitle}>{Strings.bani_length}</Text>

            <Entypo
              color={GLOBAL.COLOR.TOOLBAR_COLOR_ALT}
              name="info-with-circle"
              size={30}
            />
          </TouchableOpacity>
          {this.actionSheetOptions(
            actions.baniLengthNames,
            actions.BANI_LENGTHS,
            checkedIcon,
            this.props.setBaniLength
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.ManglacharanPositionActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.manglacharanPosition}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.manglacharan_position}</Text>
          </View>
          {this.actionSheetOptions(
            actions.manglacharanPositionNames,
            actions.MANGLACHARAN_POSITIONS,
            checkedIcon,
            this.props.setManglacharanPosition
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.PadchhedSettingsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.padchhedSetting}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.padchhed_settings}</Text>
          </View>
          {this.actionSheetOptions(
            actions.padchhedSettingNames,
            actions.PADCHHED_SETTINGS,
            checkedIcon,
            this.props.setPadchhedSetting
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.VishraamOptionsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.vishraamOption}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.vishraam_options}</Text>
          </View>
          {this.actionSheetOptions(
            actions.vishraamOptionNames,
            actions.VISHRAAM_OPTIONS,
            checkedIcon,
            this.props.setVishraamOption
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.VishraamSourcesActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.vishraamSource}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.vishraam_source}</Text>
          </View>
          {this.actionSheetOptions(
            actions.vishraamSourceNames,
            actions.VISHRAAM_SOURCES,
            checkedIcon,
            this.props.setVishraamSource
          )}
        </ActionSheet>

        <ActionSheet
          ref={(actionSheet) => {
            this.ReminderSoundsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.reminderSound}>
          <View>
            <Text style={styles.actionSheetTitle}>{Strings.reminder_sound}</Text>
          </View>
          {this.actionSheetOptions(
            actions.reminderSoundNames,
            actions.REMINDER_SOUNDS,
            checkedIcon,
            this.props.setReminderSound
          )}
        </ActionSheet>
      </View>
    );
  }

  actionSheetOptions = (names, options, checkedIcon, dispatch) => {
    var items = [];
    for (var i = 0; i < names.length; i++) {
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
}

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
  viewStyle: {
    backgroundColor: "#EFEFF4",
    flex: 1,
  },
  headerStyle: {
    marginTop: 10,
    padding: 5,
    paddingLeft: 10,
  },
  titleText: {},
});

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
    visram: state.visram,
    reminders: state.reminders,
    reminderSound: state.reminderSound,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
