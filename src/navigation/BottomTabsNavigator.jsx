import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomNavigation from "@common/components/BottomNavigation";
import { constant } from "@common";
import HomeScreen from "../HomeScreen";
import ReaderScreen from "../ReaderScreen";
import Settings from "../Settings";

const Tab = createBottomTabNavigator();

// Custom tab bar component that uses our BottomNavigation
const CustomTabBar = (props) => {
  const { state, navigation } = props || {};
  const currentRoute = state?.routes[state?.index]?.name || "Home";
  return <BottomNavigation navigation={navigation} currentRoute={currentRoute} />;
};

const BottomTabsNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={CustomTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name={constant.READER} component={ReaderScreen} />
      <Tab.Screen
        options={{
          headerShown: true,
        }}
        name={constant.SETTINGS}
        component={Settings}
      />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigator;
