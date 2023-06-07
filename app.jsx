import * as React from "react";
import { Provider } from "react-redux";

import Navigation from "./src/navigation/navigation";
import createStore from "./src/common/store";

const { store } = createStore();

function App() {
  return (
    <Provider store={store}>
      <Navigation />
    </Provider>
  );
}

export default App;
