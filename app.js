import React, { useEffect } from "react";
import ErrorBoundary from "react-native-error-boundary";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "react-native-splash-screen";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import notifee, { EventType } from "@notifee/react-native";
import { PersistGate } from "redux-persist/integration/react";
import {
  createStore,
  logError,
  initializeCrashlytics,
  FallBack,
  resetBadgeCount,
  navigateTo,
  initializePerformanceMonitoring,
} from "@common";
import ThemeProvider from "./src/common/context/ThemeProvider";
import { allowTracking } from "./src/common/firebase/analytics";
import { TrackPlayerSetup } from "./src/common/TrackPlayerUtils";
import Navigation from "./src/navigation";

const { store, persistor } = createStore();
const App = () => {
  useEffect(() => {
    // Code to run on component mount
    SplashScreen.hide(); // Hide the splash screen once everything is loaded
  }, []); // The empty array causes this effect to only run on mount

  useEffect(() => {
    (async () => {
      await initializePerformanceMonitoring();
      await allowTracking();
      await initializeCrashlytics();
      await TrackPlayerSetup();
    })();
  }, []);

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      resetBadgeCount();
      if (type === EventType.PRESS) {
        navigateTo(detail);
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <ErrorBoundary onError={logError} FallbackComponent={FallBack}>
            <SafeAreaProvider>
              <Navigation />
              <Toast />
            </SafeAreaProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
