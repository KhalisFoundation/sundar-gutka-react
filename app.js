import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ErrorBoundary from "react-native-error-boundary";
import crashlytics from "@react-native-firebase/crashlytics";
import { createStore, errorHandler, FallBack } from "@common";
import Navigation from "./src/navigation";
import { allowTracking } from "./src/common/analytics";

const { store, persistor } = createStore();
const App = () => {
  const enableCrashlytics = async () => {
    await crashlytics().setCrashlyticsCollectionEnabled(true);
  };
  useEffect(() => {
    enableCrashlytics();
    allowTracking();
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
