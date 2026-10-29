import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { constant } from "@common";

const ChevronDownIcon = ({ size = 24, color = constant.READER_HEADER_COLOR }) => {
  return (
    <Svg
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="m6 9 6 6 6-6" />
    </Svg>
  );
};

export default ChevronDownIcon;

ChevronDownIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

