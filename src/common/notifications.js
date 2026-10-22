import { Platform, PermissionsAndroid } from "react-native";
import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from "@notifee/react-native";
import { FallBack } from "./components";
import constant from "./constant";
import { logError, logMessage } from "./firebase/crashlytics";
import STRINGS from "./localization";
import { showErrorToast } from "./toast";

// Utility function to check if BROADCAST_CLOSE_SYSTEM_DIALOGS permission is available
const checkBroadcastPermission = async () => {
  if (Platform.OS === "android") {
    try {
      // Use the permission constant if available, otherwise use the string directly
      const permission =
        PermissionsAndroid.PERMISSIONS?.BROADCAST_CLOSE_SYSTEM_DIALOGS ??
        "android.permission.BROADCAST_CLOSE_SYSTEM_DIALOGS";

      // Check if permission is defined before calling check
      if (!permission) {
        logMessage("checkBroadcastPermission: Permission string is null/undefined");
        return false;
      }

      const broadcastPermissionCheck = await PermissionsAndroid.check(permission);
      return broadcastPermissionCheck;
    } catch (error) {
      // Permission not available on this device/API level
      showErrorToast(STRINGS.PERMISSION_ERROR);
      logError(error);
      logMessage(STRINGS.PERMISSION_ERROR);
      return false;
    }
  }
  return true; // Not applicable on iOS
};

/**
 * Parse a time string like "h:m A" (e.g. "9:30 AM") into a future timestamp (ms).
 * Uses native Date instead of moment.js to avoid bundling that large library (~270 KB).
 */
const parseTimeString = (timeStr) => {
  const [timePart, meridiem] = timeStr.trim().split(" ");
  const [hoursRaw, minutes] = timePart.split(":").map(Number);
  let hours = hoursRaw % 12;
  if (meridiem && meridiem.toUpperCase() === "PM") hours += 12;
  const now = new Date();
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  return result.getTime();
};

export const createReminder = async (notification, sound) => {
  const channelName =
    sound !== constant.DEFAULT.toLowerCase() ? sound.split(".")[0] : constant.SOUND.toLowerCase();
  const androidChannel = {
    channelId: channelName,
    smallIcon: "ic_launcher_foreground",
    pressAction: {
      id: "default",
      launchActivity: "default", // This should match your configured activity
      mainComponent: "default", // Ensure your activity is correctly referenced
    },
  };

  const currentTime = Date.now();
  let notificationTime = parseTimeString(notification.time);
  if (notificationTime < currentTime) {
    notificationTime += 24 * 60 * 60 * 1000; // add one day in milliseconds
  }
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: notificationTime,
    repeatFrequency: RepeatFrequency.DAILY,
  };

  try {
    // Create notification
    await notifee.createTriggerNotification(
      {
        title: notification.title,
        body: notification.time,
        data: {
          id: notification.id.toString(),
          gurmukhi: notification.gurmukhi,
          translit: String(notification.translit) || "",
        },
        android: androidChannel,
        ios: {
          badgeCount: 1,
          sound,
        },
      },
      trigger
    );
  } catch (error) {
    logError(error);
    logMessage("createReminder: Failed to create reminder");
    FallBack();
  }
};

export const resetBadgeCount = async () => {
  await notifee.setBadgeCount(0);
};

// NET-04: Return the scheduled notification IDs so callers can use them
export const getScheduleNotifications = async () => {
  return notifee.getTriggerNotificationIds();
};

export const removeAllDeliveredNotifications = async () => {
  resetBadgeCount();
  await notifee.cancelDisplayedNotification();
};

export const cancelAllReminders = async () => {
  resetBadgeCount();
  await notifee.cancelAllNotifications();
};

export const updateReminders = async (remindersOn, sound, remindersList) => {
  await cancelAllReminders();
  const channels = [
    {
      id: constant.SOUND,
      name: constant.REMINDERS_DEFAULT,
      sound: constant.DEFAULT.toLowerCase(),
    },
    {
      id: constant.WAHEGURU_SOUL,
      name: constant.REMINDERS_WAHEGURU_SOUL,
      sound: constant.WAHEGURU_SOUL,
    },
    {
      id: constant.WAKE_UP_JAP,
      name: constant.REMINDERS_WAKE_UP,
      sound: constant.WAKE_UP_JAP,
    },
  ];

  const channelCreationPromises = channels.map((channel) =>
    notifee.createChannel({
      id: channel.id,
      name: channel.name,
      sound: channel.sound,
      description: constant.ALERT_DESCRIPTION,
      importance: AndroidImportance.HIGH,
    })
  );

  await Promise.all(channelCreationPromises);

  if (remindersOn) {
    const array = JSON.parse(remindersList);
    const reminders = array.filter((item) => item.enabled); // Filter only enabled reminders
    const reminderPromises = reminders.map((reminder) => createReminder(reminder, sound));

    await Promise.all(reminderPromises);
  }
};

export const checkPermissions = async () => {
  // Check if broadcast permission is available (for older Android versions)
  const hasBroadcastPermission = await checkBroadcastPermission();

  const settings = await notifee.requestPermission();
  const isAllowed = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

  // Return false if we don't have broadcast permission on Android
  if (Platform.OS === "android" && !hasBroadcastPermission) {
    logMessage("checkPermissions: BROADCAST_CLOSE_SYSTEM_DIALOGS permission not available");
  }

  return isAllowed;
};

// FEAT-04: Use ic_launcher_foreground (not background_splash) for the correct Android notification icon
export const displayNotification = async () => {
  await notifee.displayNotification({
    title: "Test Notification",
    body: "This is a test notification.",
    android: { channelId: constant.SOUND, smallIcon: "ic_launcher_foreground" },
  });
};

// While the permission prompt is on screen. The system dialog takes focus from
// the app (AppState goes "inactive" on iOS, "background" on Android), which is
// indistinguishable from the user leaving; usePauseAudioOnExit reads this so
// the prompt raised by a track's first download does not pause that track.
// Capped, because on Android 13+ the request below may never settle.
const PERMISSION_PROMPT_MAX_MS = 10000;
let permissionPromptOpenUntil = 0;

/** True while the notification permission prompt may be on screen. */
export const isPermissionPromptOpen = () => Date.now() < permissionPromptOpenUntil;

// Explicitly prompt for notification permission (Android 13+ POST_NOTIFICATIONS /
// iOS alert). Used before the first download so the foreground-service download
// notification is actually visible instead of silently denied. Callers bound it
// with a deadline: on Android 13+ notifee's prompt may never resolve when the
// permission is already granted (invertase/notifee#609).
export const requestNotificationPermission = async () => {
  permissionPromptOpenUntil = Date.now() + PERMISSION_PROMPT_MAX_MS;
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (_) {
    return false;
  } finally {
    permissionPromptOpenUntil = 0;
  }
};
