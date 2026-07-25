import React, { useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { navigationRef } from "@common";
import AboutScreen from "../AboutScreen";
import Bookmarks from "../Bookmarks";
import { trackScreenView } from "../common/firebase/analytics";
import DatabaseUpdateScreen from "../DatabaseUpdate";
import DashboardScreen from "../DashboardScreen";
import EditBaniOrder from "../EditBaniOrder";
import FolderScreen from "../FolderScreen";
import HomeScreen from "../HomeScreen";
import ReaderScreen from "../ReaderScreen";
import Settings from "../Settings";
import SevaScreen from "../SevaScreen";
import DonationWebView from "../SevaScreen/DonationWebView";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import BottomNavigation from "../common/components/BottomNavigation";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom tab bar that uses the refactored context-aware BottomNavigation component
const CustomTabBar = (props) => {
  const { state, navigation } = props;
  const currentRoute = state.routes[state.index];
  const activeKey = currentRoute.name;

  return (
    <BottomNavigation
      activeKey={activeKey}
      context="home"
      visible={true}
      navigation={navigation}
    />
  );
};

// Main tab navigator for Home, Dashboard, Seva, Settings
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      backBehavior="none"
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Seva" component={SevaScreen} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const routeNameRef = useRef();

  const handleStateChange = async () => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current.getCurrentRoute().name;
    const currentRoute = navigationRef.current.getCurrentRoute();
    if (previousRouteName !== currentRouteName) {
      await trackScreenView(
        currentRouteName,
        currentRoute?.params?.key,
        currentRoute?.params?.params?.title
      );
    }
    routeNameRef.current = currentRouteName;
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
      }}
      onStateChange={async () => {
        await handleStateChange();
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
        }}
      >
        {/* Main tabs - no animation between tabs */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        {/* Stack screens - these push with animation */}
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="FolderScreen" component={FolderScreen} />
        <Stack.Screen
          options={{ headerShown: false }}
          name="EditBaniOrder"
          component={EditBaniOrder}
        />
        <Stack.Screen name="Bookmarks" component={Bookmarks} />
        <Stack.Screen
          name="DonationWebView"
          component={DonationWebView}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="ReminderOptions" component={ReminderOptions} />
        <Stack.Screen name="DatabaseUpdate" component={DatabaseUpdateScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
