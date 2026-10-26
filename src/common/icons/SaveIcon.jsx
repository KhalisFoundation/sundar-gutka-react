import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. See
// CloseIcon, which carries the same note and the same reason.
const ICON_FALLBACK = navy[800];

// Save: the disk, drawn as an outline at the same weight as the rest of the
// set. Three parts — the body with its cut corner, the shutter above it and the
// label below — so it still reads at the 22pt the header actions use.
const SaveIcon = ({ size = 24, color = ICON_FALLBACK }) => {
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
      <Path d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h8.69c.6 0 1.17.24 1.59.66l2.31 2.31c.42.42.66.99.66 1.59v8.19a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25z" />
      <Path d="M8.25 4.5v4.5h6.75V4.5" />
      <Path d="M7.5 19.5v-5.25h9v5.25" />
    </Svg>
  );
};

SaveIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default SaveIcon;
