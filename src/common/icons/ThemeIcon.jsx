import React from "react";
import Svg, { Path } from "react-native-svg";
import { navy } from "@theme/palette";
import PropTypes from "prop-types";

// Fallback only — every call site passes an explicit, themed colour. It exists
// so the stroke is never undefined, which is what the old colors module
// returned: it never defined the keys these icons referenced.
const ICON_FALLBACK = navy[800];

// Painter's palette — the Theme row in Settings.
//
// Font Awesome Free 7.3.1 ("palette"), CC BY 4.0 — https://fontawesome.com/license/free
//
// This one is FILLED, not stroked, so it keeps its own 640 viewBox rather than
// being redrawn on the 24-unit grid the other icons use. The four paint wells
// are counters punched out of the solid body by the nonzero winding rule, so
// `fillRule` is deliberately left at its default — forcing evenodd would fill
// them in and leave a featureless blob.
//
// Being solid it reads heavier than the 1.5-stroke icons beside it. That is the
// trade for a shape that stays legible at row size: an outlined palette
// collapses into a ring with noise in it once it is down at 24px.
//
// Takes the same `size`/`color` props as every other icon in this folder, so it
// tints from the theme — replacing a fixed-colour PNG that could not.
const ThemeIcon = ({ size = 24, color = ICON_FALLBACK }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 640 640"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path d="M576 320C576 320.9 576 321.8 576 322.7C575.6 359.2 542.4 384 505.9 384L408 384C381.5 384 360 405.5 360 432C360 435.4 360.4 438.7 361 441.9C363.1 452.1 367.5 461.9 371.8 471.8C377.9 485.6 383.9 499.3 383.9 513.8C383.9 545.6 362.3 574.5 330.5 575.8C327 575.9 323.5 576 319.9 576C178.5 576 63.9 461.4 63.9 320C63.9 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320zM192 352C192 334.3 177.7 320 160 320C142.3 320 128 334.3 128 352C128 369.7 142.3 384 160 384C177.7 384 192 369.7 192 352zM192 256C209.7 256 224 241.7 224 224C224 206.3 209.7 192 192 192C174.3 192 160 206.3 160 224C160 241.7 174.3 256 192 256zM352 160C352 142.3 337.7 128 320 128C302.3 128 288 142.3 288 160C288 177.7 302.3 192 320 192C337.7 192 352 177.7 352 160zM448 256C465.7 256 480 241.7 480 224C480 206.3 465.7 192 448 192C430.3 192 416 206.3 416 224C416 241.7 430.3 256 448 256z" />
    </Svg>
  );
};

ThemeIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
};

export default ThemeIcon;
