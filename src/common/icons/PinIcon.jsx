import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour.
const ICON_FALLBACK = navy[800];

// Pin glyph for a pothi held at the top of the Folders tab.
//
// `filled` is the pinned state. A stroke-only outline reads as "you can pin
// this" and the filled body as "this is pinned"; the two must be tellable apart
// without colour alone, because the row's colour is the theme's and cannot
// carry state on its own.
const PinIcon = ({ size = 22, color = ICON_FALLBACK, filled = false }) => (
  <Svg
    width={size}
    height={size}
    fill={filled ? color : "none"}
    stroke={color}
    strokeWidth="1.6"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M12 17v5" />
    <Path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </Svg>
);

PinIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  /** True when the pothi is pinned — draws the body solid, not just the outline. */
  filled: PropTypes.bool,
};

export default PinIcon;
