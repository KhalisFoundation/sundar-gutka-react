import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { MAX_NAME_LENGTH } from "@common/pothi/model";
import { STRINGS } from "@common";
import { GurmukhiTextField, Text } from "../../common/components/ui";

// The pothi-name field, shared by Create and Rename.
//
// Sized and coloured like the reminder LabelModal, which is this app's existing
// "name this thing" control, so two dialogs asking the same question do not
// look like two different apps. See GurmukhiTextField for the field itself.
//
// ── Punjabi input ─────────────────────────────────────────────────────────
// The platform's own Gurmukhi IME still handles this field by default — it has
// correct input rules and everyone who types Punjabi already knows it. The
// in-app keyboard is the fallback for a device with no Gurmukhi IME installed;
// its switch sits inside the field, and the keys at the bottom of the sheet.
const PothiNameField = ({
  value,
  onChange,
  onSubmit,
  gurmukhiOpen,
  receivingKeys,
  onFocus,
  onToggleGurmukhi,
}) => {
  const { layout } = useTokens();

  return (
    <View style={{ gap: layout.dialog.gap }}>
      <Text variant="label" color="textSecondary">
        {STRINGS.POTHI_NAME_LABEL}
      </Text>

      <GurmukhiTextField
        value={value}
        onChange={onChange}
        placeholder={STRINGS.POTHI_NAME_PLACEHOLDER}
        accessibilityLabel={STRINGS.POTHI_NAME_LABEL}
        onSubmit={onSubmit}
        onFocus={onFocus}
        maxLength={MAX_NAME_LENGTH}
        gurmukhiOpen={gurmukhiOpen}
        receivingKeys={receivingKeys}
        keyboardToggle={{
          label: STRINGS.POTHI_KEYBOARD_CHIP,
          accessibilityLabel: STRINGS.POTHI_KEYBOARD_TOGGLE,
          onToggle: onToggleGurmukhi,
        }}
      />
    </View>
  );
};

PothiNameField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  /** Whether the sheet's in-app keyboard is up at all. */
  gurmukhiOpen: PropTypes.bool.isRequired,
  /** Whether this field is the one receiving its keys. */
  receivingKeys: PropTypes.bool.isRequired,
  onFocus: PropTypes.func.isRequired,
  /** Turns the in-app keyboard on or off, from the switch in the field. */
  onToggleGurmukhi: PropTypes.func.isRequired,
};

export default PothiNameField;
