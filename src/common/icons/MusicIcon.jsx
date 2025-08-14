import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

const MusicIcon = ({ size = 24, color = colors.WHITE, isActive = false }) => (
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
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
};

export default MusicIcon;
