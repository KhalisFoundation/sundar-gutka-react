import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const MusicIcon = ({ size = 28, color = colors.READER_HEADER_COLOR, strokeWidth = 1.5 }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
    <Path d="M12.5 14.5V8.6a.6.6 0 0 1 .6-.6h1.4m-2 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
  </Svg>
);

MusicIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  strokeWidth: PropTypes.number.isRequired,
};

export default MusicIcon;
