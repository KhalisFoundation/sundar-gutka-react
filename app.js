import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "reduxjs-toolkit-persist/integration/react";
import ErrorBoundary from "react-native-error-boundary";
import { createStore, errorHandler, FallBack } from "@common";
import Navigation from "./src/navigation";
import { allowTracking } from "./src/common/analytics";

const { store, persistor } = createStore();
const App = () => {
  useEffect(() => {
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
