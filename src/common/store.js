import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import crashlyticsMiddleware from "./middleware/crashlytics";
import reducer from "./reducer";

// "auth" is blacklisted deliberately: redux-persist writes plain, unencrypted
// AsyncStorage, and the SSO session holds an email + SAML nameID. The session
// is rehydrated from the Keychain by useSsoSession instead, which also keeps
// status "unknown" until that read resolves.
//
// Every OTHER key is persisted, and that is the whole of how a setting is
// remembered — `isStatusBar` included. There is deliberately no `version` or
// `migrate` here: a migration rewrites a value the user already chose, and no
// setting in this store has ever needed that.
export const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  blacklist: ["navigation", "baniList", "audioManifest", "readerTapTick", "onboardingVisible", "auth"],
};
const persistedReducer = persistReducer(persistConfig, reducer);

const configure = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // immutableCheck scans the entire state tree on every action — very expensive on low-end
        // devices. Keep it enabled only during development where it adds real value.
        immutableCheck: __DEV__,
        serializableCheck: {
          // redux-persist dispatches non-serializable functions during persist/flush
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/FLUSH', 'persist/REGISTER'],
        },
      }).concat(crashlyticsMiddleware),
  });
  const persistor = persistStore(store);
  return { store, persistor };
};

export default configure;
