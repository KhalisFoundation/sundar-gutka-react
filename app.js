import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ErrorBoundary from "react-native-error-boundary";
import notifee, { EventType } from "@notifee/react-native";
import SplashScreen from "react-native-splash-screen";
import {
  createStore,
  logError,
  initializeCrashlytics,
  FallBack,
  resetBadgeCount,
  navigateTo,
} from "@common";
import Navigation from "./src/navigation";
import { allowTracking } from "./src/common/firebase/analytics";

const { store, persistor } = createStore();
const App = () => {
  useEffect(() => {
    // Code to run on component mount
    SplashScreen.hide(); // Hide the splash screen once everything is loaded
  }, []); // The empty array causes this effect to only run on mount

  useEffect(() => {
    allowTracking();
    initializeCrashlytics();
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
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
