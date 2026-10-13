import React, { useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef, logError, startPerformanceTrace, stopTrace, resetTrace } from "@common";
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
  const routeNameRef = useRef();
  // Holds the in-flight Firebase Performance trace for the current screen.
  const trace = useRef(null);

  // Firebase Performance: time each screen. Stop the previous route's trace and
  // start one for the new route. Best-effort — any failure is logged and
  // swallowed so perf monitoring never affects navigation.
  const handlePerformanceTrace = async (state) => {
    try {
      if (trace.current) {
        await stopTrace(trace.current);
        trace.current = resetTrace();
      }
      const currentRouteName = state.routes[state.index].name;
      trace.current = await startPerformanceTrace(currentRouteName);
    } catch (error) {
      // Silently fail - performance monitoring should never crash the app
      logError(
        new Error(
          `Performance trace failed for route: ${state.routes[state.index]?.name || "unknown"} - ${
            error?.message || "Unknown error"
          }`
        )
      );
      trace.current = resetTrace();
    }
  };

  // Trace updates run one after another. Fired independently, two quick screen
  // changes both stopped the same trace (the second stop reported as a failure)
  // and both started one, leaving a trace that was never stopped.
  const traceQueue = useRef(Promise.resolve());
  const queuePerformanceTrace = (state) => {
    traceQueue.current = traceQueue.current
      .then(() => handlePerformanceTrace(state))
      .catch(() => {});
  };

  const handleStateChange = (state) => {
    // Fire-and-forget — never await Firebase on the navigation state change path
    queuePerformanceTrace(state);

    const previousRouteName = routeNameRef.current;
    // Through `isReady()`, never `navigationRef.current` directly. The ref is
    // only attached between the container mounting and unmounting, and these
    // callbacks run from the container's own layout effects — so one firing
    // while the tree is being rebuilt (a rehydration settling, a theme swap)
    // found `current` null, threw, and the error boundary above replaced the
    // whole app with its fallback screen.
    const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
    if (!currentRoute) return;
    const currentRouteName = currentRoute.name;
    routeNameRef.current = currentRouteName;
    if (previousRouteName !== currentRouteName) {
      trackScreenView(
        currentRouteName,
        currentRoute?.params?.key,
        currentRoute?.params?.params?.title
      ).catch(() => {});
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
        routeNameRef.current = route?.name;
        // onStateChange doesn't fire for the initial screen, so start its trace
        // here; otherwise the first screen of every session has no timing.
        if (navigationRef.isReady()) {
          queuePerformanceTrace(navigationRef.getRootState());
        }
      }}
      onStateChange={handleStateChange}
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
