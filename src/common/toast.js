import Toast from "react-native-toast-message";

// Resting distance from the bottom of the screen, when nothing else is there.
const BASE_BOTTOM_OFFSET = 40;

// Space currently occupied by the floating audio player, so a toast stacks
// above it instead of landing on top of it. The player is rendered in the
// Reader and reports its own footprint; toasts fire from non-React code
// (globalDownloadManager), so this is module state rather than context.
let reservedBottomSpace = 0;

/**
 * Reserve vertical space at the bottom of the screen for a floating element.
 * @param {number} height - Space to keep clear, in dp. 0 releases it.
 */
export const setToastBottomReservation = (height) => {
  reservedBottomSpace = Number.isFinite(height) && height > 0 ? height : 0;
};

// 12dp of breathing room so the toast never sits flush against the player.
const bottomOffset = () =>
  BASE_BOTTOM_OFFSET + (reservedBottomSpace ? reservedBottomSpace + 12 : 0);

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
    bottomOffset: bottomOffset(),
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
    bottomOffset: bottomOffset(),
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
    bottomOffset: bottomOffset(),
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
    bottomOffset: bottomOffset(),
  });
};
