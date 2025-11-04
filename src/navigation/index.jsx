import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef, stopTrace, resetTrace, startPerformanceTrace } from "@common";
import AboutScreen from "../AboutScreen";
import Bookmarks from "../Bookmarks";
import DatabaseUpdateScreen from "../DatabaseUpdate";
import EditBaniOrder from "../EditBaniOrder";
import FolderScreen from "../FolderScreen";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import BottomTabsNavigator from "./BottomTabsNavigator";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const trace = React.useRef(null);

  const handlingStateChange = async (state) => {
    if (trace.current) {
      await stopTrace(trace.current);
      trace.current = resetTrace();
    }
    const currentRouteName = state.routes[state.index].name;
    trace.current = await startPerformanceTrace(currentRouteName);
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={(state) => {
        handlingStateChange(state);
      }}
    >
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
          name="MainTabs"
          component={BottomTabsNavigator}
        />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="FolderScreen" component={FolderScreen} />
        <Stack.Screen
          options={{ headerShown: false }}
          name="EditBaniOrder"
          component={EditBaniOrder}
        />
        <Stack.Screen name="Bookmarks" component={Bookmarks} />
        <Stack.Screen name="ReminderOptions" component={ReminderOptions} />
        <Stack.Screen name="DatabaseUpdate" component={DatabaseUpdateScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
