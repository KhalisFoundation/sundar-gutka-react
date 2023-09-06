import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { Icon } from "@rneui/themed";
import HomeScreen from "../HomeScreen/HomeScreen";
import Reader from "../ReaderScreen/reader";
import Settings from "../Settings";
import AboutScreen from "../AboutScreen";
import colors from "../common/colors";
import STRINGS from "../common/localization";
import EditBaniOrder from "../EditBaniOrder";
import Bookmarks from "../Bookmarks";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import FolderScreen from "../FolderScreen";
import { styles, SettingsStyle } from "./style";

const Stack = createNativeStackNavigator();

const headerLeft = (navigation, isNightMode) => (
  <Icon
    name="arrow-back"
    style={{ fontSize: 30 }}
    onPress={() => navigation.goBack()}
    color={isNightMode ? colors.TOOLBAR_TINT : colors.TOOLBAR_TINT_DARK}
  />
);
function Navigation() {
  const { isNightMode } = useSelector((state) => state);
  const settingsStyle = SettingsStyle(isNightMode);
  const { homeHeaderStyle, homeHeaderTitle } = styles;
  const { headerTitleStyle, headerStyle } = settingsStyle;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
        }}
      >
        <Stack.Screen
          options={{
            title: STRINGS.fateh,
            headerTitleStyle: homeHeaderTitle,
            headerStyle: homeHeaderStyle,
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
