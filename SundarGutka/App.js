import React from "react";
import { StackNavigator } from "react-navigation";
import { Header } from "react-native-elements";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import HomeScreen from "./screens/Home";
import SettingsScreen from "./screens/Settings";
import EditBaniOrderScreen from "./screens/EditBaniOrder";
import AboutScreen from "./screens/About";
import ReaderScreen from "./screens/Reader";
import createStore from "./config/store";
import { setBaniOrder, setMergedBaniData } from "./actions/actions";
import { defaultBaniOrderArray } from "./utils/helpers";
import Database from "./utils/database";
import { mergedBaniList } from "./utils/helpers";


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
              onPress: () => store.dispatch(setBaniOrder(defaultBaniOrderArray))
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
  },
  {
    headerMode: "screen"
  }
);

const { store, persistor } = createStore();

export default class App extends React.Component {
  componentDidMount() {
    Database.getBaniList().then(baniList => {
      store.dispatch(setMergedBaniData(mergedBaniList(baniList)));
    });
  }

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
