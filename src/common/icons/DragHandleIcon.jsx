import React from "react";
import Svg, { Circle } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour.
const ICON_FALLBACK = navy[800];

// Six-dot grip: "this row can be dragged".
//
// Lifted verbatim from the Dashboard's Customise Layout overlay, which is where
// this app already established the affordance. Shared rather than copied so the
// two reorderable lists cannot end up with different grips.
const DragHandleIcon = ({ size = 20, color = ICON_FALLBACK }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="9" cy="6" r="1.6" />
    <Circle cx="15" cy="6" r="1.6" />
    <Circle cx="9" cy="12" r="1.6" />
    <Circle cx="15" cy="12" r="1.6" />
    <Circle cx="9" cy="18" r="1.6" />
    <Circle cx="15" cy="18" r="1.6" />
  </Svg>
);

DragHandleIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default DragHandleIcon;
