import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. See
// CloseIcon, which this matches in stroke and grid.
const ICON_FALLBACK = navy[800];

const SearchIcon = ({ size = 24, color = ICON_FALLBACK }) => {
  return (
    <Svg
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="m17 17 4 4M3 11a8 8 0 1 0 16 0 8 8 0 0 0-16 0" />
    </Svg>
  );
};

SearchIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default SearchIcon;
