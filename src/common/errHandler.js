import crashlytics from "@react-native-firebase/crashlytics";

const errorHandler = (error, context = "") => {
  if (error instanceof Error) {
    const errorContext = {
      message: error.message || "Unhandled exception",
      stack: error.stack,
      context, // additional information about the error context
    };
    crashlytics().recordError(errorContext);
  } else {
    crashlytics().recordError(new Error(`Non-Error exception: ${error}`));
  }
};
export default errorHandler;
