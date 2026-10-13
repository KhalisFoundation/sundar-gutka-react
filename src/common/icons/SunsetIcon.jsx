import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// Sun dropping towards a horizon, arrow pointing down — evening.
//
// Normalised to this folder's spec: 24×24, no fill, 1.5 stroke, round caps and
// joins. The source art came at stroke 2, which reads noticeably heavier than
// everything around it at row size.
//
// Identical to `SunriseIcon` apart from the arrow, so the pair reads as one
// idea. Keep them that way: if one changes below the horizon, so should the
// other.
const SunsetIcon = ({ size = 24, color = ICON_FALLBACK, strokeWidth = 1.5 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M6 12L5 11M18 12L19 11M3 18H21M5 21H19M7 18C7 15.2386 9.23858 13 12 13C14.7614 13 17 15.2386 17 18M12 3V10M12 10L15 7M12 10L9 7" />
  </Svg>
);

SunsetIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  strokeWidth: PropTypes.number,
};

export default SunsetIcon;
