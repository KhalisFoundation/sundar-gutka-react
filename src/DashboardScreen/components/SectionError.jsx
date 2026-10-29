import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import PropTypes from "prop-types";
import { CustomText, STRINGS } from "@common";
import useDashboardTheme, { ACCENT_BLUE } from "./dashboardTheme";

const AlertIcon = ({ color }) => (
  <Svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="13" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);
AlertIcon.propTypes = { color: PropTypes.string.isRequired };

// Shared inline error state for a dashboard section whose FIRST load failed
// (a background refresh failure keeps showing last-known-good data instead —
// see useAsyncSection). Retry re-runs just that section's own fetch.
const SectionError = ({ onRetry, compact = false }) => {
  const { mutedText } = useDashboardTheme();
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <AlertIcon color={mutedText} />
      <CustomText style={[styles.text, { color: mutedText }]}>{STRINGS.errorTitle}</CustomText>
      <Pressable onPress={onRetry} hitSlop={8}>
        <CustomText style={[styles.retry, { color: ACCENT_BLUE }]}>{STRINGS.RETRY}</CustomText>
      </Pressable>
    </View>
  );
};

SectionError.propTypes = { onRetry: PropTypes.func.isRequired, compact: PropTypes.bool };

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 28 },
  wrapCompact: { paddingVertical: 18 },
  text: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  retry: { fontSize: 13, fontWeight: "700", marginTop: 2 },
});

export default SectionError;
