import React, { useEffect } from "react";
import ErrorBoundary from "react-native-error-boundary";
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
    initializePerformanceMonitoring();
    allowTracking();
    initializeCrashlytics();
    TrackPlayerSetup();
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
    <ErrorBoundary onError={logError} FallbackComponent={FallBack}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Navigation />
          <Toast />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
