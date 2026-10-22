import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import Button from "./Button";

// A sheet's cancel and confirm, as two labelled buttons fixed at its bottom.
//
// They used to be a cross and an icon in the title row. The icons were
// confusing for older readers — a cross, an arrow and a floppy disk said
// nothing about Cancel, Next, Create or Save — so they are words again, and
// in the place a phone's dialogs put them.
//
// Fixed, not in the body: the caller passes this as the sheet's `footer`, above
// any keyboard, so neither a long list nor a keyboard can put them out of
// reach. What gives way on a short screen is the list — see Sheet's `header`.
//
// Side by side while their labels fit, stacked once they do not. Each button's
// basis is its own content — its label on one line plus its padding — so the
// row wraps only when the two labels really cannot share it: a narrow phone, a
// long translation or a raised text size, never a guessed width. A guess stacked
// "Cancel" and "Create" at a large display size with room to spare, and the
// second button's height was what the sheet's list could not afford. Cancel
// stays first, so a stacked Confirm sits nearest the thumb.
//
// Cancel is quiet and Confirm is the call to action, both from the theme — what
// confirming means differs (save, create, next), so its label is the caller's.

const SheetActions = ({
  onCancel,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
}) => {
  const { space } = useTokens();
  const button = { flexGrow: 1, flexBasis: "auto" };

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: space.sm,
        paddingTop: space.md,
      }}
    >
      <Button title={cancelLabel} onPress={onCancel} variant="secondary" style={button} />
      <Button title={confirmLabel} onPress={onConfirm} disabled={confirmDisabled} style={button} />
    </View>
  );
};

SheetActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  /** Localised label for the cancelling button. */
  cancelLabel: PropTypes.string.isRequired,
  /** Localised label for the confirming button — "Save", "Create", "Next". */
  confirmLabel: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmDisabled: PropTypes.bool,
};

export default SheetActions;
