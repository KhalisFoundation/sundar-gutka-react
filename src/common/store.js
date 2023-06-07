import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "reduxjs-toolkit-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import reducer from "./reducer";

const persistConfig = { key: "root", storage: AsyncStorage, backlist: ["navigation"] };
const persistedReducer = persistReducer(persistConfig, reducer);

export default () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
};
