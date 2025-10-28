import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

const StopIcon = ({ size = 24, color = colors.WHITE }) => (
  <Svg
    width={size}
    height={size}
    fill={color}
    stroke={color}
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M6 12.5c0-2.828 0-4.243.879-5.121C7.757 6.5 9.172 6.5 12 6.5s4.243 0 5.121.879C18 8.257 18 9.672 18 12.5s0 4.243-.879 5.121c-.878.879-2.293.879-5.121.879s-4.243 0-5.121-.879C6 16.743 6 15.328 6 12.5" />
  </Svg>
);

StopIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default StopIcon;
