import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour.
const ICON_FALLBACK = navy[800];

// Whether something is shown or hidden.
//
// `off` draws the same eye with a stroke through it rather than a different
// glyph, so the two states read as one control changing rather than as two
// controls swapping places — and the slash carries the state without relying on
// colour, which the row's colour cannot do because it is the theme's.
const EyeIcon = ({ size = 22, color = ICON_FALLBACK, off = false }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <Circle cx="12" cy="12" r="3" />
    {off ? <Path d="M3 3l18 18" /> : null}
  </Svg>
);

EyeIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  /** True when the section is hidden — draws the eye struck through. */
  off: PropTypes.bool,
};

export default EyeIcon;
