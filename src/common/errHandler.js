import crashlytics from "@react-native-firebase/crashlytics";

const errorHandler = (error) => {
  if (error instanceof Error) {
    crashlytics().recordError(error);
  }
};
export default errorHandler;
