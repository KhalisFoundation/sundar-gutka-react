import React from "react";
import Svg, { Rect, Path } from "react-native-svg";
import PropTypes from "prop-types";

const PlayIcon = ({
  width = 150,
  height = 56,
  iconColor = "#7789A7", // desaturated blue for the triangle
}) => {
  const r = height / 2; // full rounding for the pill
  // Triangle center
  const cx = width * 0.42;
  const cy = height / 2;
  const size = height * 0.37; // triangle size
  const corner = size * 0.25; // corner radius for triangle

  // Path with rounded corners
  const path = `
    M ${cx - size * 0.55 + corner} ${cy - size}
    Q ${cx - size * 0.55} ${cy - size}, ${cx - size * 0.55} ${cy - size + corner}
    L ${cx - size * 0.55} ${cy + size - corner}
    Q ${cx - size * 0.55} ${cy + size}, ${cx - size * 0.55 + corner} ${cy + size}
    L ${cx + size - corner} ${cy + corner}
    Q ${cx + size} ${cy}, ${cx + size - corner} ${cy - corner}
    Z
  `;

  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} rx={r} ry={r} fill="transparent" />
      <Path d={path} fill={iconColor} />
    </Svg>
  );
};

PlayIcon.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  iconColor: PropTypes.string.isRequired,
};

export default PlayIcon;
