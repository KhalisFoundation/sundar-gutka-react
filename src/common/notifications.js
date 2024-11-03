import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from "@notifee/react-native";
import moment from "moment";
import FallBack from "./components/FallbackComponent";
import constant from "./constant";
import errorHandler from "./errHandler";

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
    console.log(error);
    errorHandler(error);
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
  const settings = await notifee.requestPermission();
  const isAllowed = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  return isAllowed;
};

export const displayNotification = async () => {
  await notifee.displayNotification({
    title: "Test Notification",
    body: "This is a test notification.",
    android: { channelId: constant.SOUND, smallIcon: "background_splash" },
  });
};
