import React from "react";
import { Pressable } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";

// A bare icon acting as a button, in a header or a sheet's title row.
//
// This is the Dashboard's and Seva's close cross, named. Both already drew the
// same control the same way — `layout.header.closeIconSize`, a little padding,
// `hitSlop` to reach the tap target rather than a box that would push the title
// around — and a third copy for the pothi picker would have been a third set of
// numbers to keep in step. The size token is deliberately NOT scaled by the OS
// text setting: a glyph is not text, and a target that grew with the font would
// crowd the title off its own row at the top of the range.
//
// `hitSlop` rather than width and height, because the tap area has to reach
// 44pt without the icon reserving that much LAYOUT — which is what keeps a
// title row short enough to leave the body its height.
const IconAction = ({ icon: Icon, label, color = undefined, onPress, disabled = false }) => {
  const { c, layout } = useTokens();
  // Disabled is carried by the colour AND by the state below: an icon has no
  // label to grey out alongside it, and colour alone tells a screen reader
  // nothing.
  const tint = disabled ? c.textDisabled : color ?? c.headerFg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({ padding: 2, opacity: pressed ? 0.6 : 1 })}
    >
      <Icon size={layout.header.closeIconSize} color={tint} />
    </Pressable>
  );
};

IconAction.propTypes = {
  /** An icon component from `@common/icons`, taking `size` and `color`. */
  icon: PropTypes.elementType.isRequired,
  /**
   * Localised, and the only thing a screen reader has to go on: a glyph has no
   * text to read out, so the label carries the verb.
   */
  label: PropTypes.string.isRequired,
  /** Defaults to `headerFg`, the role the Dashboard and Seva crosses take. */
  color: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default IconAction;
