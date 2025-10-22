import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";

const MinusIcon = ({ size = 24, color }) => {
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
      <Path d="M6 12h12" />
    </Svg>
  );
};

MinusIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default MinusIcon;
