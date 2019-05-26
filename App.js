import React from "react";
import { SafeAreaView, BackHandler, Alert } from "react-native";
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
        <SafeAreaView style={{ flex: 1, backgroundColor: "#e6e6e6" }}>
          <AppContainer />
          </SafeAreaView>
        </PersistGate>
      </Provider>
    );
  }
}
