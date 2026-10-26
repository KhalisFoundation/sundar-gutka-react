import React from "react";
import Toast from "./components/ui/Toast";

/**
 * Custom toast renderer for react-native-toast-message.
 *
 * The library owns showing, positioning and dismissing; this only supplies the
 * surface. All three levels render the same plain card — see
 * `components/ui/Toast.jsx` for why there is no status colour.
 *
 * `text1` is passed through without `numberOfLines`, so a long message such as
 * "Network error, Audio features temporarily unavailable" wraps instead of
 * truncating — in any of the six shipped languages.
 */
const renderToast = (props) => <Toast message={props.text1} />;

const toastConfig = {
  error: renderToast,
  success: renderToast,
  info: renderToast,
};

export default toastConfig;
