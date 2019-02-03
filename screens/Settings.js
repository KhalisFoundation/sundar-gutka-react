import React from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  Linking,
  Platform,
  TouchableOpacity
} from "react-native";
import { Header } from "react-native-elements";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesomeIcons from "react-native-vector-icons/FontAwesome";
import FontAwesome5Icons from "react-native-vector-icons/FontAwesome5";
import Entypo from "react-native-vector-icons/Entypo";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import { baniLengthInfo } from "../utils/helpers";
import SettingsList from "react-native-settings-list";
import {
  ActionSheet,
  ActionSheetItem
} from "react-native-action-sheet-component";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import AnalyticsManager from "../utils/analytics";
import * as actions from "../actions/actions";
import Collapsible from "react-native-collapsible";

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTranslationOptions: true
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
              true: GLOBAL.COLOR.SETTING_SWITCH_COLOR
            }
          }
        : {};

    return (
      <View
        style={[
          styles.viewStyle,
          this.props.nightMode && { backgroundColor: "#000" }
        ]}
      >
        <Header
          barStyle={this.props.nightMode ? "light-content" : "dark-content"}
          backgroundColor={
            this.props.nightMode
              ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE
              : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
          }
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
            text: "Settings",
            style: {
              color: this.props.nightMode
                ? GLOBAL.COLOR.TOOLBAR_TINT
                : GLOBAL.COLOR.TOOLBAR_TINT_DARK,
              fontSize: 18
            }
          }}
        />
        <SettingsList borderColor="#c8c7cc" defaultItemSize={50}>
          <SettingsList.Header
            headerText="Display Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/fontsizeicon.png")}
              />
            }
            title="Font Size"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.fontSizeNames[
                actions.FONT_SIZES.indexOf(this.props.fontSize)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontSizeActionSheet.show()}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/fontfaceicon.png")}
              />
            }
            title="Font Face"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.fontFaceNames[
                actions.FONT_FACES.indexOf(this.props.fontFace)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontFaceActionSheet.show()}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/romanizeicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.romanized}
            switchOnValueChange={this.props.toggleRomanized}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Romanized"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/englishicon.png")}
              />
            }
            hasNavArrow={false}
            arrowIcon={
              <View style={{ justifyContent: "center", paddingRight: 10 }}>
                <Icon
                  name={
                    this.state.showTranslationOptions
                      ? "keyboard-arrow-down"
                      : "keyboard-arrow-up"
                  }
                  color={
                    this.props.nightMode
                      ? GLOBAL.COLOR.TOOLBAR_TINT
                      : GLOBAL.COLOR.TOOLBAR_TINT_DARK
                  }
                  size={30}
                />
              </View>
            }
            title="Translations"
            onPress={() =>
              this.setState({
                showTranslationOptions: !this.state.showTranslationOptions
              })
            }
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <Collapsible collapsed={this.state.showTranslationOptions}>
            <SettingsList borderColor="#c8c7cc" defaultItemSize={50}>
              <SettingsList.Item
                backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
                hasSwitch={true}
                switchState={this.props.englishTranslations}
                switchOnValueChange={this.props.toggleEnglishTranslations}
                switchProps={switchStyle}
                hasNavArrow={false}
                title="English Translations"
                titleStyle={[
                  styles.titleText,
                  { paddingLeft: 80 },
                  this.props.nightMode && { color: "#fff" }
                ]}
              />
              <SettingsList.Item
                backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
                hasSwitch={true}
                switchState={this.props.punjabiTranslations}
                switchOnValueChange={this.props.togglePunjabiTranslations}
                switchProps={switchStyle}
                hasNavArrow={false}
                title="Punjabi Translations"
                titleStyle={[
                  styles.titleText,
                  { paddingLeft: 80 },
                  this.props.nightMode && { color: "#fff" }
                ]}
              />
              <SettingsList.Item
                backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
                hasSwitch={true}
                switchState={this.props.spanishTranslations}
                switchOnValueChange={this.props.toggleSpanishTranslations}
                switchProps={switchStyle}
                hasNavArrow={false}
                title="Spanish Translations"
                titleStyle={[
                  styles.titleText,
                  { paddingLeft: 80 },
                  this.props.nightMode && { color: "#fff" }
                ]}
              />
            </SettingsList>
          </Collapsible>
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/bgcoloricon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.nightMode}
            switchOnValueChange={this.props.toggleNightMode}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Dark Mode"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            hasSwitch={true}
            switchState={this.props.statusBar}
            switchOnValueChange={this.props.toggleStatusBar}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Hide Status Bar"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            hasSwitch={true}
            switchState={this.props.autoScroll}
            switchOnValueChange={this.props.toggleAutoScroll}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Auto Scroll"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />

          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/screenonicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.screenAwake || this.props.autoScroll}
            switchOnValueChange={this.props.toggleScreenAwake}
            switchProps={
              Platform.OS === "ios"
                ? {
                    trackColor: {
                      false: null,
                      true: GLOBAL.COLOR.SETTING_SWITCH_COLOR
                    },
                    disabled: this.props.autoScroll
                  }
                : { disabled: this.props.autoScroll }
            }
            hasNavArrow={false}
            title="Keep Screen Awake"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />

          <SettingsList.Header
            headerText="Bani Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/rearrangeicon.png")}
              />
            }
            title="Edit Bani Order"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            onPress={() =>
              navigate({ key: "EditBaniOrder", routeName: "EditBaniOrder" })
            }
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/banilengthicon.png")}
              />
            }
            title="Bani Length"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.baniLengthNames[
                actions.BANI_LENGTHS.indexOf(this.props.baniLength)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.BaniLengthActionSheet.show()}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/larivaaricon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.larivaar}
            switchOnValueChange={this.props.toggleLarivaar}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Larivaar"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            hasSwitch={true}
            switchState={this.props.paragraphMode}
            switchOnValueChange={this.props.toggleParagraphMode}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Paragraph Mode"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/manglacharanicon.png")}
              />
            }
            title="Manglacharan Position"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.manglacharanPositionNames[
                actions.MANGLACHARAN_POSITIONS.indexOf(
                  this.props.manglacharanPosition
                )
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.ManglacharanPositionActionSheet.show()}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/larivaaricon.png")}
              />
            }
            title="Padchhed Settings"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.padchhedSettingNames[
                actions.PADCHHED_SETTINGS.indexOf(this.props.padchhedSetting)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.PadchhedSettingsActionSheet.show()}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            hasSwitch={true}
            switchState={this.props.visram}
            switchOnValueChange={this.props.toggleVisram}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Vishram"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />

          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            hasSwitch={true}
            switchState={this.props.reminders}
            switchOnValueChange={this.props.toggleReminders}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Reminders"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />

          {this.props.reminders && (
            <SettingsList.Item
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              icon={
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
              }
              title="Set Reminder Options"
              titleStyle={[
                styles.titleText,
                this.props.nightMode && { color: "#fff" }
              ]}
              onPress={() =>
                navigate({
                  key: "ReminderOptions",
                  routeName: "ReminderOptions"
                })
              }
            />
          )}
          {this.props.reminders && (
            <SettingsList.Item
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              icon={
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
              }
              title="Reminder Sound"
              titleStyle={[
                styles.titleText,
                this.props.nightMode && { color: "#fff" }
              ]}
              titleInfo={
                actions.reminderSoundNames[
                  actions.REMINDER_SOUNDS.indexOf(this.props.reminderSound)
                ]
              }
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => this.ReminderSoundsActionSheet.show()}
            />
          )}
          <SettingsList.Header
            headerText="Other Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/analyticsicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.statistics}
            switchOnValueChange={this.props.toggleStatistics}
            switchProps={switchStyle}
            hasNavArrow={false}
            title="Collect Statistics"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            title="Donate"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            onPress={() =>
              Linking.openURL("https://khalisfoundation.org/donate/")
            }
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
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
            }
            title="About"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            onPress={() => navigate({ key: "About", routeName: "About" })}
          />
        </SettingsList>

        <ActionSheet
          ref={actionSheet => {
            this.FontSizeActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.fontSize}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Font Size</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontSizeNames,
            actions.FONT_SIZES,
            checkedIcon,
            this.props.setFontSize
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.FontFaceActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.fontFace}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Font Face</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontFaceNames,
            actions.FONT_FACES,
            checkedIcon,
            this.props.setFontFace
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.BaniLengthActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.baniLength}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 15
            }}
            onPress={() => baniLengthInfo()}
          >
            <Text style={styles.actionSheetTitle}>Bani Length</Text>

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
          ref={actionSheet => {
            this.ManglacharanPositionActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.manglacharanPosition}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Manglacharan Position</Text>
          </View>
          {this.actionSheetOptions(
            actions.manglacharanPositionNames,
            actions.MANGLACHARAN_POSITIONS,
            checkedIcon,
            this.props.setManglacharanPosition
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.PadchhedSettingsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.padchhedSetting}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Padchhed Settings</Text>
          </View>
          {this.actionSheetOptions(
            actions.padchhedSettingNames,
            actions.PADCHHED_SETTINGS,
            checkedIcon,
            this.props.setPadchhedSetting
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.ReminderSoundsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.reminderSound}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Reminder Sounds</Text>
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
          onPress={value => {
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
    padding: 10
  },
  imageStyle: {
    marginLeft: 15,
    marginRight: 10,
    alignSelf: "center",
    width: 28,
    height: 28,
    justifyContent: "center"
  },
  titleInfoStyle: {
    marginLeft: 15
  },
  viewStyle: {
    backgroundColor: "#EFEFF4",
    flex: 1
  },
  headerStyle: {
    marginTop: 15
  },
  titleText: {
    fontSize: 16
  }
});

function mapStateToProps(state) {
  return {
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    romanized: state.romanized,
    englishTranslations: state.englishTranslations,
    punjabiTranslations: state.punjabiTranslations,
    spanishTranslations: state.spanishTranslations,
    nightMode: state.nightMode,
    screenAwake: state.screenAwake,
    baniLength: state.baniLength,
    larivaar: state.larivaar,
    manglacharanPosition: state.manglacharanPosition,
    padchhedSetting: state.padchhedSetting,
    statistics: state.statistics,
    statusBar: state.statusBar,
    paragraphMode: state.paragraphMode,
    autoScroll: state.autoScroll,
    visram: state.visram,
    reminders: state.reminders,
    reminderSound: state.reminderSound
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
