import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import KeepAwake from "react-native-keep-awake";
import { SafeAreaView, View, Text, StatusBar, Platform } from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import AnalyticsManager from "../utils/analytics";
import NotificationsManager from "../utils/notifications";
import Database from "../utils/database";
import { mergedBaniList } from "../utils/helpers";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";
import BaniLengthSelector from "../components/BaniLengthSelector";
import VersionNumber from "react-native-version-number";
import messaging from '@react-native-firebase/messaging';
import Sound from "react-native-sound";
import Strings from "../utils/localization";

class Home extends React.Component {
  static navigationOptions = { header: null };

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true,
      showLengthSelector: false,
    };

    // Enable playback in silence mode
    Sound.setCategory("Ambient", true); // true = mixWithOthers
  }

  reorder(arr, index) {
    var ordered = new Array();
    var newIndex = new Array();
    for (var i = 0; i < index.length; i++) {
      if (arr[index[i]]) {
        ordered.push(arr[index[i]]);
        newIndex.push(index[i]);
      }
    }
    if (newIndex.length != index.length) {
      this.props.setBaniOrder(newIndex);
    }
    return ordered;
  }

  loadBaniList() {
    Database.getBaniList(this.props.transliterationLanguage).then(
      (baniList) => {
        this.props.setMergedBaniData(mergedBaniList(baniList));
        this.sortBani();
        this.setState({
          isLoading: false,
        });
      }
    );
  }

  sortBani() {
    this.setState({
      data: this.reorder(
        this.props.mergedBaniData.baniOrder,
        this.props.baniOrder
      ),
    });
  }

  changeKeepAwake(shouldBeAwake) {
    if (shouldBeAwake) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  }

  changeStatusBar(shouldBeHidden) {
    StatusBar.setHidden(shouldBeHidden);
  }

  componentDidMount() {
    var showBaniLengthSelector = false;
    if (this.props.appVersion != VersionNumber.appVersion) {
      if (this.props.appVersion == "") {
        // Is first install
        showBaniLengthSelector = true;
      }
      this.props.setAppVersion(VersionNumber.appVersion);
    }
    if (showBaniLengthSelector || this.props.baniLength == "") {
      this.setState({ showLengthSelector: true });
    }

    if (this.props.language !== "DEFAULT") {
      Strings.setLanguage(this.props.language);
    }

    this.changeKeepAwake(this.props.screenAwake || this.props.autoScroll);
    this.changeStatusBar(this.props.statusBar);
    AnalyticsManager.getInstance().allowTracking(this.props.statistics);

    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      this.props.reminderSound,
      this.props.reminderBanis
    );

    this.loadBaniList();

    AnalyticsManager.getInstance().trackScreenView(
      "Home Screen",
      this.constructor.name
    );

    NotificationsManager.getInstance().removeAllDeliveredNotifications();
    // Notification opened from background
    this.notificationOpenedListener = messaging()
      .onNotificationOpenedApp((notificationOpen) => {
        this.handleNotificationEvent(notificationOpen);
      });

    // Notification opened from closed state
    messaging()
      .getInitialNotification()
      .then(notificationOpen => {
        if (notificationOpen) {
          // App was opened by a notification
          this.handleNotificationEvent(notificationOpen);
        }
      });
  }

  handleNotificationEvent(notificationOpen) {
    let key = notificationOpen.notification.data["key"];
    let gurmukhi = notificationOpen.notification.data["gurmukhi"];
    let translit = notificationOpen.notification.data["translit"];
    let item = { id: key, gurmukhi: gurmukhi, translit: translit };

    NotificationsManager.getInstance().removeAllDeliveredNotifications();

    this.props.setCurrentShabad(item.id);
    this.props.navigation.navigate('Reader', {
      key: "Reader-" + item.id,
      params: { item: item },
    });
  }

  componentWillUnmount() {
     this.notificationOpenedListener();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.baniOrder != this.props.baniOrder) {
      this.sortBani();
    } else if (
      prevProps.transliterationLanguage != this.props.transliterationLanguage
    ) {
      this.loadBaniList();
    } else if (prevProps.screenAwake != this.props.screenAwake) {
      this.changeKeepAwake(this.props.screenAwake);
    } else if (prevProps.autoScroll != this.props.autoScroll) {
      if (this.props.autoScroll) {
        this.changeKeepAwake(true);
      } else {
        this.changeKeepAwake(this.props.screenAwake);
      }
    } else if (prevProps.statusBar != this.props.statusBar) {
      this.changeStatusBar(this.props.statusBar);
    } else if (prevProps.statistics != this.props.statistics) {
      AnalyticsManager.getInstance().allowTracking(this.props.statistics);
    } else if (prevProps.reminders != this.props.reminders) {
      NotificationsManager.getInstance().checkPermissions(this.props.reminders);
      NotificationsManager.getInstance().updateReminders(
        this.props.reminders,
        this.props.reminderSound,
        this.props.reminderBanis
      );
    } else if (prevProps.reminderSound != this.props.reminderSound) {
      NotificationsManager.getInstance().updateReminders(
        this.props.reminders,
        this.props.reminderSound,
        this.props.reminderBanis
      );

      if (actions.REMINDER_SOUNDS.indexOf(this.props.reminderSound) != 0) {
        var sound = new Sound(
          this.props.reminderSound,
          Sound.MAIN_BUNDLE,
          (error) => {
            if (error) {
              return;
            }
            // loaded successfully
            sound.play(() => {
              sound.reset();
            });
          }
        );
      }
    }
  }

  handleOnPress(item, navigator) {
    if (!item.folder) {
      this.props.setCurrentShabad(item.id);
      navigator.navigate('Reader', {
        key: "Reader-" + item.id,
        params: { item: item },
      });
    } else {
      navigator.navigate('FolderBani', {
        key: "Folder-" + item.roman,
        params: { data: item.folder, title: item.gurmukhi },
      });
    }
  }

  render() {
    return (
      <SafeAreaView
        style={{
          flex: 1, 
          backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR
        }}>
        {this.state.showLengthSelector && <BaniLengthSelector />}

        <StatusBar
          barStyle={"light-content"}
        />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR}
          containerStyle={[
            { height: 0, borderBottomWidth: 0 },
            Platform.OS === "android" && { paddingTop: 10 },
          ]}
        />
        <View
          style={{
            backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR,
            paddingBottom: 10,
          }}>
          <Text
            style={[
              {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: "GurbaniAkharHeavySG",
                fontSize: 18,
                textAlign: "center",
                paddingBottom: 10,
              },
            ]}>
            {Strings.fateh}

          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}>
            <Text
              style={[
                {
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  fontFamily: "GurbaniAkharHeavySG",
                  fontSize: 28,
                },
              ]}>
              <Text
                style={[
                  {
                    fontSize: 32,
                  },
                ]}>
                Œ
              </Text>{" "}
              {Strings.sg_title}{" "}
              <Text
                style={[
                  {
                    fontSize: 32,
                  },
                ]}>
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
            size={30}
            onPress={() =>
              this.props.navigation.navigate('Settings')
            }
          />
        </View>
        <BaniList
          data={this.state.data}
          nightMode={this.props.nightMode}
          fontSize={this.props.fontSize}
          fontFace={this.props.fontFace}
          transliteration={this.props.transliteration}
          navigation={this.props.navigation}
          isLoading={this.state.isLoading}
          onPress={this.handleOnPress.bind(this)}
        />
      </SafeAreaView>
    );
  }
}

function mapStateToProps(state) {
  return {
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
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
