import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const DownloadIcon = ({
  size = 28,
  color = colors.READER_HEADER_COLOR,
  strokeWidth = 1,
}) => (
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
    <Path d="m11.966 11.136-.004 8M19.825 17c4.495-3.16.475-7.73-3.706-7.73C13.296-1.732-3.265 7.368 4.074 15.662m11.07 1.156L11.962 20 8.78 16.818" />
  </Svg>
);

DownloadIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  strokeWidth: PropTypes.number.isRequired,
};

export default DownloadIcon;
