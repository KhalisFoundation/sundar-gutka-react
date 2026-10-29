import React from "react";
import { Pressable, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import { CloseIcon } from "../../icons";
import Text from "./Text";

// The switch for a sheet's in-app Punjabi keyboard: a chip that sits at the
// trailing edge INSIDE the field it types into. See GurmukhiTextField, which
// places it and decides whether its label fits.
//
// The SHAPE is identical on and off — same box, same size — and only the chip
// fills. An earlier version swapped a bare text link for a filled button when it
// turned on, so one control looked like two different ones depending on state.
const GurmukhiKeyboardToggle = ({
  label,
  accessibilityLabel,
  active,
  onToggle,
  showLabel = true,
}) => {
  const { c, space, radii, layout, type, scale } = useTokens();
  // The same height as the ਅ beside it. An icon is not text, so the OS text
  // size does not reach it on its own — it takes the clamped scale Text uses,
  // or at a large text size it would shrink to a speck beside a grown letter.
  const closeSize = Math.round(type.body.fontSize * scale.fontScale);

  // Filled only when ON, so the off state is quiet and the chip does not compete
  // with the text being typed beside it.
  const fillFor = (pressed) => {
    if (active) return c.accentSubtle;
    return pressed ? c.surfaceSelected : "transparent";
  };

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      // The full name always, whether or not the short label is on screen.
      accessibilityLabel={accessibilityLabel}
      // The chip is drawn small to sit inside a field; `hitSlop` keeps the tap
      // target at the 44pt minimum.
      hitSlop={layout.hitSlop}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        borderRadius: radii.pill,
        borderWidth: layout.borderWidth.hairline,
        borderColor: active ? c.accent : c.border,
        backgroundColor: fillFor(pressed),
      })}
    >
      {/* The Gurmukhi letter names the script it switches to, in that script,
          so it needs no translation of its own. It is also what is left when
          the field is too narrow for the label. */}
      <Text variant="body" color={active ? "accent" : "textSecondary"}>
        ਅ
      </Text>
      {/* No "On"/"Off" text: it would be a string to translate into six
          languages for what the fill, the accent and `accessibilityState`
          already say. */}
      {showLabel ? (
        <Text variant="caption" color={active ? "accent" : "textSecondary"} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      {/* While ON, the chip also says how to get out: the app's close icon,
          the way a field's clear button reads. Tapping anywhere on the chip
          turns the keyboard off, as before. Kept when the label is dropped for
          room, so a narrow field still shows the way out. Decorative to a
          screen reader, which already hears a switch that is on. */}
      {active ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <CloseIcon size={closeSize} color={c.accent} />
        </View>
      ) : null}
    </Pressable>
  );
};

GurmukhiKeyboardToggle.propTypes = {
  /** The short visible name — this primitive holds no strings. */
  label: PropTypes.string.isRequired,
  /** The full name read by a screen reader. */
  accessibilityLabel: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  /** False when the field is too narrow for the label; only ਅ is drawn. */
  showLabel: PropTypes.bool,
};

export default GurmukhiKeyboardToggle;
