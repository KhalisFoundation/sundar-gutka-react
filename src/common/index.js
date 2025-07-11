import constant from "./constant";
import colors from "./colors";
import * as actions from "./actions";
import STRINGS from "./localization";
import useScreenAnalytics from "./hooks/useScreenAnalytics";
import { logError, initializeCrashlytics, setCustomKey, logMessage } from "./firebase/crashlytics";
import {
  allowTracking,
  trackScreenView,
  trackReaderEvent,
  trackSettingEvent,
  trackReminderEvent,
} from "./firebase/analytics";
import {
  initializePerformanceMonitoring,
  startPerformanceTrace,
  stopTrace,
  resetTrace,
} from "./firebase/performance";
import {
  updateReminders,
  cancelAllReminders,
  checkPermissions,
  resetBadgeCount,
} from "./notifications";
import { FallBack, BaniLengthSelector, BaniList } from "./components";
import useKeepAwake from "./hooks/keepAwake";
import baseFontSize, { validateBaniOrder } from "./helpers";
import { navigate, navigateTo, navigationRef } from "./rootNavigation";
import orderedBani from "./components/BaniList/baniOrderHelper";
import defaultBaniOrder from "./defaultBaniOrder";
import createStore from "./store";
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
};
