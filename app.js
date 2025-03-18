import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "reduxjs-toolkit-persist/integration/react";
import ErrorBoundary from "react-native-error-boundary";
import { createStore, logError, initializeCrashlytics, FallBack } from "@common";
import Navigation from "./src/navigation";
import { allowTracking } from "./src/common/analytics";

const { store, persistor } = createStore();
const App = () => {
  useEffect(() => {
    allowTracking();
    initializeCrashlytics();
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
