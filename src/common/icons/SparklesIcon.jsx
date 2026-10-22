import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// "Seva by other opportunities" — sparkles, in the app's stroke style.
const SparklesIcon = ({ size = 24, color = ICON_FALLBACK }) => (
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
    <Path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
  </Svg>
);

SparklesIcon.propTypes = { size: PropTypes.number, color: PropTypes.string };

export default SparklesIcon;
