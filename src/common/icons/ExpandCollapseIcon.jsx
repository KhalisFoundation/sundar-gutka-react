import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import PropTypes from "prop-types";

const ExpandCollapseIcon = ({ size = 24, color = "#1A2B4C", isActive = false }) => {
  const iconColor = isActive ? color : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill={iconColor} />
      {/* Top-left arrow pointing inwards */}
      <Path
        d="M8 8L10 10L8 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top-right arrow pointing outwards */}
      <Path
        d="M16 8L14 10L16 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-left arrow pointing outwards */}
      <Path
        d="M8 16L10 14L8 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-right arrow pointing inwards */}
      <Path
        d="M16 16L14 14L16 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

ExpandCollapseIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  isActive: PropTypes.bool,
};

ExpandCollapseIcon.defaultProps = {
  size: 24,
  color: "#1A2B4C",
  isActive: false,
};

export default ExpandCollapseIcon;
