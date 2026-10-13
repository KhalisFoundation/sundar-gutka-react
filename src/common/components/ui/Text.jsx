import React from "react";
import { Text as RNText } from "react-native";
import { FONT_SCALE_MAX } from "@theme/scale";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";

// The app's text primitive. Replaces `CustomText`.
//
// Two things it does that CustomText did not:
//
// 1. **Font scaling is ON.** CustomText hardcoded `allowFontScaling={false}`
//    across 72 files with no way to override it, so the app ignored the OS
//    text-size setting entirely — the most-used accessibility setting on both
//    platforms, and WCAG 1.4.4. It is capped at FONT_SCALE_MAX rather than left
//    unbounded, so a user on a 2x system font gets larger text without the
//    layout collapsing.
//
// 2. **Size, line height and face arrive together** as a named role, so line
//    spacing stops being invented per call site.
//
// Deliberately no `adjustsFontSizeToFit`. It sizes each label according to its
// own string length, so a list of them renders at a dozen different sizes — and
// it is at its worst in `hi`/`pa`, where strings run several times the English.
// If text does not fit, the layout needs to give it room; shrinking the text is
// hiding the bug. Let it wrap, or pass `numberOfLines`.

const Text = ({
  variant = "body",
  color = "textPrimary",
  align = undefined,
  style = undefined,
  children = null,
  numberOfLines = undefined,
  onPress = undefined,
  onLongPress = undefined,
  accessibilityRole = undefined,
  accessibilityLabel = undefined,
  testID = undefined,
  ...rest
}) => {
  const { c, type } = useTokens();
  const role = type[variant] ?? type.body;
  // A role name resolves through the theme; anything else is passed straight
  // through, so a one-off literal is still possible but stands out in review.
  const resolved = c[color] ?? color;

  return (
    <RNText
      style={[role, { color: resolved }, align ? { textAlign: align } : null, style]}
      allowFontScaling
      maxFontSizeMultiplier={FONT_SCALE_MAX}
      numberOfLines={numberOfLines}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      // Forwards the occasional RN Text prop this wrapper does not name
      // (ellipsizeMode, selectable). Spreading last is deliberate.
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      {children}
    </RNText>
  );
};

Text.propTypes = {
  /** A role from `theme.type` — body, label, heading, caption, and so on. */
  variant: PropTypes.string,
  /** A role from `theme.c`. A raw colour is accepted but should be rare. */
  color: PropTypes.string,
  align: PropTypes.oneOf(["auto", "left", "right", "center", "justify"]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
  numberOfLines: PropTypes.number,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  accessibilityRole: PropTypes.string,
  accessibilityLabel: PropTypes.string,
  testID: PropTypes.string,
};

export default Text;
