import * as actions from "./actions";
import colors from "./colors";
import {
  FallBack,
  BaniLengthSelector,
  BaniList,
  CustomText,
  ListItemTitle,
  BottomNavigation,
  SafeArea,
  StatusBarComponent,
  ThemedSwitch,
} from "./components";
import orderedBani from "./components/BaniList/baniOrderHelper";
import constant from "./constant";
import useTheme, { useNetwork } from "./context";
import defaultBaniOrder from "./defaultBaniOrder";
import {
  allowTracking,
  trackReaderEvent,
  trackNavBar,
  trackSettingEvent,
  trackReminderEvent,
  trackAudioEvent,
  trackBaniOpen,
  trackBaniListen,
  trackBaniListenCompletion,
  trackBaniArtistDefault,
  trackTrackDownload,
  trackAudioLinkRequest,
  trackScrollProgress,
} from "./firebase/analytics";
import {
  isNetworkFailure,
  logError,
  logNetworkError,
  initializeCrashlytics,
  setCustomKey,
  logMessage,
} from "./firebase/crashlytics";
import {
  initializePerformanceMonitoring,
  startPerformanceTrace,
  stopTrace,
  resetTrace,
} from "./firebase/performance";
import baseFontSize, { validateBaniOrder } from "./helpers";
import useKeepAwake from "./hooks/keepAwake";
import useBackHandler from "./hooks/useBackHandler";
import useThemedStyles from "./hooks/useThemedStyles";
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
import { showToast, showErrorToast, showSuccessToast, showInfoToast } from "./toast";
import convertToUnicode from "./utils";

export {
  colors,
  constant,
  actions,
  STRINGS,
  isNetworkFailure,
  logError,
  logMessage,
  logNetworkError,
  initializeCrashlytics,
  initializePerformanceMonitoring,
  startPerformanceTrace,
  stopTrace,
  resetTrace,
  allowTracking,
  trackReaderEvent,
  trackNavBar,
  trackAudioEvent,
  trackReminderEvent,
  trackSettingEvent,
  updateReminders,
  checkPermissions,
  cancelAllReminders,
  FallBack,
  BaniLengthSelector,
  useKeepAwake,
  BaniList,
  CustomText,
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
  showToast,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  convertToUnicode,
  BottomNavigation,
  useTheme,
  useNetwork,
  useThemedStyles,
  ListItemTitle,
  useBackHandler,
  trackBaniOpen,
  trackBaniListen,
  trackBaniListenCompletion,
  trackBaniArtistDefault,
  trackTrackDownload,
  trackAudioLinkRequest,
  trackScrollProgress,
  ThemedSwitch,
};
