import crashlytics from "@react-native-firebase/crashlytics";

const errorHandler = (error) => {
  crashlytics().recordError(error);
};
export default errorHandler;
