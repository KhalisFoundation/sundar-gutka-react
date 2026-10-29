import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { isTablet } from "react-native-device-info";
import ErrorBoundary from "react-native-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "react-native-splash-screen";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import notifee, { EventType } from "@notifee/react-native";
import {
  getInitialNotification,
  getMessaging,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";
import { PersistGate } from "redux-persist/integration/react";
import {
  createStore,
  STRINGS,
  logError,
  initializeCrashlytics,
  setCustomKey,
  FallBack,
  resetBadgeCount,
  navigateTo,
  initializePerformanceMonitoring,
  ConfirmDialogHost,
} from "@common";
import NetworkProvider from "./src/common/context/NetworkProvider";
import ThemeProvider from "./src/common/context/ThemeProvider";
import useOfflinePlaybackGuard from "./src/common/hooks/useOfflinePlaybackGuard";
import useOfflineSyncToast from "./src/common/hooks/useOfflineSyncToast";
import usePauseAudioOnExit from "./src/common/hooks/usePauseAudioOnExit";
import usePothiSync from "./src/common/hooks/usePothiSync";
import useReminderRearm from "./src/common/hooks/useReminderRearm";
import useSsoSession from "./src/common/hooks/useSsoSession";
import useStorageMigration from "./src/common/hooks/useStorageMigration";
import useGlobalDownloadManager from "./src/common/services/globalDownloadManager";
import useAudioCatalogSync from "./src/common/services/useAudioCatalogSync";
import toastConfig from "./src/common/toastConfig";
import { TrackPlayerSetup } from "./src/common/TrackPlayerUtils";
import Navigation from "./src/navigation";
import useDashboardSync from "./src/services/dashboard/useDashboardSync";
import { reportRecentExits } from "./src/services/diagnostics/exitReasons";
import usePushRegistration from "./src/services/push/usePushRegistration";
import useRemindersSync from "./src/services/reminders/useRemindersSync";
import useSettingsSync from "./src/services/settings/useSettingsSync";
import useAccountSync from "./src/services/sync/useAccountSync";
import useSyncOutbox from "./src/services/sync/useSyncOutbox";
import useRemoteThemesSync from "./src/services/themes/useRemoteThemesSync";

const { store, persistor } = createStore();

/**
 * After redux-persist rehydrates the store, sync the localization library
 * with the persisted language. Without this, STRINGS stays on the default
 * locale (English) because redux-persist's REHYDRATE action does not
 * trigger the setLanguage action creator where STRINGS.setLanguage() lives.
 */
const handleBeforeLift = () => {
  const { language } = store.getState();
  if (language) {
    STRINGS.setLanguage(language);
  }
  // Here, not on mount: this is the first point the persisted language is in
  // the store. Read any earlier and every session reports the reducer default.
  setCustomKey("app_language", language || "en-US");
  // Same reason: only now does the store hold the user's Statistics choice.
  initializePerformanceMonitoring(store.getState().isStatistics);
};

// Redux-dependent background services, mounted once inside the Provider tree.
const GlobalServices = () => {
  // Downloads run app-wide, not per screen: the queue keeps going while the
  // user reads something else, and finished files are adopted on launch.
  useGlobalDownloadManager();
  useStorageMigration();
  usePauseAudioOnExit();
  // Reminders already handed to the OS are re-armed, so they keep firing.
  useReminderRearm();
  // Push: registers this device's FCM token with the account, keeps its
  // topics current, and shows foreground messages. Mounted here so it runs
  // on every screen and before the user has opened anything.
  usePushRegistration();
  // Reading themes from the backend, merged over the bundled set on every
  // screen that resolves a theme.
  useRemoteThemesSync();
  // Pauses a streaming track once the connection has been gone for a moment.
  // It replaces the polling watchdog BottomNavigation used to run.
  useOfflinePlaybackGuard();
  // Offline audio parity: warms the manifest + lyrics caches for every audio
  // bani, so audio a user never opened online still plays offline. It starts
  // only after the launch window (see AUDIO_CATALOG_SYNC_DELAY_MS), so it
  // cannot compete with the fresh-install DB seed.
  useAudioCatalogSync();
  // The Khalis account session: restored from the Keychain on launch, the
  // sign-in redirect caught however it arrives, and dropped on expiry.
  useSsoSession();
  // Tells a signed-in user once when a change cannot reach the server yet.
  useOfflineSyncToast();
  // Account dashboard sync. Mounted HERE and not in DashboardScreen: on that
  // screen both the push and the restore only existed while it was mounted, so
  // signing in anywhere else never got the account's data up or down.
  useDashboardSync();
  // My Pothi, through the persisted outbox, and the two default pothis seeded.
  // Mounted here for the same reason as settings: a change made on any screen
  // goes up whether or not that screen stays open.
  usePothiSync();
  // Reminders, per reminder, through the same outbox and the same sync moments.
  useRemindersSync();
  // The person's preferences, per key, through the persisted outbox. Mounted
  // here rather than on Settings so a change made anywhere goes up whether or
  // not Settings stays open. Features register with the sync registry; the
  // outbox drains them.
  useSettingsSync();
  useSyncOutbox();
  // And takes back what other devices changed: on sign-in, foreground and
  // connectivity returning.
  useAccountSync();
  return null;
};

const App = () => {
  useEffect(() => {
    // Code to run on component mount
    SplashScreen.hide(); // Hide the splash screen once everything is loaded
  }, []); // The empty array causes this effect to only run on mount

  useEffect(() => {
    // No app-made user ID: Crashlytics already has its own per-install ID, and a
    // second persistent one could not be turned off by the Statistics opt-out.
    setCustomKey({
      platform: Platform.OS,
      device_type: isTablet() ? "tablet" : "phone",
    });
  }, []);

  useEffect(() => {
    const runSetup = async () => {
      await initializeCrashlytics();
      // Straight after Crashlytics is up, and before anything heavy: asks the
      // system why the LAST process died. A Low Memory Killer reclaim leaves no
      // crash report at all, so without this a phone that keeps losing the app
      // is indistinguishable from one that never opened it.
      await reportRecentExits();
      await TrackPlayerSetup();
    };

    // Guard against OS-initiated background cold starts (service revival, FCM,
    // Bluetooth events). startForeground() is blocked in background-restricted
    // states on Android 12+, so we must not call setupPlayer() until the app is
    // actually in the foreground. On a normal launcher tap AppState is already
    // 'active' and we run immediately with no overhead.
    if (AppState.currentState !== "active") {
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          sub.remove();
          runSetup().catch(logError);
        }
      });
      return () => sub.remove();
    }

    runSetup().catch(logError);
    return undefined;
  }, []);

  useEffect(() => {
    // A reminder tapped while the app was fully closed is what launched it.
    // On Android notifee hands that tap over here; on iOS it arrives as a PRESS
    // on the foreground handler below, which is why notifee deprecates this
    // call there. navigateTo holds the destination until the navigator is ready.
    if (Platform.OS === "android") {
      notifee
        .getInitialNotification()
        .then((initial) => {
          if (!initial) return undefined;
          resetBadgeCount();
          return navigateTo(initial);
        })
        .catch(logError);
    }

    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      resetBadgeCount();
      if (type === EventType.PRESS) {
        try {
          await navigateTo(detail);
        } catch (error) {
          logError(error);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Taps on a notification the SYSTEM drew, rather than the app.
  //
  // notifee only reports presses on notifications it posted itself. A campaign
  // that carries a `notification` block is drawn by FCM while the app is away,
  // so notifee never sees it and its route was simply lost — the app opened
  // wherever it had been left. These two are the only handlers that hear about
  // it: `getInitialNotification` for a tap that launched the app from cold, and
  // `onNotificationOpenedApp` for one that brought it back from the background.
  //
  // The payload is reshaped into the notifee detail that navigateTo reads, so
  // one router serves every source: reminders, app-drawn campaigns and these.
  useEffect(() => {
    const messaging = getMessaging();
    const open = (remoteMessage) => {
      if (remoteMessage) {
        resetBadgeCount();
        navigateTo({ notification: { data: remoteMessage.data } }).catch(logError);
      }
    };

    getInitialNotification(messaging).then(open).catch(logError);
    return onNotificationOpenedApp(messaging, open);
  }, []);

  return (
    // The gesture root, at the top of the tree exactly once. Sheets close with a
    // drag; without one root here every gesture outside a screen that mounted its
    // own was dead, and a nested root is an isolated tree of its own.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor} onBeforeLift={handleBeforeLift}>
          <NetworkProvider>
            <ThemeProvider>
              <ErrorBoundary onError={logError} FallbackComponent={FallBack}>
                {/* Inside the boundary, so a throw from a global service shows
                    the fallback screen rather than a blank app. */}
                <GlobalServices />
                <SafeAreaProvider>
                  <Navigation />
                  <Toast config={toastConfig} />
                  <ConfirmDialogHost />
                </SafeAreaProvider>
              </ErrorBoundary>
            </ThemeProvider>
          </NetworkProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
