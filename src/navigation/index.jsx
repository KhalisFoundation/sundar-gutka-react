import React, { useMemo, useRef } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { paletteFor } from "@theme/screenPalettes";
import { withScreenRoles } from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import { setReaderFocused } from "@common/readerFocus";
import { flushPendingNotificationRoute } from "@common/rootNavigation";
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
import BottomNavigation from "../common/components/BottomNavigation";
import { trackScreenView } from "../common/firebase/analytics";
import { useNavBarSurface } from "../common/systemBars";
import DashboardScreen from "../DashboardScreen";
import DatabaseUpdateScreen from "../DatabaseUpdate";
import EditBaniOrder from "../EditBaniOrder";
import FolderScreen from "../FolderScreen";
import HomeScreen from "../HomeScreen";
import ManageDownloads from "../ManageDownloads";
import MyPothisScreen from "../Pothi/MyPothisScreen";
import PothiReaderScreen from "../Pothi/PothiReaderScreen";
import ReaderScreen from "../ReaderScreen";
import Settings from "../Settings";
import ReminderOptions from "../Settings/components/reminders/ReminderOptions";
import Themes from "../Settings/Themes";
import SevaScreen from "../SevaScreen";
import SevaMeansScreen from "../SevaScreen/SevaMeansScreen";
import navigationThemeFor from "./navigationTheme";

// Settings and every utility page reachable from it share one palette — the
// navy hierarchy the bani list and Seva already use — in dark mode. Declared
// here because the navigation graph is the place that already says which
// screens belong to which part of the app.
//
// Bookmarks is in the list for the same reason the bani list was: its body is
// a BaniList already drawing the navy ground, so leaving its frame on the
// semantic one left a dark strip above the content.
const SettingsScreen = withScreenRoles(Settings, "settings");
const ReminderOptionsScreen = withScreenRoles(ReminderOptions, "settings");
const ThemesScreen = withScreenRoles(Themes, "settings");
const EditBaniOrderScreen = withScreenRoles(EditBaniOrder, "settings");
const DatabaseUpdate = withScreenRoles(DatabaseUpdateScreen, "settings");
const ManageDownloadsScreen = withScreenRoles(ManageDownloads, "settings");
const About = withScreenRoles(AboutScreen, "settings");
const BookmarksScreen = withScreenRoles(Bookmarks, "settings");
// Reached from Settings, so it wears the same palette as its siblings.
const MyPothis = withScreenRoles(MyPothisScreen, "settings");
// The pothi detail list, pushed from the Folders tab — same palette as the
// other pushed utility screens it now looks like.
const FolderDetail = withScreenRoles(FolderScreen, "settings");

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom tab bar that uses the refactored context-aware BottomNavigation component
const CustomTabBar = (props) => {
  const { state, navigation, descriptors } = props;
  const currentRoute = state.routes[state.index];
  const activeKey = currentRoute.name;
  const currentOptions = descriptors[currentRoute.key]?.options;
  const isHidden = currentOptions?.tabBarStyle?.display === "none";
  // The bar is the brand navy, so its glyphs are light. Hidden, it claims
  // NOTHING — it is still mounted under the Reader and the length screen, and a
  // hidden bar must not speak for the screen in front of the user. Before the
  // early return, because hooks cannot run conditionally.
  useNavBarSurface(isHidden ? null : false);

  if (isHidden) return null;

  return <BottomNavigation activeKey={activeKey} context="home" visible navigation={navigation} />;
};

CustomTabBar.propTypes = {
  // Both come from the navigator, keyed by route key, so only the shape this
  // component actually reads is described. `PropTypes.object` is forbidden and
  // would say nothing anyway.
  descriptors: PropTypes.objectOf(
    PropTypes.shape({ options: PropTypes.shape({ tabBarStyle: PropTypes.shape() }) })
  ).isRequired,
  navigation: PropTypes.shape({ navigate: PropTypes.func }).isRequired,
  state: PropTypes.shape({
    index: PropTypes.number.isRequired,
    routes: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string.isRequired, name: PropTypes.string.isRequired })
    ).isRequired,
  }).isRequired,
};

// The tab bar is RENDERED as an element rather than handed over as the render
// prop itself. React Navigation calls `tabBar` as a plain function, so a
// component passed straight in executes inside BottomTabView's render with no
// fiber of its own — and any hook it uses is an invalid hook call that takes
// the app down at launch. Returning an element gives it a fiber. Declared at
// module scope so it is one stable component type, not a new one per render.
// eslint-disable-next-line react/jsx-props-no-spreading
const renderTabBar = (barProps) => <CustomTabBar {...barProps} />;

// Main tab navigator for Home, Dashboard, Seva, Settings
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      // Android back returns to Home from any tab, rather than leaving the app.
      //
      // This was "none", which tells the tab navigator not to handle back AT
      // ALL. Settings hid that: it has its own handler falling back to Home. The
      // Dashboard and Seva tabs have none, so their back press fell through to
      // the root stack — which sits at index 0 while the tabs are showing — and
      // the app exited from what is, to the user, a page they navigated into.
      //
      // "initialRoute" is the platform convention: back always walks toward the
      // start destination, and only Home itself exits.
      backBehavior="initialRoute"
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Seva" component={SevaScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

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

  const handleStateChange = (state) => {
    // Fire-and-forget — never await Firebase on the navigation state change path
    handlePerformanceTrace(state).catch(() => {});

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
    // The ground UNDER the navigator. The theme and contentStyle above paint
    // each scene, but the stack container that holds the scenes paints nothing
    // of its own — so during Android's push transition, where the outgoing
    // screen drifts left while the incoming one is still arriving, the column
    // between them showed whatever lay beneath: the Activity window, which the
    // native theme leaves light. This View is what lies beneath now, in the
    // same colour as the scenes, and it follows the app theme where a native
    // windowBackground could not.
    <View style={{ flex: 1, backgroundColor: sceneGround }}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onReady={() => {
          const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
          routeNameRef.current = route?.name;
          setReaderFocused(route?.name === constant.READER);
          // A notification that launched the app is taken only now.
          flushPendingNotificationRoute();
        }}
        onStateChange={handleStateChange}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            headerTitleAlign: "center",
            // The native scene's own background — the container theme above
            // covers the gap behind it; this covers the scene itself before its
            // first frame has painted.
            contentStyle: { backgroundColor: sceneGround },
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
          <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
          <Stack.Screen
            name="FolderScreen"
            component={FolderDetail}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="MyPothis" component={MyPothis} options={{ headerShown: false }} />
          <Stack.Screen
            name="PothiReader"
            component={PothiReaderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="EditBaniOrder"
            component={EditBaniOrderScreen}
          />
          <Stack.Screen
            name="Bookmarks"
            component={BookmarksScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SevaMeans"
            component={SevaMeansScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ReminderOptions"
            component={ReminderOptionsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Themes" component={ThemesScreen} options={{ headerShown: false }} />
          {/* Declared here rather than switched off at runtime: the stack
              defaults to headerShown:true, so a screen that renders its own
              header must opt out. Doing it in an effect lets the native bar paint
              for a frame first, which is the stacked double header. */}
          <Stack.Screen
            name="DatabaseUpdate"
            component={DatabaseUpdate}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageDownloads"
            component={ManageDownloadsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default Navigation;
