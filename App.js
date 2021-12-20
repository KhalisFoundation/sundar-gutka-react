import React from "react";
import { BackHandler, Alert, SafeAreaView } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

const Stack = createNativeStackNavigator();

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
          <NavigationContainer>
            <SafeAreaView style={{ flex: 1 }} >
              <Stack.Navigator
                screenOptions={{
                  headerShown: false
                }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="FolderBani" component={FolderBaniScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Reader" component={ReaderScreen} />
                <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
                <Stack.Screen name="EditBaniOrder" component={EditBaniOrderScreen} />
                <Stack.Screen name="ReminderOptions" component={ReminderOptionsScreen} />
                <Stack.Screen name="About" component={AboutScreen} />
              </Stack.Navigator>
            </SafeAreaView>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    );
  }
}
