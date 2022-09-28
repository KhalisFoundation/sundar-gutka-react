import { createStore } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from '@react-native-async-storage/async-storage';

import rootReducer from "../reducers/reducers";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  blacklist: ['navigation', 'mergedBaniData', 'currentShabad', 'scrollIndex'] // content will not be persisted
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default () => {
  let store = createStore(persistedReducer);
  let persistor = persistStore(store);
  return { store, persistor };
};
