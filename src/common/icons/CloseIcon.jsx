import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

const CloseIcon = ({ size = 24, color = colors.READER_HEADER_COLOR }) => {
  return (
    <Svg
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      viewBox={`0 0 ${size} ${size}`}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0m-6-3-6 6m0-6 6 6" />
    </Svg>
  );
};

CloseIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default CloseIcon;
