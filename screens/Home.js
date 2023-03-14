import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import KeepAwake from "react-native-keep-awake";
import { View, Text, StatusBar, Dimensions, Appearance, AppState } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import VersionNumber from "react-native-version-number";
// import messaging from '@react-native-firebase/messaging';
import Sound from "react-native-sound";
import { SafeAreaView } from "react-native-safe-area-context";
import GLOBAL from "../utils/globals";
import AnalyticsManager from "../utils/analytics";
import Database from "../utils/database";
import { mergedBaniList } from "../utils/helpers";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";
import BaniLengthSelector from "../components/BaniLengthSelector";
import Strings from "../utils/localization";
import CONSTANT from "../utils/constant";
import NotificationsManager from "../utils/notifications";

class Home extends React.Component {
  static navigationOptions = { header: null };

  constructor(props) {
    super(props);

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
      data: [],
      showLengthSelector: false,
      orientation: isPortrait() ? CONSTANT.PORTRAIT : CONSTANT.LANDSCAPE,
    };

    // Enable playback in silence mode
    Sound.setCategory(CONSTANT.AMBIENT, true); // true = mixWithOthers
  }

  async componentDidMount() {
    await this.loadBaniList();
    let showBaniLengthSelector = false;
    const {
      appVersion,
      fontFace,
      setFontFace,
      setAppVersion,
      baniLength,
      screenAwake,
      autoScroll,
      statusBar,
      statistics,
      reminderSound,
      reminderBanis,
      reminders,
      appearance,
    } = this.props;

    if (appearance === "Default") {
      this.updateTheme();
    }
    AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (appearance === "Default") {
          this.updateTheme();
        }
      }
    });
    if (appVersion !== VersionNumber.appVersion) {
      if (appVersion === "") {
        // Is first install
        showBaniLengthSelector = true;
      }
      setAppVersion(VersionNumber.appVersion);
    }
    if (showBaniLengthSelector || baniLength === "") {
      this.setState({ showLengthSelector: true });
    }
    const { GURBANI_AKHAR_SG, GURBANI_AKHAR_HEAVY_SG, GURBANI_AKHAR_THICK_SG, GURBANI_AKHAR_TRUE } =
      CONSTANT;
    if (
      !fontFace ||
      fontFace === GURBANI_AKHAR_SG ||
      fontFace === GURBANI_AKHAR_HEAVY_SG ||
      fontFace === GURBANI_AKHAR_THICK_SG
    ) {
      setFontFace(GURBANI_AKHAR_TRUE);
    }

    this.changeKeepAwake(screenAwake || autoScroll);
    this.changeStatusBar(statusBar);
    AnalyticsManager.getInstance().allowTracking(statistics);

    NotificationsManager.getInstance().updateReminders(reminders, reminderSound, reminderBanis);
    AnalyticsManager.getInstance().trackScreenView(CONSTANT.HOME_SCREEN, this.constructor.name);
    NotificationsManager.getInstance().removeAllDeliveredNotifications();
  }

  componentDidUpdate(prevProps) {
    const {
      baniOrder,
      transliterationLanguage,
      screenAwake,
      autoScroll,
      statusBar,
      statistics,
      reminders,
      reminderBanis,
      reminderSound,
    } = this.props;

    if (prevProps.baniOrder !== baniOrder) {
      this.sortBani();
    } else if (prevProps.transliterationLanguage !== transliterationLanguage) {
      this.loadBaniList();
    } else if (prevProps.screenAwake !== screenAwake) {
      this.changeKeepAwake(screenAwake);
    } else if (prevProps.autoScroll !== autoScroll) {
      if (autoScroll) {
        this.changeKeepAwake(true);
      } else {
        this.changeKeepAwake(screenAwake);
      }
    } else if (prevProps.statusBar !== statusBar) {
      this.changeStatusBar(statusBar);
    } else if (prevProps.statistics !== statistics) {
      AnalyticsManager.getInstance().allowTracking(statistics);
    } else if (prevProps.reminders !== reminders) {
      // NotificationsManager.getInstance().checkPermissions(reminders);
      NotificationsManager.getInstance().updateReminders(reminders, reminderSound, reminderBanis);
    } else if (prevProps.reminderSound !== reminderSound) {
      NotificationsManager.getInstance().updateReminders(reminders, reminderSound, reminderBanis);

      if (actions.REMINDER_SOUNDS.indexOf(reminderSound) !== 0) {
        const sound = new Sound(reminderSound, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            return;
          }
          sound.play(() => {
            sound.reset();
          });
        });
      }
    }
  }

  handleOnPress(item, navigator) {
    if (!item.folder) {
      const { setCurrentShabad } = this.props;
      setCurrentShabad(item.id);
      navigator.navigate(CONSTANT.READER, {
        key: `Reader-${item.id}`,
        params: { item },
      });
    } else {
      navigator.navigate(CONSTANT.FOLDER_BANI, {
        key: `Folder-${item.roman}`,
        params: { data: item.folder, title: item.gurmukhi },
      });
    }
  }

  changeKeepAwake = (shouldBeAwake) => {
    if (shouldBeAwake) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  };

  changeStatusBar = (shouldBeHidden) => {
    StatusBar.setHidden(shouldBeHidden);
  };

  updateTheme = () => {
    const { toggleNightMode } = this.props;
    const colorScheme = Appearance.getColorScheme();
    if (colorScheme === "light") {
      toggleNightMode(false);
    } else {
      toggleNightMode(true);
    }
  };

  // handleNotificationEvent(notificationOpen) {
  //   let key = notificationOpen.notification.data["key"];
  //   let gurmukhi = notificationOpen.notification.data["gurmukhi"];
  //   let translit = notificationOpen.notification.data["translit"];
  //   let item = { id: key, gurmukhi: gurmukhi, translit: translit };

  //   NotificationsManager.getInstance().removeAllDeliveredNotifications();

  //   this.props.setCurrentShabad(item.id);
  //   this.props.navigation.navigate('Reader', {
  //     key: "Reader-" + item.id,
  //     params: { item: item },
  //   });
  // }

  sortBani() {
    const { mergedBaniData, baniOrder } = this.props;

    this.setState({
      data: this.reorder(mergedBaniData.baniOrder, baniOrder),
    });
  }

  // async requestUserPermission() {
  //   const authStatus = await messaging().requestPermission();
  //   const enabled =
  //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  // }

  async loadBaniList() {
    const { transliterationLanguage, setMergedBaniData } = this.props;
    const baniList = await Database.getBaniList(transliterationLanguage);
    setMergedBaniData(mergedBaniList(baniList));
    this.sortBani();
  }

  reorder(arr, index) {
    const ordered = [];
    const newIndex = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < index.length; i++) {
      if (arr[index[i]]) {
        ordered.push(arr[index[i]]);
        newIndex.push(index[i]);
      }
    }
    if (newIndex.length !== index.length) {
      const { baniOrder } = this.props;
      baniOrder.setBaniOrder(newIndex);
    }
    return ordered;
  }

  render() {
    const { showLengthSelector, data, orientation } = this.state;
    const { navigation, nightMode, fontSize, fontFace, transliteration } = this.props;
    const backColor =
      orientation === CONSTANT.PORTRAIT ? GLOBAL.COLOR.TOOLBAR_COLOR : GLOBAL.COLOR.NIGHT_BLACK;
    const { GURBANI_AKHAR_TRUE } = CONSTANT;
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: backColor,
          paddingBottom: -30,
        }}
      >
        {showLengthSelector && <BaniLengthSelector />}

        <StatusBar barStyle="light-content" style={{ backgroundColor: "#000" }} />
        <View
          style={{
            backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR,
            paddingBottom: 10,
          }}
        >
          <Text
            style={[
              {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontSize: 18,
                textAlign: "center",
                padding: 15,
              },
            ]}
          >
            {Strings.fateh}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text
              style={[
                {
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  fontSize: 28,
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontSize: 32,
                    fontFamily: GURBANI_AKHAR_TRUE,
                  },
                ]}
              >
                Œ
              </Text>{" "}
              {Strings.sg_title}{" "}
              <Text
                style={[
                  {
                    fontFamily: GURBANI_AKHAR_TRUE,
                    fontSize: 32,
                  },
                ]}
              >
                ‰
              </Text>
            </Text>
          </View>
          <Icon
            name="settings"
            style={{
              position: "absolute",
              right: 10,
              bottom: 15,
            }}
            color={GLOBAL.COLOR.TOOLBAR_TINT}
            size={35}
            onPress={() => {
              navigation.navigate(CONSTANT.SETTINGS);
            }}
          />
        </View>
        <BaniList
          data={data}
          nightMode={nightMode}
          fontSize={fontSize}
          fontFace={fontFace}
          transliteration={transliteration}
          navigation={navigation}
          onPress={this.handleOnPress.bind(this)}
        />
      </SafeAreaView>
    );
  }
}

Home.defaultProps = {
  mergedBaniData: {
    baniOrder: [],
  },
};

Home.propTypes = {
  appVersion: PropTypes.string.isRequired,
  setAppVersion: PropTypes.func.isRequired,
  baniLength: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  setFontFace: PropTypes.func.isRequired,
  screenAwake: PropTypes.bool.isRequired,
  autoScroll: PropTypes.bool.isRequired,
  statusBar: PropTypes.bool.isRequired,
  statistics: PropTypes.bool.isRequired,
  reminderSound: PropTypes.string.isRequired,
  reminderBanis: PropTypes.string.isRequired,
  reminders: PropTypes.bool.isRequired,
  baniOrder: PropTypes.arrayOf(PropTypes.number).isRequired,
  transliterationLanguage: PropTypes.string.isRequired,
  setCurrentShabad: PropTypes.func.isRequired,
  mergedBaniData: PropTypes.shape({
    baniOrder: PropTypes.arrayOf(
      PropTypes.shape({
        gurmukhi: PropTypes.string,
        id: PropTypes.number,
        translit: PropTypes.string,
      })
    ),
  }),
  setMergedBaniData: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    addEventListener: PropTypes.func,
    canGoBack: PropTypes.func,
    dispatch: PropTypes.func,
    getID: PropTypes.func,
    getParent: PropTypes.func,
    getState: PropTypes.func,
    goBack: PropTypes.func,
    isFocused: PropTypes.func,
    navigate: PropTypes.func,
    pop: PropTypes.func,
    popToTop: PropTypes.func,
    push: PropTypes.func,
    removeListener: PropTypes.func,
    replace: PropTypes.func,
    reset: PropTypes.func,
    setOptions: PropTypes.func,
    setParams: PropTypes.func,
  }).isRequired,
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
  transliteration: PropTypes.bool.isRequired,
  appearance: PropTypes.string.isRequired,
  toggleNightMode: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    data: state.data,
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    mergedBaniData: state.mergedBaniData,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    language: state.language,
    screenAwake: state.screenAwake,
    statusBar: state.statusBar,
    statistics: state.statistics,
    autoScroll: state.autoScroll,
    appVersion: state.appVersion,
    baniLength: state.baniLength,
    reminders: state.reminders,
    reminderBanis: state.reminderBanis,
    reminderSound: state.reminderSound,
    appearance: state.appearance,
    systemTheme: state.systemTheme,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
