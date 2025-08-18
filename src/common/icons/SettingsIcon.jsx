import React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const SettingsIcon = ({
  size = 28,
  color = colors.READER_HEADER_COLOR,
  strokeWidth = 2,
}) => {
  // 8-lobed “cog” outline + inner ring
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const R = s * 0.4; // outer radius
  const r = s * 0.33; // inner radius for lobes
  const steps = 16; // alternating outer/inner points

  // Build a rounded star-like path to mimic scalloped gear
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push({ x: cx + rad * Math.cos(ang), y: cy + rad * Math.sin(ang) });
  }
  const d = `M ${pts[0].x} ${pts[0].y} ${pts
    .slice(1)
    .map((p) => `L ${p.x} ${p.y}`)
    .join(" ")} Z`;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Circle cx={cx} cy={cy} r={s * 0.09} stroke={color} strokeWidth={strokeWidth} fill="none" />
    </Svg>
  );
};

SettingsIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  strokeWidth: PropTypes.number.isRequired,
};

export default SettingsIcon;
