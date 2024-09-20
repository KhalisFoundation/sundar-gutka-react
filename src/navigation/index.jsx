import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import notifee, { EventType } from "@notifee/react-native";
import SplashScreen from "react-native-splash-screen";
import { constant, colors, navigationRef, navigate, resetBadgeCount } from "@common";
import HomeScreen from "../HomeScreen";
import Reader from "../ReaderScreen";
import Settings from "../Settings";
import AboutScreen from "../AboutScreen";
import EditBaniOrder from "../EditBaniOrder";
import Bookmarks from "../Bookmarks";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import FolderScreen from "../FolderScreen";
import { SettingsStyle } from "./style";

const Stack = createNativeStackNavigator();

const headerLeft = (navigation, isNightMode) => (
  <Icon
    name="arrow-back"
    size={30}
    onPress={() => navigation.goBack()}
    color={isNightMode ? colors.TOOLBAR_TINT : colors.TOOLBAR_TINT_DARK}
  />
);
function Navigation() {
  useEffect(() => {
    // Code to run on component mount
    SplashScreen.hide(); // Hide the splash screen once everything is loaded
  }, []); // The empty array causes this effect to only run on mount

  const isNightMode = useSelector((state) => state.isNightMode);
  const settingsStyle = SettingsStyle(isNightMode);
  const { headerTitleStyle, headerStyle } = settingsStyle;

  const navigateTo = (incoming) => {
    const { data } = incoming.notification;
    const params = { key: `Reader-${data.id}`, params: { id: data.id, title: data.gurmukhi } };
    navigate(constant.READER, params);
  };

  useEffect(() => {
    async function setupNotifications() {
      // Correctly handle the initial notification promise
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        resetBadgeCount();
      }

      // Setting up event listeners
      const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
        switch (type) {
          case EventType.PRESS:
            navigateTo(detail);
            resetBadgeCount();
            break;
          default:
            resetBadgeCount();
        }
      });

      const unsubscribeBackground = notifee.onBackgroundEvent(({ type, detail }) => {
        switch (type) {
          case EventType.PRESS:
            navigateTo(detail);
            resetBadgeCount();
            break;
          default:
            resetBadgeCount();
        }
      });

      // Cleanup function to unsubscribe events
      return () => {
        unsubscribeForeground();
        unsubscribeBackground();
      };
    }

    setupNotifications();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
        }}
      >
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen name="Reader" component={Reader} />
        <Stack.Screen
          options={({ navigation }) => ({
            headerLeft: () => headerLeft(navigation, isNightMode),
            headerTitleStyle,
            headerStyle,
          })}
          name="Settings"
          component={Settings}
        />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="FolderScreen" component={FolderScreen} />
        <Stack.Screen name="EditBaniOrder" component={EditBaniOrder} />
        <Stack.Screen name="Bookmarks" component={Bookmarks} />
        <Stack.Screen name="ReminderOptions" component={ReminderOptions} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
