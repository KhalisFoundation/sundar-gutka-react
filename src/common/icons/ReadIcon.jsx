import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

const ReadIcon = ({ size = 24, color = colors.READER_HEADER_COLOR }) => (
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
    <Path d="M12 9.8V20m0-10.2c0-1.704.107-3.584-1.638-4.473C9.72 5 8.88 5 7.2 5H4.6C3.364 5 3 5.437 3 6.6v8.8c0 .568-.036 1.195.546 1.491.214.109.493.109 1.052.109H7.43c2.377 0 3.26 1.036 4.569 3m0-10.2c0-1.704-.108-3.584 1.638-4.473C14.279 5 15.12 5 16.8 5h2.6c1.235 0 1.6.436 1.6 1.6v8.8c0 .567.035 1.195-.546 1.491-.213.109-.493.109-1.052.109h-2.833c-2.377 0-3.26 1.036-4.57 3" />
  </Svg>
);

export default ReadIcon;

ReadIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};
