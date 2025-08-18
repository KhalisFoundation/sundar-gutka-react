import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const ResizeIcon = ({ size = 28, color = colors.READER_HEADER_COLOR, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 18 L10 14 M6 14 H10 M10 18 V14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
    {/* Top-right arrow (points ↙) */}
    <Path
      d="M18 6 L14 10 M18 10 H14 M14 6 V10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
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
