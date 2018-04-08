import React from "react";
import { StackNavigator, TabNavigator } from "react-navigation";
import { Header } from "react-native-elements";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import storage from "redux-persist/lib/storage";
import HomeScreen from "./screens/Home";
import FolderBaniScreen from "./screens/FolderBani";
import SettingsScreen from "./screens/Settings";
import EditBaniOrderScreen from "./screens/EditBaniOrder";
import AboutScreen from "./screens/About";
import ReaderScreen from "./screens/Reader";
import BookmarksScreen from "./screens/Bookmarks";
import createStore from "./config/store";
import { setBaniOrder } from "./actions/actions";
import { defaultBaniOrderArray } from "./utils/helpers";

const FolderNavigation = TabNavigator({
  Home: {
    screen: HomeScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          centerComponent={{ text: "Sundar Gutka", style: { color: "#fff" } }}
          rightComponent={{
            icon: "settings",
            color: "#fff",
            onPress: () => navigation.navigate("Settings")
          }}
        />
      )
    })
  },
  FolderBani: {
    screen: FolderBaniScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => navigation.goBack()
          }}
          centerComponent={{ text: "Sundar Gutka", style: { color: "#fff" } }}
          rightComponent={{
            icon: "settings",
            color: "#fff",
            onPress: () => navigation.navigate("Settings")
          }}
        />
      )
    })
  }
});

const RootStack = StackNavigator({
  BaniList: {
    screen: FolderNavigation
  },
  Settings: {
    screen: SettingsScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => navigation.goBack()
          }}
          centerComponent={{ text: "Settings", style: { color: "#fff" } }}
        />
      )
    })
  },
  Reader: {
    screen: ReaderScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => navigation.goBack()
          }}
          centerComponent={{ text: "Reader", style: { color: "#fff" } }}
          rightComponent={{
            icon: "bookmark",
            color: "#fff",
            onPress: () => navigation.navigate("Bookmarks")
          }}
        />
      )
    })
  },
  Bookmarks: {
    screen: BookmarksScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => navigation.goBack()
          }}
          centerComponent={{ text: "Bookmarks", style: { color: "#fff" } }}
        />
      )
    })
  },
  EditBaniOrder: {
    screen: EditBaniOrderScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => navigation.goBack()
          }}
          centerComponent={{
            text: "Edit Bani Order",
            style: { color: "#fff" }
          }}
          rightComponent={{
            icon: "refresh",
            color: "#fff",
            onPress: () => alert("pressedBookmark")
          }}
        />
      )
    })
  },
  About: {
    screen: AboutScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => navigation.goBack()
          }}
          centerComponent={{ text: "About", style: { color: "#fff" } }}
        />
      )
    })
  }
});

const { store, persistor } = createStore();

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <RootStack />
        </PersistGate>
      </Provider>
    );
  }
}
