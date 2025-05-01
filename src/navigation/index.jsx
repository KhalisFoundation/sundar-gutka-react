import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import { colors, navigationRef, stopTrace, resetTrace, startPerformanceTrace } from "@common";
import HomeScreen from "../HomeScreen";
import Reader from "../ReaderScreen";
import Settings from "../Settings";
import AboutScreen from "../AboutScreen";
import EditBaniOrder from "../EditBaniOrder";
import Bookmarks from "../Bookmarks";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import FolderScreen from "../FolderScreen";
import { SettingsStyle } from "./style";
import DatabaseUpdateScreen from "../DatabaseUpdate";

const Stack = createNativeStackNavigator();

const headerLeft = (navigation, isNightMode) => (
  <Icon
    name="arrow-back"
    size={30}
    onPress={() => navigation.goBack()}
    color={isNightMode ? colors.TOOLBAR_TINT : colors.TOOLBAR_TINT_DARK}
  />
);
const Navigation = () => {
  const trace = React.useRef(null);
  const isNightMode = useSelector((state) => state.isNightMode);
  const settingsStyle = SettingsStyle(isNightMode);
  const { headerTitleStyle, headerStyle } = settingsStyle;

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
        <Stack.Screen name="DatabaseUpdate" component={DatabaseUpdateScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
