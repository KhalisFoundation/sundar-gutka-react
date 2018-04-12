import React from "react";
import { StyleSheet } from "react-native";
import { StackNavigator, TabNavigator } from "react-navigation";
import { Header, Icon } from "react-native-elements";
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

// this.props.romanized
//                 ? params.item.roman
//                 : params.item.gurmukhi,

const FolderNavigation = TabNavigator({
  Home: {
    screen: HomeScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          centerComponent={{
            text: "Sundar Gutka",
            style: styles.headerBarStyle
          }}
          rightComponent={
            <Icon
              name="settings"
              color="#fff"
              onPress={() => navigation.navigate("Settings")}
              underlayColor={"#64b5f6"}
            />
          }
        />
      ),
      tabBarVisible: false
    })
  },
  FolderBani: {
    screen: FolderBaniScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          leftComponent={
            <Icon
              name="arrow-back"
              color="#fff"
              onPress={() => navigation.goBack()}
              underlayColor={"#64b5f6"}
            />
          }
          centerComponent={{
            text: "Sundar Gutka",
            style: styles.headerBarStyle
          }}
          rightComponent={
            <Icon
              name="settings"
              color="#fff"
              onPress={() => navigation.navigate("Settings")}
              underlayColor={"#64b5f6"}
            />
          }
        />
      ),
      tabBarVisible: false,
      swipeEnabled: false
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
          backgroundColor="#DEBB0A"
          leftComponent={
            <Icon
              name="arrow-back"
              color="#fff"
              onPress={() => navigation.goBack()}
              underlayColor={"#64b5f6"}
            />
          }
          centerComponent={{ text: "Settings", style: styles.headerBarStyle }}
        />
      )
    })
  },
  Reader: {
    screen: ReaderScreen,

    navigationOptions: {
      header: null
    }
  },
  Bookmarks: {
    screen: BookmarksScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          backgroundColor="#DEBB0A"
          leftComponent={
            <Icon
              name="arrow-back"
              color="#fff"
              onPress={() => navigation.goBack()}
              underlayColor={"#64b5f6"}
            />
          }
          centerComponent={{ text: "Bookmarks", style: styles.headerBarStyle }}
        />
      )
    })
  },
  EditBaniOrder: {
    screen: EditBaniOrderScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          backgroundColor="#003436"
          leftComponent={
            <Icon
              name="arrow-back"
              color="#fff"
              onPress={() => navigation.goBack()}
              underlayColor={"#64b5f6"}
            />
          }
          centerComponent={{
            text: "Edit Bani Order",
            style: styles.headerBarStyle
          }}
          rightComponent={
            <Icon
              name="refresh"
              color="#fff"
              onPress={() =>
                store.dispatch(setBaniOrder(defaultBaniOrderArray))
              }
              underlayColor={"#64b5f6"}
            />
          }
        />
      )
    })
  },
  About: {
    screen: AboutScreen,
    navigationOptions: ({ navigation }) => ({
      header: (
        <Header
          backgroundColor="#003436"
          leftComponent={
            <Icon
              name="arrow-back"
              color="#fff"
              onPress={() => navigation.goBack()}
              underlayColor={"#64b5f6"}
            />
          }
          centerComponent={{ text: "About", style: styles.headerBarStyle }}
        />
      )
    })
  }
});

const styles = StyleSheet.create({
  headerBarStyle: {
    color: "#fff",
    fontSize: 18
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
