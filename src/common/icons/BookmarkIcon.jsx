import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

const BookmarkIcon = ({ size = 24, color = colors.WHITE }) => (
  <Svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    stroke-width="1.5"
    viewBox="0 0 24 24"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M7.527 20.841C6.861 21.274 6 20.772 6 19.952V3.942c0-.52.336-.942.75-.942h10.5c.414 0 .75.422.75.942v16.01c0 .82-.861 1.322-1.527.89l-3.946-2.562a.96.96 0 0 0-1.054 0z" />
  </Svg>
);

BookmarkIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

export default BookmarkIcon;
