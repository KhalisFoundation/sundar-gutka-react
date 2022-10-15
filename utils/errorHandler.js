import crashlytics from "@react-native-firebase/crashlytics";

export default function errorHandler(error) {
  console.error(error);
  crashlytics().recordError(error);
}
