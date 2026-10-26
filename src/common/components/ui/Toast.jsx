import React from "react";
import { View } from "react-native";
import { useReaderScopedTheme } from "@theme/reader";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import { useReaderFocused } from "../../readerFocus";
import Text from "./Text";

// The toast surface. Presentational only — `react-native-toast-message` owns
// showing, positioning and dismissing it (see `common/toastConfig.jsx`), which
// matters because toasts also fire from non-React code such as the download
// manager.
//
// ── The design ─────────────────────────────────────────────────────────────
// A quiet elevated card. Nothing else: no coloured edge bar (the stock look
// every toast library ships), and no status dot. The message states the
// outcome, so colour was carrying nothing the text did not (WCAG 1.4.1), and
// one plain card reads as considered where a decorated one reads as generic.
//
// The message is never truncated and has no fixed width or height. It wraps to
// as many lines as the translation needs, which is the whole reason a toast
// breaks in `hi`/`pa` otherwise.

const Toast = ({ message = undefined, testID = undefined }) => {
  // Sizing and depth always come from the app tokens — a toast is the same
  // shape everywhere. Only its COLOURS follow the Reader, because over a
  // parchment page an app-blue card is the one thing on screen that does not
  // belong. Off the Reader `c` is the app's own colour layer, unchanged.
  const { layout, radii, elevation } = useTokens();
  const { theme } = useReaderScopedTheme("audio", useReaderFocused());
  const { c } = theme;

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        {
          // Capped, not fixed: narrow on a phone, sensible on a tablet.
          width: "100%",
          maxWidth: layout.dialog.maxWidth,
          marginHorizontal: layout.toast.marginHorizontal,
          minHeight: layout.toast.minHeight,
          paddingHorizontal: layout.toast.paddingHorizontal,
          paddingVertical: layout.toast.paddingVertical,
          borderRadius: radii.lg,
          backgroundColor: c.surfaceElevated,
          borderWidth: layout.borderWidth.hairline,
          borderColor: c.border,
          flexDirection: "row",
          alignItems: "center",
        },
        elevation.overlay,
      ]}
    >
      {/* A resolved value, not the role name: Text reads the APP tokens, so
          `color="textPrimary"` would ignore the scope the card above uses. */}
      <Text variant="bodySmall" color={c.textPrimary} style={{ flex: 1 }}>
        {message}
      </Text>
    </View>
  );
};

Toast.propTypes = {
  message: PropTypes.string,
  testID: PropTypes.string,
};

export default Toast;
