import React, { useMemo, useRef } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { paletteFor } from "@theme/screenPalettes";
import { withScreenRoles } from "@theme/ScreenRolesProvider";
import useTheme from "@common/context";
import { setReaderFocused } from "@common/readerFocus";
import {
  navigationRef,
  constant,
  logError,
  startPerformanceTrace,
  stopTrace,
  resetTrace,
} from "@common";
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
import Themes from "../Settings/Themes";
import navigationThemeFor from "./navigationTheme";

// Settings and every utility page reachable from it share one palette — the
// navy hierarchy the bani list already uses — in dark mode. Declared here
// because the navigation graph is the place that already says which screens
// belong to which part of the app.
//
// Bookmarks is in the list for the same reason the bani list was: its body is
// a BaniList already drawing the navy ground, so leaving its frame on the
// semantic one left a dark strip above the content.
const SettingsScreen = withScreenRoles(Settings, "settings");
const ReminderOptionsScreen = withScreenRoles(ReminderOptions, "settings");
const ThemesScreen = withScreenRoles(Themes, "settings");
const EditBaniOrderScreen = withScreenRoles(EditBaniOrder, "settings");
const DatabaseUpdate = withScreenRoles(DatabaseUpdateScreen, "settings");
const About = withScreenRoles(AboutScreen, "settings");
const BookmarksScreen = withScreenRoles(Bookmarks, "settings");

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { theme } = useTheme();
  // What shows through behind a scene mid-transition. Home's own ground, since
  // that is the screen nearly every push in the app starts from — so the gap
  // at the trailing edge of a slide reads as more of the same page, not a
  // strip of something else. See navigationTheme for why only this changes.
  const sceneGround = paletteFor("baniList", theme).surface;
  const navigationTheme = useMemo(
    () => navigationThemeFor(sceneGround, theme.mode === "dark"),
    [sceneGround, theme.mode]
  );
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
    // The root-level overlay hosts (confirm dialog, toast) live outside this
    // container, so this is the one place that can tell them the Reader is on
    // screen and their surface should wear the reading theme.
    setReaderFocused(currentRouteName === constant.READER);
    if (previousRouteName !== currentRouteName) {
      trackScreenView(
        currentRouteName,
        currentRoute?.params?.key,
        currentRoute?.params?.params?.title
      ).catch(() => {});
    }
  };

  return (
    // The ground UNDER the navigator. The theme and contentStyle paint each
    // scene, but the stack container that holds the scenes paints nothing of its
    // own — so during Android's push transition the column between the outgoing
    // and incoming screens showed the Activity window, which the native theme
    // leaves light. This View is what lies beneath now, in the scenes' colour.
    <View style={{ flex: 1, backgroundColor: sceneGround }}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onReady={() => {
          const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
          routeNameRef.current = route?.name;
          setReaderFocused(route?.name === constant.READER);
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
            // The native scene's own background — the View above covers the gap
            // behind it; this covers the scene itself before its first frame.
            contentStyle: { backgroundColor: sceneGround },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
          {/* Screens that draw their own ScreenHeader opt out of the native one
              here, not in an effect, so the native bar never paints for a frame
              first (the stacked double header). */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
          <Stack.Screen name="FolderScreen" component={FolderScreen} />
          <Stack.Screen
            name="EditBaniOrder"
            component={EditBaniOrderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Bookmarks"
            component={BookmarksScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ReminderOptions" component={ReminderOptionsScreen} />
          <Stack.Screen name="Themes" component={ThemesScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="DatabaseUpdate"
            component={DatabaseUpdate}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default Navigation;
