import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

// How tall the on-screen keyboard currently is, or 0 when it is closed.
//
// Exists because `KeyboardAvoidingView` cannot be trusted inside a `Modal`, and
// every sheet in this app is one. On Android a Modal is a Dialog with its OWN
// window, and that window's `windowSoftInputMode` cannot be set from JS — so
// the Activity's `adjustResize` (see AndroidManifest) simply does not apply
// inside it. The bottom sheet stayed pinned to the bottom of the screen and the
// keyboard covered whatever the user was typing.
//
// Reading the height ourselves and lifting the sheet by it works the same way
// on both platforms and adds no native dependency.
//
// The event names differ deliberately:
//   iOS     `keyboardWillShow` fires BEFORE the animation, so the sheet rises
//           with the keyboard instead of jumping after it.
//   Android `will*` events are not emitted at all, so it has to be `did*`.
//
// Nothing here double-applies: the Activity is `adjustResize`, but as above a
// Modal's window is not, so the OS never moves the sheet on its own.
const useKeyboardHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) =>
      setHeight(e?.endCoordinates?.height ?? 0)
    );
    const onHide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return height;
};

export default useKeyboardHeight;
