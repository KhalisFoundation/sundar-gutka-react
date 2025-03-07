import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ErrorBoundary from "react-native-error-boundary";
import notifee, { EventType } from "@notifee/react-native";
import crashlytics from "@react-native-firebase/crashlytics";
import SplashScreen from "react-native-splash-screen";
import { createStore, errorHandler, FallBack, resetBadgeCount, navigateTo } from "@common";
import Navigation from "./src/navigation";
import { allowTracking } from "./src/common/analytics";

const { store, persistor } = createStore();
const App = () => {
  useEffect(() => {
    // Code to run on component mount
    SplashScreen.hide(); // Hide the splash screen once everything is loaded
  }, []); // The empty array causes this effect to only run on mount

  const enableCrashlytics = async () => {
    await crashlytics().setCrashlyticsCollectionEnabled(true);
  };
  useEffect(() => {
    enableCrashlytics();
    allowTracking();
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
    <ErrorBoundary onError={errorHandler} FallbackComponent={FallBack}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Navigation />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
