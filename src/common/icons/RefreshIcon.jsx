import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";

const RefreshIcon = ({ size = 30, color }) => (
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
    <Path d="M20.5 8c-1.392-3.179-4.823-5-8.522-5C7.299 3 3.453 6.552 3 11.1" />
    <Path d="M16.489 8.4h3.97A.54.54 0 0 0 21 7.86V3.9M3.5 16c1.392 3.179 4.823 5 8.522 5 4.679 0 8.525-3.552 8.978-8.1" />
    <Path d="M7.511 15.6h-3.97a.54.54 0 0 0-.541.54v3.96" />
  </Svg>
);

RefreshIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};
export default RefreshIcon;
