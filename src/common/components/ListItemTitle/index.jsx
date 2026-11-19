import React from "react";
import { StyleSheet, Text } from "react-native";
import { FONT_SCALE_MAX } from "@theme/scale";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useTextScale from "@common/hooks/useTextScale";

// Plain Text (not rneui ListItem.Title, which didn't reliably honour the
// text props we pass). flexShrink bounds its width inside the row so a long
// title wraps within the row instead of pushing the trailing control off-screen.
//
// Font scaling is ON. It was hardcoded off, which meant the OS text-size
// setting — the most-used accessibility setting on both platforms — did
// nothing here (WCAG 1.4.4). It is capped at FONT_SCALE_MAX so an extreme
// setting degrades the layout rather than shattering it.
//
// There is deliberately no `adjustsFontSizeToFit` escape hatch: it sizes each
// label independently from its own length, so a list of localized strings
// renders at a different size per row (e.g. "Thème" at 16 next to
// "Téléchargement automatique en Wi-Fi" at ~10). Wrapping keeps every row
// consistent, and the row grows to fit.
const ListItemTitle = ({
  title,
  style = null,
  numberOfLines = 2,
  maxFontSizeMultiplier: propMaxScale = undefined,
}) => {
  const { theme } = useTheme();
  const multiplier = useTextScale();

  // Labels pinned with maxFontSizeMultiplier={1} stay pinned.
  const isPinned = propMaxScale === 1;
  const scale = isPinned ? 1 : multiplier;

  // A DEFAULT colour, not just a font. Without one this fell through to the
  // platform's default text colour — black — so any caller whose style omitted
  // `color` rendered black-on-near-black in dark mode. The Database Update
  // screen did exactly that: its header style sets size and spacing only.
  //
  // Callers that do pass a colour still win, because `style` is spread after.
  // includeFontPadding:false + textAlignVertical:center for the same reason the
  // AudioPlayer pill needs them: Android's font padding is asymmetric, so the
  // glyphs sit off-centre inside their own line box. The row centres the BOX
  // correctly while the visible text still looks pushed up or down — the "not
  // vertically aligned" bug. It varies by OEM and by script because the
  // reserved padding follows the RESOLVED font's metrics (visible on
  // Realme/ColorOS in hi/pa, not on Samsung/OPPO/OnePlus). Hugging the glyphs
  // makes centring the box centre what you actually see.
  const base = {
    fontFamily: theme.typography.fonts.balooPaaji,
    color: theme.c.textPrimary,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: "center",
  };
  const textStyle = Array.isArray(style) ? [base, ...style] : [base, style];

  let finalStyle = textStyle;
  if (scale !== 1) {
    const flat = StyleSheet.flatten(textStyle) || {};
    const extra = {};
    if (flat.fontSize != null) {
      extra.fontSize = flat.fontSize * scale;
    }
    if (flat.lineHeight != null) {
      extra.lineHeight = flat.lineHeight * scale;
    }
    finalStyle = [...textStyle, extra];
  }

  const maxMultiplier = isPinned ? 1 : propMaxScale ?? Math.min(FONT_SCALE_MAX, 2.0 / scale);

  return (
    <Text
      style={finalStyle}
      allowFontScaling
      maxFontSizeMultiplier={maxMultiplier}
      numberOfLines={numberOfLines}
    >
      {title}
    </Text>
  );
};

ListItemTitle.propTypes = {
  title: PropTypes.string.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  numberOfLines: PropTypes.number,
  maxFontSizeMultiplier: PropTypes.number,
};

export default ListItemTitle;
