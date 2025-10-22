import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";

const PlusIcon = ({ size = 24, color }) => {
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
      <Path d="M18 12h-6m0 0H6m6 0V6m0 6v6" />
    </Svg>
  );
};

PlusIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default PlusIcon;
