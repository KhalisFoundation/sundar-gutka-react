import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import reducer from "./reducer"; // Ensure this points to your combined reducers

const persistConfig = { key: "root", storage: AsyncStorage, blacklist: ["navigation", "baniList"] };
const persistedReducer = persistReducer(persistConfig, reducer);

const configure = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
};

export default configure;
