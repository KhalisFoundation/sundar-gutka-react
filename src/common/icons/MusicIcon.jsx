import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

const MusicIcon = ({ size = 24, color = ICON_FALLBACK, isActive = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18V5l12-2v13"
      stroke={color}
      strokeWidth={isActive ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={isActive ? 2 : 1.5} fill="none" />
    <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth={isActive ? 2 : 1.5} fill="none" />
  </Svg>
);

MusicIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  isActive: PropTypes.bool,
};

export default MusicIcon;
