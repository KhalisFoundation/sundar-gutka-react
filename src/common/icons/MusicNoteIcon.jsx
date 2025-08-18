import React from "react";
import Svg, { Path, Circle, Line, G } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const MusicIcon = ({ size = 28, color = colors.READER_HEADER_COLOR, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* outer ring */}
    <Circle cx={12} cy={12} r={10.5} stroke={color} strokeWidth={strokeWidth} />
    {/* note */}
    <G
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* head */}
      <Circle cx={8.8} cy={15.2} r={2} />
      {/* stem */}
      <Line x1={10.8} y1={15.2} x2={10.8} y2={9} />
      {/* beam / top bar slightly angled to the right */}
      <Path d="M10.8 9 L16.5 7.8 V12.2" />
    </G>
  </Svg>
);

MusicIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  strokeWidth: PropTypes.number.isRequired,
};

export default MusicIcon;
