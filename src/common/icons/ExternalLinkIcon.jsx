import React from "react";
import { Svg, Path } from "react-native-svg";
import PropTypes from "prop-types";
import constant from "../constant";

// Marks a row that leaves the app (opens a URL in the in-app browser) rather
// than pushing another screen — the chevron is reserved for in-app navigation.
const ExternalLinkIcon = ({ size = 24, color = constant.READER_HEADER_COLOR }) => {
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
      {/* Box, left open at the top-right so the arrow can break out of it. */}
      <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      {/* Arrow head, then the shaft running out through the corner. */}
      <Path d="M15 3h6v6" />
      <Path d="M10 14 21 3" />
    </Svg>
  );
};

export default ExternalLinkIcon;

ExternalLinkIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};
