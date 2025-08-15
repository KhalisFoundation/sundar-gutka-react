import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";

const PlayPauseIcon = ({ size = 24, color = "#FFFFFF", isPlaying = false }) => {
  if (isPlaying) {
    // Pause icon - two vertical bars
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M8 6H10V18H8V6ZM14 6H16V18H14V6Z" fill={color} />
      </Svg>
    );
  }
  // Play icon - triangle pointing right
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5V19L19 12L8 5Z" fill={color} />
    </Svg>
  );
};

PlayPauseIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  isPlaying: PropTypes.bool,
};

PlayPauseIcon.defaultProps = {
  size: 24,
  color: "#FFFFFF",
  isPlaying: false,
};

export default PlayPauseIcon;
