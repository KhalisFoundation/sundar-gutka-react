import firebase from "react-native-firebase";
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

  checkPermissions(remindersOn) {
    if (remindersOn) {
      firebase
        .messaging()
        .hasPermission()
        .then(enabled => {
          if (!enabled) {
            // user doesn't have permission
            firebase
              .messaging()
              .requestPermission()
              .then(() => {
                // User has authorized
              })
              .catch(error => {
                // User has rejected permissions
                alert(
                  "Please enable Notifications for Sundar Gutka in OS Settings to use the Reminders feature."
                );
              });
          }
        });
    }
  }

  createRemindersChannel() {
    // Build a channel
    const channel = new firebase.notifications.Android.Channel(
      this.REMINDERS_CHANNEL,
      "Reminders Channel",
      firebase.notifications.Android.Importance.Max
    ).setDescription("Local notification reminders channel");

    // Create the channel
    firebase.notifications().android.createChannel(channel);
  }

  updateReminders(remindersOn, remindersList) {
    firebase.notifications().cancelAllNotifications();
    if (remindersOn) {
      let array = JSON.parse(remindersList);
      for (var i = 0; i < array.length; i++) {
        if (array[i].enabled) {
          this.createReminder(array[i]);
        }
      }
    }
  }

  removeAllDeliveredNotifications() {
    firebase.notifications().removeAllDeliveredNotifications();
  }

  getScheduledNotifications() {
    firebase.notifications().getScheduledNotifications();
  }

  createReminder(reminder) {
    // Build notification
    const notification = new firebase.notifications.Notification()
      .setNotificationId(reminder.key.toString())
      .setTitle(reminder.title)
      .setBody(reminder.time)
      .setData({
        key: reminder.key,
        gurmukhi: reminder.gurmukhi,
        roman: reminder.roman
      });

    notification.android
      .setChannelId(this.REMINDERS_CHANNEL)
      .android.setSmallIcon("ic_notification");

    notification.ios.setBadge(1);

    let aTime = moment(reminder.time, "h:mm A")
      .utc()
      .valueOf();

    firebase.notifications().scheduleNotification(notification, {
      fireDate: aTime,
      repeatInterval: "day"
    });
  }
}
