import crashlytics from "@react-native-firebase/crashlytics";

const errorHandler = (error) => {
  let newError = error;
  if (!(error instanceof Error)) {
    // If 'error' is not an instance of Error, create a new Error instance
    // This could happen if a string or object is thrown instead of an Error object
    newError = new Error(error.toString());
  }
  crashlytics().recordError(newError);
};
export default errorHandler;
