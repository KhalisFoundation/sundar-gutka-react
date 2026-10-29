import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { PlusIcon } from "@common/icons";
import { STRINGS } from "@common";
import { Text } from "../../common/components/ui";

// "+ New Pothi", as the first row of a list of pothis.
//
// A list ROW, not a button floating above the list: it carries PothiRow's own
// metrics — the same glyph size, gap, gutter and minimum height — so it reads as
// the first entry rather than a smaller control sitting on top of one.
//
// Offered in two places, the Folders tab and the add-to-pothi picker, and shared
// so those cannot end up different heights.
//
// It does NO gating of its own. Both callers hand in an action that already
// checks sign-in and connectivity, and a second check here would toast twice.
const NewPothiRow = ({ onPress }) => {
  const { c, space, layout } = useTokens();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={STRINGS.POTHI_NEW}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: layout.row.minHeight,
        paddingHorizontal: layout.screenGutter,
        paddingVertical: space.lg,
        backgroundColor: pressed ? c.surfaceSelected : "transparent",
      })}
    >
      <PlusIcon size={22} color={c.accent} />
      <Text variant="body" color="accent">
        {STRINGS.POTHI_NEW}
      </Text>
    </Pressable>
  );
};

NewPothiRow.propTypes = {
  /** Already gated by the caller — see the note above. */
  onPress: PropTypes.func.isRequired,
};

export default NewPothiRow;
