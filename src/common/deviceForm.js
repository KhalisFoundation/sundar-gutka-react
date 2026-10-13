import { NativeModules, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Whether this phone folds, and the layout that follows from it.
//
// Everything here is decided once, at import, from the hardware. A device that
// does not fold gets back exactly the values and hooks it had before any of
// this existed — every foldable adjustment in the app goes through this file,
// so that is the one place that promise has to hold.
//
//   • Android asks DeviceFormModule, which checks for a hinge sensor — the
//     test Android recommends. Phones older than Android 11 have no hinge
//     sensor and read as not foldable.
//   • iOS has no hinge API, so the foldable is recognised by its hardware model
//     identifier. It is read from the same native constant
//     react-native-device-info's `getDeviceId()` returns (the library itself
//     throws at import wherever its native module is absent, which is every
//     test). A simulator reports the model it is simulating.

/**
 * Model identifiers of the iPhones that fold. iPhone Duo is iPhone19,4.
 * A future foldable is added here and nowhere else.
 */
export const FOLDABLE_IOS_MODELS = ["iPhone19,4"];

export const readIsFoldable = () => {
  if (Platform.OS === "android") return NativeModules.DeviceForm?.isFoldable === true;
  if (Platform.OS === "ios") {
    return FOLDABLE_IOS_MODELS.includes(NativeModules.RNDeviceInfo?.deviceId);
  }
  return false;
};

export const IS_FOLDABLE = readIsFoldable();

// How much of a fixed top band a foldable keeps. Re-exported so the headers
// take both halves from here.
export { default as foldableTopSpace } from "./foldableTopSpace";

const useInsetTop = () => useSafeAreaInsets().top;
const useNoInset = () => null;

/** The inset hook for a device that does or does not fold. */
export const insetTopHookFor = (isFoldable) => (isFoldable ? useInsetTop : useNoInset);

/**
 * A foldable's top safe-area inset, or null on every other device — the signal
 * to keep the fixed spacing untouched. Pass it through `foldableTopSpace`.
 *
 * Chosen once for the life of the process, since IS_FOLDABLE cannot change —
 * which keeps the hook order stable, and means a device that does not fold
 * never even subscribes to the insets.
 *
 * @type {() => number | null}
 */
export const useFoldableInsetTop = insetTopHookFor(IS_FOLDABLE);
