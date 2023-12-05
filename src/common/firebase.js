import messaging from "@react-native-firebase/messaging";
import { Alert } from "react-native";

export const getFcmToken = async () => {
  const fcmToken = await messaging().getToken();
  if (fcmToken) {
    console.log("Your Firebase token is", fcmToken);
    return;
  }
  console.log("Failed to get the token");
};
export const handleNotification = (title, body) => {
  Alert.alert(title, body, [
    {
      text: "OK",
      onPress: () => console.log("OK Pressed"),
    },
  ]);
};
