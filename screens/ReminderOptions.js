import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  StatusBar,
} from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialIcons from "react-native-vector-icons/MaterialCommunityIcons";
import GLOBAL from "../utils/globals";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import NotificationsManager from "../utils/notifications";
import Accordion from "react-native-collapsible/Accordion";
import DateTimePicker from "react-native-modal-datetime-picker";
import * as Animatable from "react-native-animatable";
import Modal from "react-native-modal";
import moment from "moment";
import ModalSelector from "react-native-modal-selector";
import Database from "../utils/database";

class ReminderOptions extends React.Component {
  componentDidMount() {
    Database.getBaniList(this.props.transliterationLanguage).then(
      (baniList) => {
        this.setState(
          {
            baniList: baniList,
          },
          function() {
            if (JSON.parse(this.props.reminderBanis).length == 0) {
              this.setDefaultReminders();
            }
          }
        );
      }
    );
    AnalyticsManager.getInstance().trackScreenView(
      "Reminder Options",
      this.constructor.name
    );
  }

  setDefaultReminders() {
    var defaultBanis = [];

    // Add Gur Mantar
    defaultBanis.push({
      key: 1,
      gurmukhi: this.state.baniList[1].gurmukhi,
      translit: this.state.baniList[1].translit,
      enabled: true,
      title: "Time for " + this.state.baniList[1].translit,
      time: "3:00 AM",
    });

    // Add Japji Sahib
    defaultBanis.push({
      key: 2,
      gurmukhi: this.state.baniList[2].gurmukhi,
      translit: this.state.baniList[2].translit,
      enabled: true,
      title: "Time for " + this.state.baniList[2].translit,
      time: "3:30 AM",
    });

    // Add Rehras Sahib
    defaultBanis.push({
      key: 21,
      gurmukhi: this.state.baniList[21].gurmukhi,
      translit: this.state.baniList[21].translit,
      enabled: true,
      title: "Time for " + this.state.baniList[21].translit,
      time: "6:00 PM",
    });

    // Add Sohila
    defaultBanis.push({
      key: 23,
      gurmukhi: this.state.baniList[23].gurmukhi,
      translit: this.state.baniList[23].translit,
      enabled: true,
      title: "Time for " + this.state.baniList[23].translit,
      time: "10:00 PM",
    });

    this.props.setReminderBanis(JSON.stringify(defaultBanis));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      JSON.stringify(defaultBanis)
    );
  }

  componentDidUnmount() {
    this._hideTimePicker();
  }

  _resetReminderDefaults() {
    Alert.alert(
      "Reset Reminders",
      "Do you want to restore reminders to the default values?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            AnalyticsManager.getInstance().trackRemindersEvent(
              "resetReminderDefaults",
              true
            );
            this.setDefaultReminders();
          },
        },
      ]
    );
  }

  _addBaniReminder() {
    var baniOptions = [];
    let isTransliteration = this.props.transliteration;
    let curBaniList = this.state.baniList;

    let existingKeys = JSON.parse(this.props.reminderBanis).map(function(bani) {
      return bani.key;
    });

    Object.keys(curBaniList).forEach(function(key) {
      if (!existingKeys.includes(key) && key < 10000) {
        baniOptions.push({
          key: key,
          label: isTransliteration
            ? curBaniList[key].translit
            : curBaniList[key].gurmukhi,
          gurmukhi: curBaniList[key].gurmukhi,
          translit: curBaniList[key].translit,
        });
      }
    });
    this.setState(
      {
        reminderBaniData: baniOptions,
      },
      function() {
        this.selector.open();
      }
    );
  }

  _addReminder(baniObject) {
    var array = JSON.parse(this.props.reminderBanis);

    array.push({
      key: baniObject.key,
      gurmukhi: baniObject.gurmukhi,
      translit: baniObject.translit,
      enabled: true,
      title: "Time for " + baniObject.translit,
      time: moment(new Date())
        .local()
        .format("h:mm A"),
    });
    AnalyticsManager.getInstance().trackRemindersEvent("addReminder", array);
    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      JSON.stringify(array)
    );
  }

  state = {
    activeSections: [],
    reminderBaniData: [],
    baniList: null,
    isTimePickerVisible: false,
    isLabelModalVisible: false,
    timePickerSectionKey: -1,
    reminderModalSectionKey: -1,
    reminderLabelText: "",
  };

  _initLabelModal(key) {
    var array = JSON.parse(this.props.reminderBanis);
    let reminder = array.filter((obj) => {
      return obj.key == key;
    });

    this.setState({
      reminderLabelText: reminder[0].title,
      reminderModalSectionKey: key,
    });
    this._toggleLabelModal();
  }

  _confirmNewReminderLabel() {
    var array = JSON.parse(this.props.reminderBanis);

    array
      .filter((obj) => {
        return obj.key == this.state.reminderModalSectionKey;
      })
      .map((foundObj) => {
        foundObj.title = this.state.reminderLabelText;
      });
    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      JSON.stringify(array)
    );

    this._toggleLabelModal();
  }

  _toggleLabelModal = () =>
    this.setState({ isLabelModalVisible: !this.state.isLabelModalVisible });

  _showTimePicker = () => this.setState({ isTimePickerVisible: true });

  _hideTimePicker = () => this.setState({ isTimePickerVisible: false });

  _handleTimePicked = (time) => {
    this._hideTimePicker();
    var array = JSON.parse(this.props.reminderBanis);
    array
      .filter((obj) => {
        return obj.key == this.state.timePickerSectionKey;
      })
      .map((foundObj) => {
        foundObj.time = moment(time)
          .local()
          .format("h:mm A");
        foundObj.enabled = true;
      });
    AnalyticsManager.getInstance().trackRemindersEvent(
      "updateReminder",
      array[this.state.timePickerSectionKey]
    );
    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      JSON.stringify(array)
    );
  };

  _handleSwitchToggled(value, key) {
    var array = JSON.parse(this.props.reminderBanis);
    array
      .filter((obj) => {
        return obj.key == key;
      })
      .map((foundObj) => {
        foundObj.enabled = value;
      });
    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      JSON.stringify(array)
    );
  }

  _handleDeleteReminder(key) {
    var array = JSON.parse(this.props.reminderBanis).filter((obj) => {
      return obj.key != key;
    });
    this.state.activeSections = [];
    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      JSON.stringify(array)
    );
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
        }}>
        <StatusBar
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          barStyle={"light-content"}
        />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          containerStyle={[
            Platform.OS === "android" && { height: 56, paddingTop: 0 },
          ]}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: "Reminder Options",
            style: { color: GLOBAL.COLOR.TOOLBAR_TINT, fontSize: 18 },
          }}
          rightComponent={
            <View style={{ flexDirection: "row" }}>
              <Icon
                name="refresh"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this._resetReminderDefaults()}
              />
              <Icon
                style={{ paddingLeft: 15 }}
                name="add"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this._addBaniReminder()}
              />
            </View>
          }
        />
        <Modal
          isVisible={this.state.isLabelModalVisible}
          avoidKeyboard={true}
          onBackButtonPress={() =>
            this.setState({ isLabelModalVisible: false })
          }
          onBackdropPress={() => this.setState({ isLabelModalVisible: false })}>
          <View
            style={{
              padding: 20,
              backgroundColor: this.props.nightMode
                ? GLOBAL.COLOR.MODAL_BACKGROUND_NIGHT_MODE
                : GLOBAL.COLOR.MODAL_BACKGROUND,
            }}>
            <Text
              style={{
                paddingBottom: 5,
                color: GLOBAL.COLOR.MODAL_ACCENT_NIGHT_MODE,
              }}>
              Notification Text:
            </Text>
            <TextInput
              style={{
                height: 40,
                color: this.props.nightMode
                  ? GLOBAL.COLOR.MODAL_TEXT_NIGHT_MODE
                  : GLOBAL.COLOR.MODAL_TEXT,
                borderRadius: 5,
                borderColor: GLOBAL.COLOR.MODAL_ACCENT_NIGHT_MODE_ALT,
                borderWidth: 1,
                paddingLeft: 5,
                paddingRight: 5,
              }}
              value={this.state.reminderLabelText}
              onChangeText={(reminderLabelText) =>
                this.setState({ reminderLabelText })
              }
              selectionColor={GLOBAL.COLOR.MODAL_ACCENT_NIGHT_MODE}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                paddingTop: 20,
                paddingRight: 10,
              }}>
              <TouchableOpacity
                onPress={this._toggleLabelModal}
                style={{ marginRight: 40 }}>
                <Text
                  style={{
                    color: GLOBAL.COLOR.MODAL_ACCENT_NIGHT_MODE,
                  }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={this._confirmNewReminderLabel.bind(this)}>
                <Text
                  style={{
                    color: GLOBAL.COLOR.MODAL_ACCENT_NIGHT_MODE,
                  }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <ModalSelector
          data={this.state.reminderBaniData}
          ref={(selector) => {
            this.selector = selector;
          }}
          optionTextStyle={[
            styles.optionText,
            !this.props.transliteration && {
              fontFamily: "GurbaniAkharHeavySG",
            },
          ]}
          customSelector={<View />}
          cancelText={"Cancel"}
          onChange={(option) => {
            this._addReminder(option);
          }}
        />
        <ScrollView
          style={[
            styles.container,
            this.props.nightMode && {
              backgroundColor: GLOBAL.COLOR.INACTIVE_VIEW_COLOR_NIGHT_MODE,
            },
          ]}>
          <View
            style={[
              styles.container,
              this.props.nightMode && {
                backgroundColor: GLOBAL.COLOR.INACTIVE_VIEW_COLOR_NIGHT_MODE,
              },
            ]}>
            <Accordion
              activeSections={this.state.activeSections}
              sections={JSON.parse(this.props.reminderBanis)}
              renderHeader={this._renderHeader}
              renderContent={this._renderContent}
              onChange={this._updateSections}
            />

            <DateTimePicker
              isVisible={this.state.isTimePickerVisible}
              onConfirm={(time) => this._handleTimePicked(time)}
              onCancel={this._hideTimePicker}
              is24Hour={false}
              titleIOS={"Pick a Time:"}
              mode={"time"}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  _renderHeader = (section, index, isActive) => {
    return (
      <Animatable.View
        duration={300}
        transition="backgroundColor"
        style={[
          styles.header,
          {
            backgroundColor: isActive
              ? this.props.nightMode
                ? GLOBAL.COLOR.ACTIVE_VIEW_COLOR_NIGHT_MODE
                : GLOBAL.COLOR.ACTIVE_VIEW_COLOR
              : this.props.nightMode
              ? GLOBAL.COLOR.INACTIVE_VIEW_COLOR_NIGHT_MODE
              : GLOBAL.COLOR.INACTIVE_VIEW_COLOR,
          },
        ]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Text
            style={[
              styles.headerText,
              this.props.nightMode && {
                color: GLOBAL.COLOR.MODAL_TEXT_NIGHT_MODE,
              },
              !this.props.transliteration && {
                fontFamily: "GurbaniAkharHeavySG",
              },
              !section.enabled && {
                color: GLOBAL.COLOR.DISABLED_TEXT_COLOR_NIGHT_MODE,
              },
            ]}>
            {this.props.transliteration ? section.translit : section.gurmukhi}
          </Text>

          <Switch
            style={[]}
            onValueChange={(value) =>
              this._handleSwitchToggled(value, section.key)
            }
            value={section.enabled}
            trackColor={
              Platform.OS === "ios"
                ? {
                    false: null,
                    true: GLOBAL.COLOR.SETTING_SWITCH_COLOR,
                  }
                : {}
            }
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}>
          <TouchableOpacity
            onPress={() => {
              this.setState({ timePickerSectionKey: section.key });
              this._showTimePicker();
            }}>
            <Text
              style={[
                styles.timeStyle,
                this.props.nightMode && {
                  color: GLOBAL.COLOR.MODAL_TEXT_NIGHT_MODE,
                },
                section.enabled
                  ? { color: GLOBAL.COLOR.ENABELED_TEXT_COLOR_NIGHT_MODE }
                  : { color: GLOBAL.COLOR.DISABLED_TEXT_COLOR_NIGHT_MODE },
              ]}>
              {section.time}
            </Text>
          </TouchableOpacity>
          <Icon
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
            name={isActive ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            color={
              this.props.nightMode
                ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                : GLOBAL.COLOR.COMPONENT_COLOR
            }
            size={30}
          />
        </View>
        <View
          style={{
            borderBottomColor: GLOBAL.COLOR.DISABLED_TEXT_COLOR_NIGHT_MODE,
            borderBottomWidth: 1,
            paddingBottom: 10,
          }}
        />
      </Animatable.View>
    );
  };

  _renderContent = (section, index, isActive) => {
    return (
      <Animatable.View
        duration={300}
        transition="backgroundColor"
        style={[
          {
            backgroundColor: isActive
              ? this.props.nightMode
                ? GLOBAL.COLOR.ACTIVE_VIEW_COLOR_NIGHT_MODE
                : GLOBAL.COLOR.ACTIVE_VIEW_COLOR
              : this.props.nightMode
              ? GLOBAL.COLOR.INACTIVE_VIEW_COLOR_NIGHT_MODE
              : GLOBAL.COLOR.INACTIVE_VIEW_COLOR,
          },
        ]}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => {
              this._initLabelModal(section.key);
            }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <MaterialIcons
                name="label-outline"
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                size={30}
              />
              <Text
                style={[
                  styles.contentText,
                  this.props.nightMode
                    ? { color: GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE }
                    : { color: GLOBAL.COLOR.COMPONENT_COLOR },
                ]}>
                {section.title}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              this._handleDeleteReminder(section.key);
            }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <MaterialIcons
                name="delete-outline"
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE
                    : GLOBAL.COLOR.COMPONENT_COLOR
                }
                size={30}
              />
              <Text
                style={[
                  styles.contentText,
                  this.props.nightMode
                    ? { color: GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE }
                    : { color: GLOBAL.COLOR.COMPONENT_COLOR },
                ]}>
                Delete
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View
          style={{
            borderBottomColor: GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE,
            borderBottomWidth: 1,
          }}
        />
      </Animatable.View>
    );
  };

  _updateSections = (activeSections) => {
    this.setState({ activeSections });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeStyle: {
    fontSize: 44,
  },
  header: {
    paddingTop: 15,
    paddingLeft: 10,
    paddingRight: 10,
  },
  headerText: {
    flex: 1,
    fontSize: 24,
  },
  contentText: {
    flex: 1,
    fontSize: 14,
    paddingLeft: 5,
  },
  content: {
    padding: 10,
  },
  optionText: {
    fontSize: 28,
  },
  separator: {
    height: 2,
  },
  list: {
    flex: 1,
  },
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    reminders: state.reminders,
    reminderSound: state.reminderSound,
    reminderBanis: state.reminderBanis,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReminderOptions);
