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
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Accordion from "react-native-collapsible/Accordion";
import DateTimePicker from "react-native-modal-datetime-picker";
import * as Animatable from "react-native-animatable";
import Modal from "react-native-modal";
import moment from "moment";
import ModalSelector from "react-native-modal-selector";
import PropTypes from "prop-types";
import NotificationsManager from "../utils/notifications";
import AnalyticsManager from "../utils/analytics";
import * as actions from "../actions/actions";
import GLOBAL from "../utils/globals";
import Database from "../utils/database";
import Strings from "../utils/localization";

class ReminderOptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeSections: [],
      reminderBaniData: [],
      baniList: null,
      isTimePickerVisible: false,
      isLabelModalVisible: false,
      timePickerSectionKey: -1,
      reminderModalSectionKey: -1,
      reminderLabelText: "",
    };
  }

  componentDidMount() {
    const { transliterationLanguage, reminderBanis } = this.props;
    Database.getBaniList(transliterationLanguage).then((baniList) => {
      this.setState(
        {
          baniList,
        },
        () => {
          if (JSON.parse(reminderBanis).length === 0) {
            this.setDefaultReminders();
          }
        }
      );
    });
    AnalyticsManager.getInstance().trackScreenView("Reminder Options", this.constructor.name);
  }

  componentWillUnmount() {
    this.hidetimePicker();
  }

  async handleSwitchToggled(value, key) {
    const { reminderBanis, setReminderBanis, reminders, reminderSound } = this.props;
    const array = JSON.parse(reminderBanis);
    array
      .filter((obj) => {
        return obj.key === key;
      })
      .map((foundObj) => {
        return foundObj;
      });
    setReminderBanis(JSON.stringify(array));
    await NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      JSON.stringify(array)
    );
  }

  handleTimePicked = async (time) => {
    const { reminderBanis, setReminderBanis, reminders, reminderSound } = this.props;
    const { timePickerSectionKey } = this.state;
    this.hidetimePicker();
    const array = JSON.parse(reminderBanis);
    array
      .filter((obj) => {
        return obj.key === timePickerSectionKey;
      })
      .map((foundObj) => {
        const temp = foundObj;
        temp.time = moment(time).local().format("h:mm A");
        temp.enabled = true;
        return temp;
      });
    AnalyticsManager.getInstance().trackRemindersEvent(
      "updateReminder",
      array[timePickerSectionKey]
    );
    setReminderBanis(JSON.stringify(array));
    await NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      JSON.stringify(array)
    );
  };

  async handleDeleteReminder(key) {
    const { reminderBanis, setReminderBanis, reminders, reminderSound } = this.props;
    const array = JSON.parse(reminderBanis).filter((obj) => {
      return obj.key !== key;
    });
    this.state.activeSections = [];
    setReminderBanis(JSON.stringify(array));
    await NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      JSON.stringify(array)
    );
  }

  async setDefaultReminders() {
    const defaultBanis = [];
    const { baniList } = this.state;
    const { setReminderBanis, reminders, reminderSound } = this.props;
    // Add Gur Mantar
    defaultBanis.push({
      key: 1,
      gurmukhi: baniList[1].gurmukhi,
      translit: baniList[1].translit,
      enabled: true,
      title: `${Strings.time_for} ${baniList[1].translit}`,
      time: "3:00 AM",
    });

    // Add Japji Sahib
    defaultBanis.push({
      key: 2,
      gurmukhi: baniList[2].gurmukhi,
      translit: baniList[2].translit,
      enabled: true,
      title: `${Strings.time_for} ${baniList[2].translit}`,
      time: "3:30 AM",
    });

    // Add Rehras Sahib
    defaultBanis.push({
      key: 21,
      gurmukhi: baniList[21].gurmukhi,
      translit: baniList[21].translit,
      enabled: true,
      title: `${Strings.time_for} ${baniList[21].translit}`,
      time: "6:00 PM",
    });

    // Add Sohila
    defaultBanis.push({
      key: 23,
      gurmukhi: baniList[23].gurmukhi,
      translit: baniList[23].translit,
      enabled: true,
      title: `${Strings.time_for} ${baniList[23].translit}`,
      time: "10:00 PM",
    });

    setReminderBanis(JSON.stringify(defaultBanis));
    await NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      JSON.stringify(defaultBanis)
    );
  }

  toggleLabelModal = () => {
    const { isLabelModalVisible } = this.state;
    this.setState({ isLabelModalVisible: !isLabelModalVisible });
  };

  showTimePicker = () => this.setState({ isTimePickerVisible: true });

  hidetimePicker = () => this.setState({ isTimePickerVisible: false });

  renderHeader = (section, index, isActive) => {
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
    const { nightMode, transliteration } = this.props;
    const {
      ACTIVE_VIEW_COLOR,
      ACTIVE_VIEW_COLOR_NIGHT_MODE,
      INACTIVE_VIEW_COLOR,
      INACTIVE_VIEW_COLOR_NIGHT_MODE,
      MODAL_TEXT_NIGHT_MODE,
      DISABLED_TEXT_COLOR_NIGHT_MODE,
      ENABELED_TEXT_COLOR_NIGHT_MODE,
    } = GLOBAL.COLOR;
    let backColor = null;
    if (isActive) {
      switch (nightMode) {
        case true:
          backColor = ACTIVE_VIEW_COLOR_NIGHT_MODE;
          break;
        case false:
          backColor = ACTIVE_VIEW_COLOR;
          break;
        default:
          backColor = null;
      }
    } else {
      switch (nightMode) {
        case true:
          backColor = INACTIVE_VIEW_COLOR_NIGHT_MODE;
          break;
        case false:
          backColor = INACTIVE_VIEW_COLOR;
          break;
        default:
          backColor = null;
      }
    }
    return (
      <Animatable.View
        duration={300}
        transition="backgroundColor"
        style={[
          styles.header,
          {
            backgroundColor: backColor,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={[
              styles.headerText,
              nightMode && {
                color: MODAL_TEXT_NIGHT_MODE,
              },
              !transliteration && {
                fontFamily: "GurbaniAkharHeavyTrue",
              },
              !section.enabled && {
                color: DISABLED_TEXT_COLOR_NIGHT_MODE,
              },
            ]}
          >
            {transliteration ? section.translit : section.gurmukhi}
          </Text>

          <Switch
            style={[]}
            onValueChange={(value) => this.handleSwitchToggled(value, section.key)}
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
          }}
        >
          <TouchableOpacity
            onPress={() => {
              this.setState({ timePickerSectionKey: section.key });
              this.showTimePicker();
            }}
          >
            <Text
              style={[
                styles.timeStyle,
                nightMode && {
                  color: GLOBAL.COLOR.MODAL_TEXT_NIGHT_MODE,
                },
                section.enabled
                  ? { color: ENABELED_TEXT_COLOR_NIGHT_MODE }
                  : { color: DISABLED_TEXT_COLOR_NIGHT_MODE },
              ]}
            >
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
              nightMode ? GLOBAL.COLOR.COMPONENT_COLOR_NIGHT_MODE : GLOBAL.COLOR.COMPONENT_COLOR
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

  renderContent = (section, index, isActive) => {
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
    const {
      COMPONENT_COLOR_NIGHT_MODE,
      COMPONENT_COLOR,
      ACTIVE_VIEW_COLOR_NIGHT_MODE,
      ACTIVE_VIEW_COLOR,
      INACTIVE_VIEW_COLOR_NIGHT_MODE,
      INACTIVE_VIEW_COLOR,
    } = GLOBAL.COLOR;
    const { nightMode } = this.props;
    let backColor = null;
    if (isActive) {
      switch (nightMode) {
        case true:
          backColor = ACTIVE_VIEW_COLOR_NIGHT_MODE;
          break;
        case false:
          backColor = ACTIVE_VIEW_COLOR;
          break;
        default:
          backColor = null;
      }
    } else {
      switch (nightMode) {
        case true:
          backColor = INACTIVE_VIEW_COLOR_NIGHT_MODE;
          break;
        case false:
          backColor = INACTIVE_VIEW_COLOR;
          break;
        default:
          backColor = null;
      }
    }
    return (
      <Animatable.View
        duration={300}
        transition="backgroundColor"
        style={[
          {
            backgroundColor: backColor,
          },
        ]}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => {
              this.initLabelModal(section.key);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons
                name="label-outline"
                color={nightMode ? COMPONENT_COLOR_NIGHT_MODE : COMPONENT_COLOR}
                size={30}
              />
              <Text
                style={[
                  styles.contentText,
                  nightMode ? { color: COMPONENT_COLOR_NIGHT_MODE } : { color: COMPONENT_COLOR },
                ]}
              >
                {section.title}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              this.handleDeleteReminder(section.key);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons
                name="delete-outline"
                color={nightMode ? COMPONENT_COLOR_NIGHT_MODE : COMPONENT_COLOR}
                size={30}
              />
              <Text
                style={[
                  styles.contentText,
                  nightMode ? { color: COMPONENT_COLOR_NIGHT_MODE } : { color: COMPONENT_COLOR },
                ]}
              >
                {Strings.delete}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View
          style={{
            borderBottomColor: COMPONENT_COLOR_NIGHT_MODE,
            borderBottomWidth: 1,
          }}
        />
      </Animatable.View>
    );
  };

  updateSections = (activeSections) => {
    this.setState({ activeSections });
  };

  async confirmNewReminderLabel() {
    const { reminderBanis, setReminderBanis, reminders, reminderSound } = this.props;
    const { reminderModalSectionKey } = this.state;
    const array = JSON.parse(reminderBanis);

    array
      .filter((obj) => {
        return obj.key === reminderModalSectionKey;
      })
      .map((foundObj) => {
        return foundObj;
      });
    setReminderBanis(JSON.stringify(array));
    await NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      JSON.stringify(array)
    );

    this.toggleLabelModal();
  }

  initLabelModal(key) {
    const { reminderBanis } = this.props;
    const array = JSON.parse(reminderBanis);
    const reminder = array.filter((obj) => {
      return obj.key === key;
    });

    this.setState({
      reminderLabelText: reminder[0].title,
      reminderModalSectionKey: key,
    });
    this.toggleLabelModal();
  }

  async addReminder(baniObject) {
    const { reminderBanis, setReminderBanis, reminders, reminderSound } = this.props;
    const array = JSON.parse(reminderBanis);

    array.push({
      key: baniObject.key,
      gurmukhi: baniObject.gurmukhi,
      translit: baniObject.translit,
      enabled: true,
      title: `${Strings.time_for} ${baniObject.translit}`,
      time: moment(new Date()).local().format("h:mm A"),
    });
    AnalyticsManager.getInstance().trackRemindersEvent("addReminder", array);
    setReminderBanis(JSON.stringify(array));
    await NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      JSON.stringify(array)
    );
  }

  addBaniReminder() {
    const { transliteration, reminderBanis } = this.props;
    const { baniList } = this.state;
    const baniOptions = [];
    const isTransliteration = transliteration;
    const curBaniList = baniList;

    const existingKeys = JSON.parse(reminderBanis).map(function (bani) {
      return bani.key;
    });

    Object.keys(curBaniList).forEach(function (key) {
      if (!existingKeys.includes(key) && key < 10000) {
        baniOptions.push({
          key,
          label: isTransliteration ? curBaniList[key].translit : curBaniList[key].gurmukhi,
          gurmukhi: curBaniList[key].gurmukhi,
          translit: curBaniList[key].translit,
        });
      }
    });
    this.setState(
      {
        reminderBaniData: baniOptions,
      },
      function () {
        this.selector.open();
      }
    );
  }

  resetReminderDefaults() {
    Alert.alert(Strings.reset_reminders, Strings.reset_reminder_text, [
      {
        text: Strings.cancel,
        style: "cancel",
      },
      {
        text: Strings.reset,
        style: "destructive",
        onPress: () => {
          AnalyticsManager.getInstance().trackRemindersEvent("resetReminderDefaults", true);
          this.setDefaultReminders();
        },
      },
    ]);
  }

  render() {
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
    const { navigation, nightMode, reminderBanis, transliteration } = this.props;
    const { goBack } = navigation;
    const {
      TOOLBAR_TINT,
      TOOLBAR_COLOR_ALT2,
      MODAL_BACKGROUND_NIGHT_MODE,
      MODAL_BACKGROUND,
      MODAL_ACCENT_NIGHT_MODE,
      MODAL_TEXT_NIGHT_MODE,
      MODAL_TEXT,
      MODAL_ACCENT_NIGHT_MODE_ALT,
      INACTIVE_VIEW_COLOR_NIGHT_MODE,
    } = GLOBAL.COLOR;
    const {
      isLabelModalVisible,
      reminderLabelText,
      isTimePickerVisible,
      reminderBaniData,
      activeSections,
    } = this.state;
    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <StatusBar backgroundColor={TOOLBAR_COLOR_ALT2} barStyle="light-content" />
        <Header
          backgroundColor={TOOLBAR_COLOR_ALT2}
          containerStyle={[Platform.OS === "android" && { height: 56, paddingTop: 0 }]}
          leftComponent={
            <Icon name="arrow-back" color={TOOLBAR_TINT} size={30} onPress={() => goBack()} />
          }
          centerComponent={{
            text: Strings.reminder_options,
            style: { color: TOOLBAR_TINT, fontSize: 18 },
          }}
          rightComponent={
            <View style={{ flexDirection: "row" }}>
              <Icon
                name="refresh"
                color={TOOLBAR_TINT}
                size={30}
                onPress={() => this.resetReminderDefaults()}
              />
              <Icon
                style={{ paddingLeft: 15 }}
                name="add"
                color={TOOLBAR_TINT}
                size={30}
                onPress={() => this.addBaniReminder()}
              />
            </View>
          }
        />
        <Modal
          isVisible={isLabelModalVisible}
          avoidKeyboard
          onBackButtonPress={() => this.setState({ isLabelModalVisible: false })}
          onBackdropPress={() => this.setState({ isLabelModalVisible: false })}
        >
          <View
            style={{
              padding: 20,
              backgroundColor: nightMode ? MODAL_BACKGROUND_NIGHT_MODE : MODAL_BACKGROUND,
            }}
          >
            <Text
              style={{
                paddingBottom: 5,
                color: MODAL_ACCENT_NIGHT_MODE,
              }}
            >
              {Strings.notification_text}:
            </Text>
            <TextInput
              style={{
                height: 40,
                color: nightMode ? MODAL_TEXT_NIGHT_MODE : MODAL_TEXT,
                borderRadius: 5,
                borderColor: MODAL_ACCENT_NIGHT_MODE_ALT,
                borderWidth: 1,
                paddingLeft: 5,
                paddingRight: 5,
              }}
              value={reminderLabelText}
              onChangeText={(reminderLabel) => this.setState({ reminderLabelText: reminderLabel })}
              selectionColor={GLOBAL.COLOR.MODAL_ACCENT_NIGHT_MODE}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                paddingTop: 20,
                paddingRight: 10,
              }}
            >
              <TouchableOpacity onPress={this.toggleLabelModal} style={{ marginRight: 40 }}>
                <Text
                  style={{
                    color: MODAL_ACCENT_NIGHT_MODE,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.confirmNewReminderLabel.bind(this)}>
                <Text
                  style={{
                    color: MODAL_ACCENT_NIGHT_MODE,
                  }}
                >
                  {Strings.ok}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <ModalSelector
          data={reminderBaniData}
          ref={(selector) => {
            this.selector = selector;
          }}
          optionTextStyle={[
            styles.optionText,
            !transliteration && {
              fontFamily: "GurbaniAkharHeavyTrue",
            },
          ]}
          customSelector={<View />}
          cancelText={Strings.cancel}
          onChange={(option) => {
            this.addReminder(option);
          }}
        />
        <ScrollView
          style={[
            styles.container,
            nightMode && {
              backgroundColor: INACTIVE_VIEW_COLOR_NIGHT_MODE,
            },
          ]}
        >
          <View
            style={[
              styles.container,
              nightMode && {
                backgroundColor: GLOBAL.COLOR.INACTIVE_VIEW_COLOR_NIGHT_MODE,
              },
            ]}
          >
            <Accordion
              activeSections={activeSections}
              sections={JSON.parse(reminderBanis)}
              renderHeader={this.renderHeader}
              renderContent={this.renderContent}
              onChange={this.updateSections}
            />

            <DateTimePicker
              isVisible={isTimePickerVisible}
              onConfirm={(time) => this.handleTimePicked(time)}
              onCancel={this.hidetimePicker}
              is24Hour={false}
              titleIOS={`${Strings.pick_a_time}:`}
              mode="time"
            />
          </View>
        </ScrollView>
      </View>
    );
  }
}

ReminderOptions.propTypes = {
  transliterationLanguage: PropTypes.string.isRequired,
  reminderBanis: PropTypes.string.isRequired,
  setReminderBanis: PropTypes.func.isRequired,
  reminders: PropTypes.bool.isRequired,
  reminderSound: PropTypes.string.isRequired,
  nightMode: PropTypes.bool.isRequired,
  transliteration: PropTypes.bool.isRequired,
  navigation: PropTypes.shape().isRequired,
};

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

export default connect(mapStateToProps, mapDispatchToProps)(ReminderOptions);
