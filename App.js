import { BackHandler, Alert, AppRegistry, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import * as React from "react";
import HomeScreen from "./screens/Home";
import FolderBaniScreen from "./screens/FolderBani";
import SettingsScreen from "./screens/Settings";
import EditBaniOrderScreen from "./screens/EditBaniOrder";
import ReminderOptionsScreen from "./screens/ReminderOptions";
import AboutScreen from "./screens/About";
import ReaderScreen from "./screens/Reader";
import BookmarksScreen from "./screens/Bookmarks";
import createStore from "./config/store";
import FirebaseNotification from "./utils/firebaseNotification";
import NotificationsManager from "./utils/notifications";

const Stack = createNativeStackNavigator();

const { store, persistor } = createStore();

export default class App extends React.Component {
  componentDidMount() {
    this.notificationHandler();
    BackHandler.addEventListener("hardwareBackPress", this.handleBackPress);
    // AppStateIOS.addEventListener("change", (state) => console.log("AppStateIOS changed to", state));
    AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const notification = new NotificationsManager();
        notification.resetBadgeCount();
      }
    });
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackPress);
  }

  handleBackPress = () => {
    Alert.alert(
      "Exit Sundar Gutka",
      "Are you sure you want to exit?",
      [{ text: "Cancel" }, { text: "Exit", onPress: () => BackHandler.exitApp() }],
      { cancelable: true }
    );
    return true;
  };

  notificationHandler = () => {
    const firebaseNotifaction = new FirebaseNotification();
    firebaseNotifaction.checkPermission();
    firebaseNotifaction.backgroundMessageHandler();
    firebaseNotifaction.foregroundMessage();
    firebaseNotifaction.handleNotification();
    const notification = new NotificationsManager();
    notification.listenReminders();
    // notification.listenReminders();
  };

  render() {
    const notification = new NotificationsManager();
    notification.resetBadgeCount();
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="FolderBani" component={FolderBaniScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Reader" component={ReaderScreen} />
              <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
              <Stack.Screen name="EditBaniOrder" component={EditBaniOrderScreen} />
              <Stack.Screen name="ReminderOptions" component={ReminderOptionsScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    );
  }
}
AppRegistry.registerHeadlessTask("RNFirebaseMessagingService", () => this.notificationHandler);
