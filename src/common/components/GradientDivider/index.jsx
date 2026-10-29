import React from "react";
import LinearGradient from "react-native-linear-gradient";
import { withAlpha } from "@theme/colorUtils";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";
import useTheme from "@common/context";

// Decorative horizontal divider that fades transparent → #113979 → transparent.
// Shared across the Home, Reader header, Settings and Bookmarks screens so the
// line stays identical everywhere. Pass `style` to add layout (e.g. marginTop)
// or override the default full-width 1.2px size.
// Fades out -> brand navy -> out. Built from the palette rather than written as
// four rgba strings that happen to spell the brand colour.
const rampFor = (color) => [
  withAlpha(color, 0),
  withAlpha(color, 1),
  withAlpha(color, 1),
  withAlpha(color, 0),
];
const GRADIENT_COLORS = rampFor(navy[800]);
const GRADIENT_LOCATIONS = [0, 0.48, 0.52, 1];

const GradientDivider = ({ style = null, color = null }) => {
  // Under a DESIGNED theme the rule follows the theme's header colour on every
  // screen that draws one — sixteen call sites, none of which had to change.
  // Under Light, Dark and Default it stays the brand navy it has always been.
  const { theme } = useTheme();
  const resolved = color ?? (theme?.designedTheme ? theme.c.headerFg : null);

  return (
    <LinearGradient
      colors={resolved ? rampFor(resolved) : GRADIENT_COLORS}
      locations={GRADIENT_LOCATIONS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      pointerEvents="none"
      style={[{ width: "100%", height: 1.2 }, style]}
    />
  );
};

GradientDivider.propTypes = {
  style: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.number,
  ]),
  /**
   * Overrides the brand navy. Only the Reader passes one: its header sits
   * directly on the Bani, so the line under it belongs to the reading theme —
   * a navy rule across a parchment page is the one place this fixed colour
   * looked wrong. Every other screen omits it and is unchanged.
   */
  color: PropTypes.string,
};

export default GradientDivider;
