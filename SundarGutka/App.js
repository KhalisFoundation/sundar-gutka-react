import React from "react";
import { StackNavigator } from "react-navigation";
import { Header } from "react-native-elements";
import { Provider } from "react-redux";
import { createStore } from "redux";
import HomeScreen from "./screens/Home";
import SettingsScreen from "./screens/Settings";
import ReaderScreen from "./screens/Reader";
import rootReducer from "./reducers/reducers";

const RootStack = StackNavigator(
  {
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
          />
        )
      })
    }
  },
  {
    headerMode: "screen"
  }
);

const store = createStore(rootReducer);

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <RootStack />
      </Provider>
    );
  }
}
