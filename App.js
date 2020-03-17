import React from "react";
import { BackHandler, Alert } from "react-native";
import SafeAreaView from 'react-native-safe-area-view';

import { createStackNavigator, createAppContainer } from "react-navigation";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import HomeScreen from "./screens/Home";
import FolderBaniScreen from "./screens/FolderBani";
import SettingsScreen from "./screens/Settings";
import EditBaniOrderScreen from "./screens/EditBaniOrder";
import ReminderOptionsScreen from "./screens/ReminderOptions";
import AboutScreen from "./screens/About";
import ReaderScreen from "./screens/Reader";
import BookmarksScreen from "./screens/Bookmarks";
import createStore from "./config/store";
import firebase from 'react-native-firebase';

const RootStack = createStackNavigator(
  {
    Home: {
      screen: HomeScreen
    },
    FolderBani: {
      screen: FolderBaniScreen
    },
    Settings: {
      screen: SettingsScreen
    },
    Reader: {
      screen: ReaderScreen
    },
    Bookmarks: {
      screen: BookmarksScreen
    },
    EditBaniOrder: {
      screen: EditBaniOrderScreen
    },
    ReminderOptions: {
      screen: ReminderOptionsScreen
    },
    About: {
      screen: AboutScreen
    }
  },
  {
    headerMode: "none"
  }
);
const AppContainer = createAppContainer(RootStack);

const { store, persistor } = createStore();

export default class App extends React.Component {
  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackPress);
    this.checkPermission();
  }

  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async getToken() {
    firebase
      .messaging()
      .getToken()
      .then(fcmToken => {
        if (fcmToken) {
          console.log("FCM Token:", fcmToken);
        } else {
          console.log("user doesn't have a device token yet");
        }
      });
  }

  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // User has authorized
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log('permission rejected');
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackPress);
  }

  handleBackPress = () => {
    Alert.alert(
      "Exit Sundar Gutka",
      "Are you sure you want to exit?",
      [
        { text: "Cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() }
      ],
      { cancelable: true }
    );
    return true;
  };

  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaView style={{ flex: 1 }} forceInset={{ vertical: 'never' }}>
            <AppContainer />
          </SafeAreaView>
        </PersistGate>
      </Provider>
    );
  }
}
