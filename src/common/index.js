import * as actions from "./actions";
import colors from "./colors";
import { FallBack, BaniLengthSelector, BaniList } from "./components";
import orderedBani from "./components/BaniList/baniOrderHelper";
import SafeArea from "./components/SafeArea";
import StatusBarComponent from "./components/StatusBar";
import constant from "./constant";
import defaultBaniOrder from "./defaultBaniOrder";
import {
  allowTracking,
  trackScreenView,
  trackReaderEvent,
  trackSettingEvent,
  trackReminderEvent,
} from "./firebase/analytics";
import { logError, initializeCrashlytics, setCustomKey, logMessage } from "./firebase/crashlytics";
import {
  initializePerformanceMonitoring,
  startPerformanceTrace,
  stopTrace,
  resetTrace,
} from "./firebase/performance";
import baseFontSize, { validateBaniOrder } from "./helpers";
import useKeepAwake from "./hooks/keepAwake";
import useScreenAnalytics from "./hooks/useScreenAnalytics";
import STRINGS from "./localization";
import {
  updateReminders,
  cancelAllReminders,
  checkPermissions,
  resetBadgeCount,
} from "./notifications";
import {
  ensureDbExists,
  checkForBaniDBUpdate,
  REMOTE_DB_URL,
  writeRemoteMD5Hash,
  LOCAL_DB_PATH,
  listDocumentDirectory,
  revertMD5Hash,
  getCurrentDBMD5Hash,
} from "./rnfs";
import { navigate, navigateTo, navigationRef } from "./rootNavigation";
import createStore from "./store";

export {
  colors,
  constant,
  actions,
  useScreenAnalytics,
  STRINGS,
  logError,
  logMessage,
  initializeCrashlytics,
  allowTracking,
  trackReaderEvent,
  trackScreenView,
  trackReminderEvent,
  trackSettingEvent,
  updateReminders,
  checkPermissions,
  cancelAllReminders,
  FallBack,
  BaniLengthSelector,
  useKeepAwake,
  BaniList,
  baseFontSize,
  resetBadgeCount,
  createStore,
  orderedBani,
  setCustomKey,
  navigateTo,
  navigate,
  navigationRef,
  defaultBaniOrder,
  validateBaniOrder,
  initializePerformanceMonitoring,
  startPerformanceTrace,
  stopTrace,
  resetTrace,
  ensureDbExists,
  checkForBaniDBUpdate,
  REMOTE_DB_URL,
  writeRemoteMD5Hash,
  LOCAL_DB_PATH,
  listDocumentDirectory,
  revertMD5Hash,
  getCurrentDBMD5Hash,
  StatusBarComponent,
  SafeArea,
};
