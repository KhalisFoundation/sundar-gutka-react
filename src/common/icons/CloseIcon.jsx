import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import PropTypes from "prop-types";

const CloseIcon = ({ size = 24, color = "#1A2B4C", isActive = false }) => {
  const iconColor = isActive ? color : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill={iconColor} />
      <Path
        d="M8 8L16 16M16 8L8 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

CloseIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  isActive: PropTypes.bool,
};

CloseIcon.defaultProps = {
  size: 24,
  color: "#1A2B4C",
  isActive: false,
};

export default CloseIcon;
