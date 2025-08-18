import React from "react";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { colors } from "@common";

export const DownloadIcon = ({
  size = 28,
  color = colors.READER_HEADER_COLOR,
  strokeWidth = 1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cloud outline */}
    <Path
      d="
        M7.5 18
        H16.5
        C18.43 18 20 16.43 20 14.5
        C20 12.84 18.78 11.46 17.17 11.23
        C16.67 8.98 14.62 7.25 12 7.25
        C9.48 7.25 7.55 8.94 7.08 11.12
        C5.58 11.33 4.25 12.66 4.25 14.25
        C4.25 16.08 5.67 18 7.5 18
      "
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />

    {/* Arrow shaft */}
    <Path
      d="M12 10.5 V16.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />

    {/* Arrow head */}
    <Path
      d="M9.75 14.25 L12 16.5 L14.25 14.25"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
  </Svg>
);

DownloadIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  strokeWidth: PropTypes.number,
};

DownloadIcon.defaultProps = {
  size: 28,
  color: colors.READER_HEADER_COLOR,
  strokeWidth: 2,
};

export default DownloadIcon;
