import Toast from "react-native-toast-message";

/**
 * Show a toast message to the user
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info' (default: 'info')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export const showToast = (message, type = "info", duration = 3000) => {
  Toast.show({
    type,
    text1: message,
    position: "bottom",
    visibilityTime: duration,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};

/**
 * Show an error toast message
 * @param {string} message - The error message to display
 */
export const showErrorToast = (message) => {
  Toast.show({
    type: "error",
    text1: message,
    position: "bottom",
    visibilityTime: 3500,
    autoHide: true,
    bottomOffset: 40,
  });
};

/**
 * Show a success toast message
 * @param {string} message - The success message to display
 */
export const showSuccessToast = (message) => {
  Toast.show({
    type: "success",
    text1: message,
    position: "bottom",
    visibilityTime: 3000,
    autoHide: true,
    bottomOffset: 40,
  });
};

/**
 * Show an info toast message
 * @param {string} message - The info message to display
 */
export const showInfoToast = (message) => {
  Toast.show({
    type: "info",
    text1: message,
    position: "bottom",
    visibilityTime: 3000,
    autoHide: true,
    bottomOffset: 40,
  });
};
