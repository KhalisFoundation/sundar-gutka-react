import messaging from '@react-native-firebase/messaging'
import {
  Alert
} from 'react-native';
export default class FirebaseNotification {

  async checkPermission() {
    const authStatus = await messaging().requestPermission();

    const { AUTHORIZED, PROVISIONAL } = messaging.AuthorizationStatus;
    const isAuthorized = authStatus === AUTHORIZED;
    const isProvisional = authStatus === PROVISIONAL;

    const enabled = isAuthorized || isProvisional;
    if (enabled) {
      this.getFcmToken()
      console.log('Authorization status:', authStatus);
    }
  }

  async getFcmToken() {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log("Your Firebase Token is:", fcmToken);
    } else {
      console.log("Failed", "No token received");
    }
  }

  foregroundMessage() {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log("Foreground is running")
      const { title, body } = remoteMessage.notification;
      this.handleNotificationEvent(title, body)
    });
    return unsubscribe;
  }

  backgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log("Background is running")
      const { title, body } = remoteMessage.notification;
      this.handleNotificationEvent(title, body)
    });
  }

  handleNotification() {
    // Notification opened from background
    this.notificationOpenedListener = messaging()
      .onNotificationOpenedApp(async notificationOpen => {
        const { title, body } = notificationOpen.notification;
        this.handleNotificationEvent(title, body);
      });

    //Notification opened from closed state
    messaging()
      .getInitialNotification()
      .then(async notificationOpen => {
        if (notificationOpen) {
          // App was opened by a notification
          console.log("Opend from closed state")
          const { title, body } = notificationOpen.notification;
          this.handleNotificationEvent(title, body);
        }
      });
  }
  handleNotificationEvent(title, body) {
    console.log("Notification Get Open")
    Alert.alert(
      title,
      body,
      [{
        text: "OK",
        onPress: () => console.log("OK Pressed")
      }]
    );
  }
}
