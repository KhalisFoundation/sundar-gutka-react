import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

const MusicIcon = ({ size = 24, color = colors.WHITE }) => (
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
    <Path d="M8.625 17.65c0 1.574-1.26 2.85-2.812 2.85C4.259 20.5 3 19.224 3 17.65c0-1.573 1.26-2.849 2.813-2.849s2.812 1.276 2.812 2.85m0 0V5.462c0-.52.394-.954.909-1.001l10.375-.956A1 1 0 0 1 21 4.506V16.51m0 0c0 1.573-1.26 2.85-2.812 2.85-1.554 0-2.813-1.277-2.813-2.85s1.26-2.85 2.813-2.85S21 14.938 21 16.512" />
  </Svg>
);

MusicIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default MusicIcon;
