import messaging from "@react-native-firebase/messaging";
import { Alert } from "react-native";

export const getFcmToken = async () => {
  const fcmToken = await messaging().getToken();
  if (fcmToken) {
    return fcmToken;
  }
};
export const handleNotification = (title, body) => {
  Alert.alert(title, body, [
    {
      text: "OK",
      onPress: () => console.log("OK Pressed"),
    },
  ]);
};
