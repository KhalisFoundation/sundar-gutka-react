import constant from "./constant";
import colors from "./colors";
import * as actions from "./actions";
import STRINGS from "./localization";
import useScreenAnalytics from "./hooks/useScreenAnalytics";
import { logError, initializeCrashlytics, setCustomKey, logMessage } from "./crashlytics";
import {
  allowTracking,
  trackScreenView,
  trackReaderEvent,
  trackSettingEvent,
  trackReminderEvent,
} from "./analytics";
import {
  updateReminders,
  cancelAllReminders,
  checkPermissions,
  resetBadgeCount,
} from "./notifications";
import { FallBack, BaniLengthSelector, BaniList } from "./components";
import useKeepAwake from "./hooks/keepAwake";
import baseFontSize from "./helpers";
import { navigationRef, navigate } from "./rootNavigation";
import orderedBani from "./components/BaniList/baniOrderHelper";
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
  navigate,
  navigationRef,
  resetBadgeCount,
  createStore,
  orderedBani,
  setCustomKey,
};
