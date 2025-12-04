import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef, stopTrace, resetTrace, startPerformanceTrace } from "@common";
import AboutScreen from "../AboutScreen";
import Bookmarks from "../Bookmarks";
import { trackScreenView } from "../common/firebase/analytics";
import DatabaseUpdateScreen from "../DatabaseUpdate";
import EditBaniOrder from "../EditBaniOrder";
import FolderScreen from "../FolderScreen";
import HomeScreen from "../HomeScreen";
import ReaderScreen from "../ReaderScreen";
import Settings from "../Settings";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const routeNameRef = React.useRef();
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
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
      }}
      onStateChange={async (state) => {
        handlingStateChange(state);
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
        <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={Settings} />
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
