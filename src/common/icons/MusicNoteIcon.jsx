import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import PropTypes from "prop-types";

const MusicNoteIcon = ({ size = 24, color = "#1A2B4C", isActive = false }) => {
  const iconColor = isActive ? color : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill={iconColor} />
      <Path
        d="M16 4.5V14.5C16 16.433 14.433 18 12.5 18C10.567 18 9 16.433 9 14.5C9 12.567 10.567 11 12.5 11C13.233 11 13.9 11.233 14.4 11.6V6.5L10 7.5V17.5C10 19.433 8.433 21 6.5 21C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14C7.233 14 7.9 14.233 8.4 14.6V9.5L16 7.5V4.5Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
      />
    </Svg>
  );
};

MusicNoteIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  isActive: PropTypes.bool,
};

MusicNoteIcon.defaultProps = {
  size: 24,
  color: "#1A2B4C",
  isActive: false,
};

export default MusicNoteIcon;
