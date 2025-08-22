import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon } from "@rneui/themed";
import { navigationRef, stopTrace, resetTrace, startPerformanceTrace } from "@common";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import HomeScreen from "../HomeScreen";
import Reader from "../ReaderScreen";
import Settings from "../Settings";
import AboutScreen from "../AboutScreen";
import EditBaniOrder from "../EditBaniOrder";
import Bookmarks from "../Bookmarks";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import FolderScreen from "../FolderScreen";
import SettingsStyle from "./style";
import DatabaseUpdateScreen from "../DatabaseUpdate";

const Stack = createNativeStackNavigator();

const headerLeft = (navigation, theme) => (
  <Icon
    name="arrow-back"
    size={30}
    onPress={() => navigation.goBack()}
    color={theme.colors.primaryText}
  />
);
const Navigation = () => {
  const trace = React.useRef(null);
  const { theme } = useTheme();
  const settingStyle = useThemedStyles(SettingsStyle);

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
        <Stack.Screen name="Reader" component={Reader} options={{ headerShown: false }} />
        <Stack.Screen
          options={({ navigation }) => ({
            headerLeft: () => headerLeft(navigation, theme),
            headerTitleStyle: settingStyle.headerTitleStyle,
            headerStyle: settingStyle.headerStyle,
          })}
          name="Settings"
          component={Settings}
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
