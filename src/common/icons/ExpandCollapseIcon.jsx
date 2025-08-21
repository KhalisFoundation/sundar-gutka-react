import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const ResizeIcon = ({ size = 28, color = colors.READER_HEADER_COLOR, strokeWidth = 2 }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    stroke-width={strokeWidth}
    viewBox="0 0 24 24"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M20 10h-6V4M4 14h6v6M20 4l-6 6m-4 4-6 6" />
  </Svg>
);

ResizeIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  strokeWidth: PropTypes.number,
};

ResizeIcon.defaultProps = {
  size: 28,
  color: colors.READER_HEADER_COLOR,
  strokeWidth: 2,
};

export default ResizeIcon;
