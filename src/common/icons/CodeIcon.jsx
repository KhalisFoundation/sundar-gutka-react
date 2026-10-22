import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// "Seva for coders" — angle-bracket code glyph, in the app's stroke style.
const CodeIcon = ({ size = 24, color = ICON_FALLBACK }) => (
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
    <Path d="m16 18 6-6-6-6" />
    <Path d="m8 6-6 6 6 6" />
  </Svg>
);

CodeIcon.propTypes = { size: PropTypes.number, color: PropTypes.string };

export default CodeIcon;
