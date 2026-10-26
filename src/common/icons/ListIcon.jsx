import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// "All Banis" tab — a clean bulleted list (solid dots + rounded lines), in the
// app's stroke-icon style.
const ListIcon = ({ size = 24, color = ICON_FALLBACK }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.6"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M9 6h11M9 12h11M9 18h11" />
    <Circle cx="4.5" cy="6" r="1.35" fill={color} stroke="none" />
    <Circle cx="4.5" cy="12" r="1.35" fill={color} stroke="none" />
    <Circle cx="4.5" cy="18" r="1.35" fill={color} stroke="none" />
  </Svg>
);

ListIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default ListIcon;
