import * as React from "react";
import { Provider } from "react-redux";
import ErrorBoundary from "react-native-error-boundary";
import notifee, { EventType } from "@notifee/react-native";
import { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import Navigation from "./src/navigation/navigation";
import createStore from "./src/common/store";
import { resetBadgeCount } from "./src/common/notifications";
import constant from "./src/common/constant";
import * as rootNavigation from "./src/common/rootNavigation";
import errorHandler from "./src/common/errHandler";
import FallBack from "./src/common/components/FallbackComponent";
import { getFcmToken, handleNotification } from "./src/common/firebase";

const { store } = createStore();
function App() {
  const navigateTo = (incoming) => {
    const { data } = incoming.notification;
    const params = { key: `Reader-${data.id}`, params: { item: data } };
    rootNavigation.navigate(constant.READER, params);
  };

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
  useEffect(() =>
    (function () {
      const initialNotification = notifee.getInitialNotification();
      getFcmToken();
      if (initialNotification) {
        resetBadgeCount();
      }

      notifee.onForegroundEvent(({ type, detail }) => {
        switch (type) {
          case EventType.PRESS:
            navigateTo(detail);
            resetBadgeCount();
            break;
          default:
            resetBadgeCount();
        }
      });
    })()
  );
  return (
    <ErrorBoundary onError={errorHandler} FallbackComponent={FallBack}>
      <Provider store={store}>
        <Navigation />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
