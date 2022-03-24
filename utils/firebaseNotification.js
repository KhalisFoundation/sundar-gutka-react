import messaging from '@react-native-firebase/messaging'
import { Alert } from 'react-native';


export default class FirebaseNotification{

async checkPermission(){
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      this.getFcmToken() 
      console.log('Authorization status:', authStatus);
    }
}

async getFcmToken(){
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
     console.log("Your Firebase Token is:", fcmToken);
    } else {
     console.log("Failed", "No token received");
    }
  }

  foregroundMessage(){
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log("Foreground is running")
        this.handleNotificationEvent(remoteMessage.notification.title,remoteMessage.notification.body)
      });
      return unsubscribe;
  }

  backgroundMessageHandler(){
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log("Background is running")
      this.handleNotificationEvent(remoteMessage.notification.title,remoteMessage.notification.body)
      });
  }

  handleNotification(){
      // Notification opened from background
    this.notificationOpenedListener = messaging()
      .onNotificationOpenedApp(async notificationOpen => {
        this.handleNotificationEvent(notificationOpen.notification.title,notificationOpen.notification.body);
      });

    //Notification opened from closed state
    messaging()
      .getInitialNotification()
      .then(async notificationOpen => {
        if (notificationOpen) {
          // App was opened by a notification
          console.log("Opend from closed state")
          this.handleNotificationEvent(notificationOpen.notification.title,notificationOpen.notification.body);
        }
      });
  }
  handleNotificationEvent(title,body){
console.log("Notification Get Open")
Alert.alert(
  title,
  body,
  [
    { text: "OK", onPress: () => console.log("OK Pressed") }
  ]
);
//this.removeAllDeliveredNotifications();
  }
  // removeAllDeliveredNotifications() {
  //   firebase.notifications().removeAllDeliveredNotifications();
  // }
}
