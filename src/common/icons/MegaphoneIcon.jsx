import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// "Spread the word" — a megaphone, in the app's stroke style.
const MegaphoneIcon = ({ size = 24, color = ICON_FALLBACK }) => (
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
    <Path d="m3 11 18-5v12L3 14v-3z" />
    <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </Svg>
);

MegaphoneIcon.propTypes = { size: PropTypes.number, color: PropTypes.string };

export default MegaphoneIcon;
