import * as React from "react";
import { Provider } from "react-redux";

import notifee, { EventType } from "@notifee/react-native";
import { useEffect } from "react";
import Navigation from "./src/navigation/navigation";
import createStore from "./src/common/store";
import { resetBadgeCount } from "./src/common/notifications";
import constant from "./src/common/constant";
import * as rootNavigation from "./src/common/rootNavigation";

const { store } = createStore();

function App() {
  const navigateTo = (incoming) => {
    const { data } = incoming.notification;
    const params = { key: `Reader-${data.id}`, params: { item: data } };
    rootNavigation.navigate(constant.READER, params);
  };

  useEffect(() =>
    (function () {
      const initialNotification = notifee.getInitialNotification();
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
    <Provider store={store}>
      <Navigation />
    </Provider>
  );
}

export default App;
