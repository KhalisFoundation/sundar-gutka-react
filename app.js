import * as React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "reduxjs-toolkit-persist/integration/react";
import ErrorBoundary from "react-native-error-boundary";

import { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import Navigation from "./src/navigation/navigation";
import createStore from "./src/common/store";
import errorHandler from "./src/common/errHandler";
import FallBack from "./src/common/components/FallbackComponent";
import { handleNotification } from "./src/common/firebase";

const { store, persistor } = createStore();
function App() {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const { title, body } = remoteMessage.notification;
      handleNotification(title, body);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      const { title, body } = remoteMessage.notification;
      handleNotification(title, body);
    });

    return unsubscribe;
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
}

export default App;
