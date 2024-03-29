import notifee, {
  RepeatFrequency,
  TriggerType,
  EventType,
  AndroidImportance,
} from "@notifee/react-native";
import moment from "moment";

export default class NotificationsManager {
  REMINDERS_CHANNEL = "reminders-channel";

  static myInstance = null;

  static getInstance() {
    if (this.myInstance === null) {
      this.myInstance = new NotificationsManager();
    }
    return this.myInstance;
  }

  cancelAllReminders = () => {
    this.resetBadgeCount();
    notifee.cancelAllNotifications();
  };

  checkPermissions = async (remindersOn) => {
    if (remindersOn) {
      await notifee.requestPermission();
    }
  };

  getBadgeCount = async () => {
    await notifee.getBadgeCount();
  };

  listenReminders = async () => {
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

  async updateReminders(remindersOn, sound, remindersList) {
    this.resetBadgeCount();
    notifee.cancelAllNotifications();
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
          this.createReminder(array[i], sound);
        }
      }
    }
  }

  removeAllDeliveredNotifications = () => {
    this.resetBadgeCount();
    notifee.cancelDisplayedNotifications();
  };

  resetBadgeCount = () => {
    notifee.setBadgeCount(0);
  };

  getScheduledNotifications = () => {
    notifee.getTriggerNotificationIds();
    // .then((ids) => console.log("All trigger notifications: ", ids));
  };

  createReminder = async (reminder, sound) => {
    // Build a channel
    // this.checkPermissions();

    // .setSound(sound)
    // .setDescription("Alert notification reminders for chosen Bani");
    // Create the channel
    // firebase.notifications().android.createChannel(channel);
    // Build notification
    const currentTime = moment().utc().valueOf();
    let aTime = moment(reminder.time, "h:mm A").utc().valueOf();
    if (aTime < currentTime) {
      aTime = moment(reminder.time, "h:m A").add(1, "days");
    }
    let channel = "sound";
    if (sound !== "default") {
      channel = sound.split(".")[0];
    }
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Number(aTime),
      repeatFrequency: RepeatFrequency.DAILY,
    };
    await notifee.createTriggerNotification(
      {
        title: reminder.title,
        body: reminder.time,
        data: {
          key: "reminder.key",
          gurmukhi: reminder.gurmukhi,
          roman: reminder.translit,
        },
        android: {
          channelId: channel,
        },
        ios: {
          badgeCount: 1,
          sound,
        },
      },
      trigger
    );

    // const notification = new firebase.notifications.Notification()
    //   .setNotificationId(reminder.key.toString())
    //   .setTitle(reminder.title)
    //   .setBody(reminder.time)
    //   .setSound(channel.sound)
    //   .setData({
    //     key: reminder.key,
    //     gurmukhi: reminder.gurmukhi,
    //     roman: reminder.translit,
    //   });
    // notification.android
    //   .setChannelId(this.REMINDERS_CHANNEL)
    //   .android.setSmallIcon("ic_notification");
    // notification.ios.setBadge(1);

    // firebase.notifications().scheduleNotification(notification, {
    //   fireDate: aTime,
    //   repeatInterval: "day",
    // });
  };
}
