import messaging from "@react-native-firebase/messaging";
import { Alert } from "react-native";

const getFcmToken = async () => {
  await messaging().getToken();
};

export const handleNotification = (title, body) => {
  Alert.alert(title, body, [
    {
      text: "OK",
      onPress: () => {},
    },
  ]);
};

export { getFcmToken };
