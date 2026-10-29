import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import Button from "./Button";
import Overlay from "./Overlay";
import Text from "./Text";

// One confirm dialog, for every destructive or blocking question the app asks —
// including "delete this download".
//
// ── How the action row survives six languages ──────────────────────────────
// The buttons sit in a `flexWrap` row where each one grows. When two labels fit
// side by side they stay on one line; when a translation makes them too wide to
// share a line, they wrap onto separate full-width lines automatically. No
// measuring, no `Platform` branch, and no truncation — which is what usually
// happens instead, leaving a destructive action labelled "Delet…".
//
// The confirm button is placed LAST. That is the platform-independent
// convention users scan for, and putting a destructive action anywhere else
// invites mis-taps.

const Dialog = ({
  visible,
  title,
  message = undefined,
  confirmLabel,
  cancelLabel = undefined,
  onConfirm,
  onCancel,
  destructive = false,
  testID = undefined,
}) => {
  const { c, space, layout, radii, elevation } = useTokens();
  const { height } = useWindowDimensions();

  return (
    <Overlay
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: c.scrim,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: layout.dialog.marginHorizontal,
        }}
      >
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            {
              width: "100%",
              maxWidth: layout.dialog.maxWidth,
              // Capped rather than fixed: a long message in `pa` scrolls
              // instead of pushing the buttons off the bottom of the screen.
              maxHeight: height * 0.8,
              backgroundColor: c.surfaceElevated,
              borderRadius: radii.xl,
              padding: layout.dialog.padding,
              gap: layout.dialog.gap,
            },
            elevation.overlay,
          ]}
        >
          <Text variant="subheading" color="textPrimary">
            {title}
          </Text>

          {message ? (
            <ScrollView bounces={false}>
              <Text variant="body" color="textSecondary">
                {message}
              </Text>
            </ScrollView>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: space.sm,
            }}
          >
            {cancelLabel ? (
              <Button
                title={cancelLabel}
                onPress={onCancel}
                variant="ghost"
                style={{ flexGrow: 1, flexBasis: "auto" }}
                testID="dialog-cancel"
              />
            ) : null}
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? "destructive" : "primary"}
              style={{ flexGrow: 1, flexBasis: "auto" }}
              testID="dialog-confirm"
            />
          </View>
        </View>
      </View>
    </Overlay>
  );
};

Dialog.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  confirmLabel: PropTypes.string.isRequired,
  /** Omit for an acknowledge-only dialog. */
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  /** Renders the confirm action as destructive. */
  destructive: PropTypes.bool,
  testID: PropTypes.string,
};

export default Dialog;
