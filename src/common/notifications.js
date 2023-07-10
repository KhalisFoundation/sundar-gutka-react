import notifee, {
  TriggerType,
  RepeatFrequency,
  EventType,
  AndroidImportance,
} from "@notifee/react-native";
import moment from "moment";
import constant from "./constant";

export const createReminder = async (notification, sound) => {
  try {
    const channelName =
      sound !== constant.DEFAULT.toLowerCase() ? sound.split(".")[0] : constant.SOUND.toLowerCase();
    const androidChannel = { chanelId: channelName };

    const currentTime = moment().utc().valueOf();
    let notificationTime = moment(notification.time, "h:mm A").utc().valueOf();
    if (notificationTime < currentTime) {
      notificationTime = moment(notification.time, "h:m A").add(1, "days");
    }
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Number(notificationTime),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    // Create notification
    await notifee.createTriggerNotification(
      {
        title: notification.title,
        body: notification.time,
        data: {
          id: notification.key.toString(),
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
    console.error(`Error creating reminder: ${error}`);
  }
};
export const resetBadgeCount = () => {
  notifee.setBadgeCount(0);
};

export const getScheduleNotifications = () => {
  notifee.getTriggerNotificationIds();
};

export const removeAllDeliveredNotifications = () => {
  resetBadgeCount();
  notifee.cancelDisplayedNotification();
};

export const cancelAllReminders = () => {
  resetBadgeCount();
  notifee.cancelAllNotifications();
};

export const updateReminders = async (remindersOn, sound, remindersList) => {
  cancelAllReminders();
  await notifee.createChannel({
    id: "sound",
    name: "Reminders default",
    sound: "default",
    description: "Alert notification reminders for chosen Bani",
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: "waheguru_soul",
    name: "Reminders waheguru soul",
    sound: "waheguru_soul",
    description: "Alert notification reminders for chosen Bani",
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: "wake_up_jap",
    name: "Reminders wake up jap",
    sound: "wake_up_jap",
    description: "Alert notification reminders for chosen Bani",
    importance: AndroidImportance.HIGH,
  });
  if (remindersOn) {
    const array = JSON.parse(remindersList);
    for (let i = 0; i < array.length; i += 1) {
      if (array[i].enabled) {
        createReminder(array[i], sound);
      }
    }
  }
};

export const checkPermissions = async (remindersOn) => {
  if (remindersOn) {
    await notifee.requestPermission();
  }
};

export const listenReminders = async () => {
  notifee.onForegroundEvent(({ type }) => {
    switch (type) {
      case EventType.DISMISSED:
        this.resetBadgeCount();
        break;
      case EventType.PRESS:
        this.resetBadgeCount();
        break;
      default:
        break;
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { pressAction } = detail;

    // Check if the user pressed the "Mark as read" action
    if (type === EventType.ACTION_PRESS && pressAction.id === "mark-as-read") {
      this.resetBadgeCount();
    }
  });
};
