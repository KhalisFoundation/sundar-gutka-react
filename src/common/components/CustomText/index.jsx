import React from "react";
import { StyleSheet } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import Text from "../ui/Text";

// The style-driven text component, used across ~59 files.
//
// It is no longer a second implementation. It renders the design system's
// `ui/Text` with `variant="inherit"`, so the app has ONE text primitive and one
// place that decides the scaling policy. This component only adds the thing
// `ui/Text` deliberately does not do: resolve a Baloo face from whatever
// `fontWeight` the caller happened to put in its style.
//
// `variant="inherit"` carries no metrics, so a call site's size and line height
// are exactly what they were when this rendered `RNText` directly. New code
// should name a real role (`<Text variant="body">`) rather than reach for this.
//
// Font scaling and the deliberate absence of `adjustsFontSizeToFit` now live in
// `ui/Text`; see the note there for why both matter.
const CustomText = ({
  style = null,
  children = null,
  numberOfLines = null,
  onPress = null,
  onLongPress = null,
}) => {
  const { theme } = useTheme();
  // Flatten to inspect fontWeight; pick the real SemiBold variant for bold
  // weights so we get the designed glyph instead of synthetic bold on Regular.
  const flatStyle = StyleSheet.flatten(Array.isArray(style) ? style : [style]) ?? {};
  const { fontWeight, ...restStyle } = flatStyle;
  const isBold =
    fontWeight === "700" ||
    fontWeight === "bold" ||
    fontWeight === "600" ||
    fontWeight === "semibold";
  const callerFont = flatStyle.fontFamily;
  const resolvedFont =
    callerFont ??
    (isBold ? theme.typography.fonts.balooPaajiSemiBold : theme.typography.fonts.balooPaaji);

  // When WE pick the face, the numeric weight is dropped rather than passed on.
  // Baloo ships as separate named TTFs, so a fontWeight sitting beside the
  // family makes Android try to synthesize bold, fail, and silently fall back
  // to the SYSTEM font — the reason headings rendered in a different typeface
  // to the rest of the app. The weight has already done its job above by
  // selecting the SemiBold file. A caller that names its own family keeps its
  // weight, since it may be a family that really does have weights.
  const textStyle = callerFont
    ? { ...flatStyle, fontFamily: resolvedFont }
    : { ...restStyle, fontFamily: resolvedFont };

  return (
    <Text
      variant="inherit"
      // The caller's own colour still wins — `ui/Text` applies `style` last.
      // This only decides the colour for call sites that never set one, which
      // previously fell through to the platform default black and was therefore
      // invisible in dark mode.
      color="textPrimary"
      style={textStyle}
      numberOfLines={numberOfLines}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </Text>
  );
};

CustomText.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
  numberOfLines: PropTypes.number,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
};

export default CustomText;
