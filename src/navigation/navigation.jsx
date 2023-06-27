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
            headerTitleStyle: { fontSize: 18, color: colors.WHITE_COLOR, fontWeight: "normal" },
            headerStyle: {
              backgroundColor: colors.TOOLBAR_COLOR,
            },
          }}
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen name="Reader" component={Reader} />
        <Stack.Screen
          options={({ navigation }) => ({
            headerLeft: () => headerLeft(navigation, isNightMode),
            headerTitleStyle: {
              color: !isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
              fontWeight: "normal",
            },
            headerStyle: {
              backgroundColor: !isNightMode
                ? colors.TOOLBAR_COLOR_ALT
                : colors.TOOLBAR_COLOR_ALT_NIGHT_MODE,
            },
          })}
          name="Settings"
          component={Settings}
        />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="EditBaniOrder" component={EditBaniOrder} />
        <Stack.Screen name="Bookmarks" component={Bookmarks} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navigation;
