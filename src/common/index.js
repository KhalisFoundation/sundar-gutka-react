import constant from "./constant";
import colors from "./colors";
import * as actions from "./actions";
import STRINGS from "./localization";
import useScreenAnalytics from "./hooks/useScreenAnalytics";
import errorHandler from "./errHandler";
import {
  allowTracking,
  trackScreenView,
  trackReaderEvent,
  trackSettingEvent,
  trackReminderEvent,
} from "./analytics";
import { updateReminders, cancelAllReminders, checkPermissions } from "./notifications";
import * as actionConstants from "./actions/constant";
import { FallBack } from "./components";

export {
  colors,
  constant,
  actions,
  useScreenAnalytics,
  STRINGS,
  errorHandler,
  allowTracking,
  trackReaderEvent,
  trackScreenView,
  trackReminderEvent,
  trackSettingEvent,
  updateReminders,
  checkPermissions,
  cancelAllReminders,
  actionConstants,
  FallBack,
};
