// Autopilot's header icon, drawn like the Reader's other header icons (1.5 stroke, 24 grid):
// an outline microphone when off, filled when Autopilot is listening.
import React from "react";
import Svg, { Path, Rect } from "react-native-svg";
import PropTypes from "prop-types";

const MicIcon = ({ size, color, on }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Rect x="9" y="3" width="6" height="11" rx="3" fill={on ? color : "none"} />
    <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
  </Svg>
);

MicIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  on: PropTypes.bool.isRequired,
};

export default MicIcon;
