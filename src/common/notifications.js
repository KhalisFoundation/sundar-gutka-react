import { Platform, PermissionsAndroid } from "react-native";
import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from "@notifee/react-native";
import moment from "moment";
import { FallBack } from "./components";
import constant from "./constant";
import { logError, logMessage } from "./firebase/crashlytics";
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
      showErrorToast("checkBroadcastPermission: Permission check failed");
      logError(error);
      logMessage("checkBroadcastPermission: Permission check failed");
      return false;
    }
  }
  return true; // Not applicable on iOS
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

  const currentTime = moment().valueOf();
  let notificationTime = moment(notification.time, "h:m A").valueOf();
  if (notificationTime < currentTime) {
    notificationTime = moment(notification.time, "h:m A").add(1, "days").valueOf();
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

export const getScheduleNotifications = async () => {
  await notifee.getTriggerNotificationIds();
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

export const displayNotification = async () => {
  await notifee.displayNotification({
    title: "Test Notification",
    body: "This is a test notification.",
    android: { channelId: constant.SOUND, smallIcon: "background_splash" },
  });
};
