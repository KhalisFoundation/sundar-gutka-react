import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import BaseSkeleton from "./BaseSkeleton";

const SkeletonText = ({ lines, lineHeight, lineGap, widths, borderRadius, containerStyle }) => {
  const { theme } = useTheme();
  const gap = lineGap ?? theme.spacing?.sm ?? 8;
  const height = lineHeight ?? theme.typography?.sizes?.md ?? 14;

  const widthResolver = (index) => {
    if (Array.isArray(widths)) {
      return widths[index] ?? "100%";
    }
    return widths ?? "100%";
  };

  return (
    <View style={containerStyle}>
      {Array.from({ length: lines }).map((_, index) => (
        <BaseSkeleton
          // eslint-disable-next-line react/no-array-index-key
          key={`skeleton-line-${index}`}
          width={widthResolver(index)}
          height={height}
          borderRadius={borderRadius}
          style={index < lines - 1 ? { marginBottom: gap } : null}
        />
      ))}
    </View>
  );
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  lineHeight: PropTypes.number,
  lineGap: PropTypes.number,
  widths: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    PropTypes.number,
    PropTypes.string,
  ]),
  borderRadius: PropTypes.number,
  containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

SkeletonText.defaultProps = {
  lines: 3,
  lineHeight: null,
  lineGap: null,
  widths: null,
  borderRadius: null,
  containerStyle: null,
};

export default SkeletonText;
