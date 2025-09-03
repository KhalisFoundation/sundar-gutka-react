import React from "react";
import { Svg, Path } from "react-native-svg";
import PropTypes from "prop-types";

const ArrowRightIcon = ({ size = 24, color }) => {
  return (
    <Svg
      width={size}
      height={size}
      fill="none"
      stroke={color}
      stroke-width="1.5"
      viewBox={`0 0 ${size} ${size}`}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="m18 8 4 4m0 0-4 4m4-4H2" />
    </Svg>
  );
};

ArrowRightIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default ArrowRightIcon;
