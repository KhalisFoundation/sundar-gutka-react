import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";

const SevaIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Beautiful heart outline shape for Seva */}
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </Svg>
);
SevaIcon.propTypes = { size: PropTypes.number, color: PropTypes.string };
export default SevaIcon;
