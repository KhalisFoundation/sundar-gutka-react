import React from "react";
import {
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert
} from "react-native";
import { createStackNavigator } from "react-navigation";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import GLOBAL from "./utils/globals";
import HomeScreen from "./screens/Home";
import FolderBaniScreen from "./screens/FolderBani";
import SettingsScreen from "./screens/Settings";
import EditBaniOrderScreen from "./screens/EditBaniOrder";
import AboutScreen from "./screens/About";
import ReaderScreen from "./screens/Reader";
import BookmarksScreen from "./screens/Bookmarks";
import createStore from "./config/store";

const RootStack = createStackNavigator({
  Home: {
    screen: HomeScreen,
    navigationOptions: {
      header: null
    }
  },
  FolderBani: {
    screen: FolderBaniScreen,
    navigationOptions: {
      header: null
    }
  },
  Settings: {
    screen: SettingsScreen,
    navigationOptions: {
      header: null
    }
  },
  Reader: {
    screen: ReaderScreen,
    navigationOptions: {
      header: null
    }
  },
  Bookmarks: {
    screen: BookmarksScreen,
    navigationOptions: {
      header: null
    }
  },
  EditBaniOrder: {
    screen: EditBaniOrderScreen,
    navigationOptions: {
      header: null
    }
  },
  About: {
    screen: AboutScreen,
    navigationOptions: {
      header: null
    }
  }
});

const { store, persistor } = createStore();

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      safeAreaNavBarColor: GLOBAL.COLOR.TOOLBAR_COLOR,
      statusBarType: "light-content"
    };
  }

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

  _getCurrentRouteName(navState) {
    if (navState.hasOwnProperty("index")) {
      this._getCurrentRouteName(navState.routes[navState.index]);
    } else {
      if (
        navState.routeName === "Settings" ||
        navState.routeName === "Bookmarks"
      ) {
        this.setState({ safeAreaNavBarColor: GLOBAL.COLOR.TOOLBAR_COLOR_ALT });
        this.setState({ statusBarType: "dark-content" });
      } else if (
        navState.routeName === "EditBaniOrder" ||
        navState.routeName === "About"
      ) {
        this.setState({ safeAreaNavBarColor: GLOBAL.COLOR.TOOLBAR_COLOR_ALT2 });
        this.setState({ statusBarType: "light-content" });
      } else if (navState.routeName === "Reader") {
        this.setState({
          safeAreaNavBarColor: GLOBAL.COLOR.READER_HEADER_COLOR
        });
        this.setState({ statusBarType: "light-content" });
      } else {
        this.setState({ safeAreaNavBarColor: GLOBAL.COLOR.TOOLBAR_COLOR });
        this.setState({ statusBarType: "light-content" });
      }
    }
  }

  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <StatusBar
            backgroundColor={this.state.safeAreaNavBarColor}
            barStyle={this.state.statusBarType}
          />
          <SafeAreaView
            style={[
              { flex: 1 },
              { backgroundColor: this.state.safeAreaNavBarColor }
            ]}
          >
            <RootStack
              onNavigationStateChange={newState => {
                this._getCurrentRouteName(newState);
              }}
            />
          </SafeAreaView>
        </PersistGate>
      </Provider>
    );
  }
}
