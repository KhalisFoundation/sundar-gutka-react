import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

const StopIcon = ({ size = 24, color = ICON_FALLBACK }) => (
  <Svg
    width={size}
    height={size}
    fill={color}
    stroke={color}
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M6 12.5c0-2.828 0-4.243.879-5.121C7.757 6.5 9.172 6.5 12 6.5s4.243 0 5.121.879C18 8.257 18 9.672 18 12.5s0 4.243-.879 5.121c-.878.879-2.293.879-5.121.879s-4.243 0-5.121-.879C6 16.743 6 15.328 6 12.5" />
  </Svg>
);

StopIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default StopIcon;
