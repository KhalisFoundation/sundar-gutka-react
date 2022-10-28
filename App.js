import {
  BackHandler,
  Alert,
  AppRegistry,
  AppState,
  Text,
  Button,
  StyleSheet,
  View,
  Linking,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import * as React from "react";
import notifee, { EventType } from "@notifee/react-native";
import ErrorBoundary from "react-native-error-boundary";
import { setJSExceptionHandler } from "react-native-exception-handler";
import RNRestart from "react-native-restart";
import { SafeAreaView } from "react-native-safe-area-context";
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
import CONSTANT from "./utils/constant";
import NotificationsManager from "./utils/notifications";
import * as rootNavigation from "./utils/rootNavigation";
import errorHandler from "./utils/errorHandler";
import Strings from "./utils/localization";

const Stack = createNativeStackNavigator();

const { store, persistor } = createStore();

const eHandler = (e, isFatal) => {
  if (isFatal) {
    errorHandler(e);
    this.CustomFallback();
  } else {
    console.log(e);
  }
};

setJSExceptionHandler(eHandler, true);

export default class App extends React.Component {
  componentDidMount() {
    this.listenNotification();
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

  CustomFallback = () => {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ecf0f1",
        padding: 8,
        textAlign: "center",
      },
      title: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
      },
      icon: {
        fontSize: 48,
      },
      text: {
        marginVertical: 16,
        textAlign: "center",
        width: 300,
      },
      btnWrap: { flexDirection: "row" },
    });

    return (
      <SafeAreaView style={styles.container}>
        {/* <Image source={require("./images/bug.png")} /> */}
        <Text style={styles.title}>{Strings.errorTitle}</Text>
        <Text style={styles.text}>{Strings.errorMessage}</Text>
        <View style={styles.btnWrap}>
          <Button onPress={() => RNRestart.Restart()} title={Strings.errorReload} />
          <Text> </Text>
          <Button
            onPress={() => Linking.openURL("https://form.jotform.com/222881039684161")}
            title={Strings.errorReport}
          />
        </View>
      </SafeAreaView>
    );
  };

  listenNotification = async () => {
    const notification = new NotificationsManager();
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      notification.resetBadgeCount();
      // this.nav(initialNotification);
    }

    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          this.nav(detail);
          notification.resetBadgeCount();
          break;
        default:
          notification.resetBadgeCount();
          break;
      }
    });
  };

  nav = (incoming) => {
    const { data } = incoming.notification;
    const params = { key: `Reader-${data.id}`, params: { item: data } };
    rootNavigation.navigate(CONSTANT.READER, params);
  };

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
  };

  render() {
    return (
      <ErrorBoundary onError={errorHandler} FallbackComponent={this.CustomFallback}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer ref={rootNavigation.navigationRef}>
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
      </ErrorBoundary>
    );
  }
}
AppRegistry.registerHeadlessTask("RNFirebaseMessagingService", () => this.notificationHandler);
