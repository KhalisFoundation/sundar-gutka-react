import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import crashlyticsMiddleware from "./middleware/crashlytics";
import reducer from "./reducer";

const persistConfig = { key: "root", storage: AsyncStorage, blacklist: ["navigation", "baniList"] };
const persistedReducer = persistReducer(persistConfig, reducer);

const configure = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(crashlyticsMiddleware),
  });
  const persistor = persistStore(store);
  return { store, persistor };
};

export default configure;
