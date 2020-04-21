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
} from "react-native";
import { Header } from "react-native-elements";
import { ListItem, Avatar } from "react-native-elements";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesomeIcons from "react-native-vector-icons/FontAwesome";
import FontAwesome5Icons from "react-native-vector-icons/FontAwesome5";
import Entypo from "react-native-vector-icons/Entypo";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import { baniLengthInfo } from "../utils/helpers";
import {
  ActionSheet,
  ActionSheetItem,
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
      showTranslationOptions: true,
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
            text: "Settings",
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
            Display Options
          </Text>
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/fontsizeicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Font Size"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            rightTitle={
              actions.fontSizeNames[
                actions.FONT_SIZES.indexOf(this.props.fontSize)
              ]
            }
            rightTitleStyle={[
              styles.titleInfoStyle,
              { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
            ]}
            chevron={true}
            bottomDivider={true}
            onPress={() => this.FontSizeActionSheet.show()}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/fontfaceicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Font Face"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            rightTitle={
              actions.fontFaceNames[
                actions.FONT_FACES.indexOf(this.props.fontFace)
              ]
            }
            rightTitleStyle={[
              styles.titleInfoStyle,
              { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
            ]}
            chevron={true}
            bottomDivider={true}
            onPress={() => this.FontFaceActionSheet.show()}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/romanizeicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            switch={{
              switchStyle,
              value: this.props.transliteration,
              onValueChange: this.props.toggleTransliteration,
            }}
            title="Transliteration"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          {this.props.transliteration && (
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              leftAvatar={
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
              }
              title="Language"
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
              rightTitle={
                actions.transliterationLanguageNames[
                  actions.TRANSLITERATION_LANGUAGES.indexOf(
                    this.props.transliterationLanguage
                  )
                ]
              }
              rightTitleStyle={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
              ]}
              chevron={true}
              bottomDivider={true}
              onPress={() => this.TransliterationActionSheet.show()}
            />
          )}
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/englishicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Translations"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            rightAvatar={
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
            bottomDivider={true}
            onPress={() =>
              this.setState({
                showTranslationOptions: !this.state.showTranslationOptions,
              })
            }
          />
          <Collapsible collapsed={this.state.showTranslationOptions}>
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              switch={{
                switchStyle,
                value: this.props.englishTranslations,
                onValueChange: this.props.toggleEnglishTranslations,
              }}
              title="English Translations"
              containerStyle={[
                { paddingLeft: 80 },
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
            />
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              switch={{
                switchStyle,
                value: this.props.punjabiTranslations,
                onValueChange: this.props.togglePunjabiTranslations,
              }}
              title="Punjabi Translations"
              containerStyle={[
                { paddingLeft: 80 },
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
            />
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              switch={{
                switchStyle,
                value: this.props.spanishTranslations,
                onValueChange: this.props.toggleSpanishTranslations,
              }}
              title="Spanish Translations"
              containerStyle={[
                { paddingLeft: 80 },
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
              bottomDivider={true}
            />
          </Collapsible>
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/bgcoloricon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            switch={{
              switchStyle,
              value: this.props.nightMode,
              onValueChange: this.props.toggleNightMode,
            }}
            title="Dark Mode"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            switch={{
              switchStyle,
              value: this.props.statusBar,
              onValueChange: this.props.toggleStatusBar,
            }}
            title="Hide Status Bar"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            switch={{
              switchStyle,
              value: this.props.autoScroll,
              onValueChange: this.props.toggleAutoScroll,
            }}
            title="Auto Scroll"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/screenonicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            switch={{
              switchStyle,
              value: this.props.screenAwake || this.props.autoScroll,
              onValueChange: this.props.toggleScreenAwake,
            }}
            title="Keep Screen Awake"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <Text
            style={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" },
            ]}>
            Bani Options
          </Text>
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/rearrangeicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Edit Bani Order"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            chevron={true}
            bottomDivider={true}
            onPress={() =>
              navigate({ key: "EditBaniOrder", routeName: "EditBaniOrder" })
            }
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/banilengthicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Bani Length"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            rightTitle={
              actions.baniLengthNames[
                actions.BANI_LENGTHS.indexOf(this.props.baniLength)
              ]
            }
            rightTitleStyle={[
              styles.titleInfoStyle,
              { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
            ]}
            chevron={true}
            bottomDivider={true}
            onPress={() => this.BaniLengthActionSheet.show()}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/larivaaricon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            switch={{
              switchStyle,
              value: this.props.larivaar,
              onValueChange: this.props.toggleLarivaar,
            }}
            title="Larivaar"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            switch={{
              switchStyle,
              value: this.props.paragraphMode,
              onValueChange: this.props.toggleParagraphMode,
            }}
            title="Paragraph Mode"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/manglacharanicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Manglacharan Position"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            rightTitle={
              actions.manglacharanPositionNames[
                actions.MANGLACHARAN_POSITIONS.indexOf(
                  this.props.manglacharanPosition
                )
              ]
            }
            rightTitleStyle={[
              styles.titleInfoStyle,
              { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
            ]}
            chevron={true}
            bottomDivider={true}
            onPress={() => this.ManglacharanPositionActionSheet.show()}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/larivaaricon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            title="Padchhed Settings"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            rightTitle={
              actions.padchhedSettingNames[
                actions.PADCHHED_SETTINGS.indexOf(this.props.padchhedSetting)
              ]
            }
            rightTitleStyle={[
              styles.titleInfoStyle,
              { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
            ]}
            chevron={true}
            bottomDivider={true}
            onPress={() => this.PadchhedSettingsActionSheet.show()}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            switch={{
              switchStyle,
              value: this.props.visram,
              onValueChange: this.props.toggleVisram,
            }}
            title="Show Vishraams"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          {this.props.visram && (
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              leftAvatar={
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
              }
              title="Vishraam Options"
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
              rightTitle={
                actions.vishraamOptionNames[
                  actions.VISHRAAM_OPTIONS.indexOf(this.props.vishraamOption)
                ]
              }
              rightTitleStyle={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
              ]}
              chevron={true}
              bottomDivider={true}
              onPress={() => this.VishraamOptionsActionSheet.show()}
            />
          )}
          {this.props.visram && (
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              leftAvatar={
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
              }
              title="Vishraam Source"
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
              rightTitle={
                actions.vishraamSourceNames[
                  actions.VISHRAAM_SOURCES.indexOf(this.props.vishraamSource)
                ]
              }
              rightTitleStyle={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
              ]}
              chevron={true}
              bottomDivider={true}
              onPress={() => this.VishraamSourcesActionSheet.show()}
            />
          )}
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            switch={{
              switchStyle,
              value: this.props.reminders,
              onValueChange: this.props.toggleReminders,
            }}
            title="Reminders"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          {this.props.reminders && (
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              leftAvatar={
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
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
              chevron={true}
              bottomDivider={true}
              onPress={() =>
                navigate({
                  key: "ReminderOptions",
                  routeName: "ReminderOptions",
                })
              }
            />
          )}
          {this.props.reminders && (
            <ListItem
              backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
              leftAvatar={
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
              containerStyle={[
                styles.titleText,
                this.props.nightMode && { backgroundColor: "#464646" },
              ]}
              titleStyle={[this.props.nightMode && { color: "#fff" }]}
              rightTitle={
                actions.reminderSoundNames[
                  actions.REMINDER_SOUNDS.indexOf(this.props.reminderSound)
                ]
              }
              rightTitleStyle={[
                styles.titleInfoStyle,
                { color: this.props.nightMode ? "#fff" : "#a3a3a3" },
              ]}
              chevron={true}
              bottomDivider={true}
              onPress={() => this.ReminderSoundsActionSheet.show()}
            />
          )}
          <Text
            style={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" },
            ]}>
            Other Options
          </Text>
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
              <Avatar
                source={require("../images/analyticsicon.png")}
                overlayContainerStyle={{
                  backgroundColor: this.props.nightMode ? "#464646" : "#fff",
                }}
              />
            }
            switch={{
              switchStyle,
              value: this.props.statistics,
              onValueChange: this.props.toggleStatistics,
            }}
            title="Collect Statistics"
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            bottomDivider={true}
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            chevron={true}
            bottomDivider={true}
            onPress={() =>
              Linking.openURL("https://khalisfoundation.org/donate/")
            }
          />
          <ListItem
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            leftAvatar={
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
            containerStyle={[
              styles.titleText,
              this.props.nightMode && { backgroundColor: "#464646" },
            ]}
            titleStyle={[this.props.nightMode && { color: "#fff" }]}
            chevron={true}
            bottomDivider={true}
            onPress={() => navigate({ key: "About", routeName: "About" })}
          />
        </ScrollView>

        <ActionSheet
          ref={(actionSheet) => {
            this.FontSizeActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.fontSize}>
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
          ref={(actionSheet) => {
            this.FontFaceActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.fontFace}>
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
          ref={(actionSheet) => {
            this.TransliterationActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.transliteration}>
          <View>
            <Text style={styles.actionSheetTitle}>Language</Text>
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
          ref={(actionSheet) => {
            this.ManglacharanPositionActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.manglacharanPosition}>
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
          ref={(actionSheet) => {
            this.PadchhedSettingsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.padchhedSetting}>
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
          ref={(actionSheet) => {
            this.VishraamOptionsActionSheet = actionSheet;
          }}
          position="bottom"
          defaultValue={this.props.vishraamOption}>
          <View>
            <Text style={styles.actionSheetTitle}>Vishraam Options</Text>
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
            <Text style={styles.actionSheetTitle}>Vishraam Source</Text>
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
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
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
