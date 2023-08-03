import notifee, {
  TriggerType,
  RepeatFrequency,
  EventType,
  AndroidImportance,
  AuthorizationStatus,
} from "@notifee/react-native";
import moment from "moment";
import constant from "./constant";

export const createReminder = async (notification, sound) => {
  try {
    const channelName =
      sound !== constant.DEFAULT.toLowerCase() ? sound.split(".")[0] : constant.SOUND.toLowerCase();
    const androidChannel = { channelId: channelName.toString() };

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
    id: constant.SOUND,
    name: constant.REMINDERS_DEFAULT,
    sound: constant.DEFAULT.toLowerCase(),
    description: constant.ALERT_DESCRIPTION,
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: constant.WAHEGURU_SOUL,
    name: constant.REMINDERS_WAHEGURU_SOUL,
    sound: constant.WAHEGURU_SOUL,
    description: constant.ALERT_DESCRIPTION,
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: constant.WAKE_UP_JAP,
    name: constant.REMINDERS_WAKE_UP,
    sound: constant.WAKE_UP_JAP,
    description: constant.ALERT_DESCRIPTION,
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
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log("Permission settings:", settings);
    }
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
    if (type === EventType.ACTION_PRESS && pressAction.id === constant.MARK_AS_READ) {
      this.resetBadgeCount();
    }
  });
};
