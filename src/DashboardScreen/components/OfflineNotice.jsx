import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import PropTypes from "prop-types";
import { CustomText, STRINGS } from "@common";
import DashboardCard from "./DashboardCard";
import useDashboardTheme, { ACCENT_BLUE } from "./dashboardTheme";

const WifiOffIcon = ({ color }) => (
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
    <Line x1="1" y1="1" x2="23" y2="23" />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <Line x1="12" y1="20" x2="12.01" y2="20" />
  </Svg>
);
WifiOffIcon.propTypes = { color: PropTypes.string.isRequired };

const ClockIcon = ({ color }) => (
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
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);
ClockIcon.propTypes = { color: PropTypes.string.isRequired };

// Shared "this section has nothing to show" state for network-backed sections.
// `message` lets a section show context-specific copy (e.g. Today's Vaak)
// instead of the generic line. `onRetry`, when given, adds a manual re-check
// instead of making the user wait for the next screen focus / background
// refetch.
//
// `variant` picks the icon, because the two reasons a section comes up empty are
// not the same fact. "offline" is a connectivity failure the user can act on;
// "waiting" is content that simply has not been published yet, where a
// crossed-out wifi symbol tells an online user something untrue.
const OfflineNotice = ({ compact = false, message = "", onRetry = null, variant = "offline" }) => {
  const { mutedText } = useDashboardTheme();
  const Icon = variant === "waiting" ? ClockIcon : WifiOffIcon;
  return (
    <View style={styles.wrap}>
      <DashboardCard style={[styles.box, compact && styles.boxCompact]}>
        <Icon color={mutedText} />
        <CustomText style={[styles.text, { color: mutedText }]}>
          {message || STRINGS.NO_INTERNET}
        </CustomText>
        {onRetry ? (
          <Pressable onPress={onRetry} hitSlop={8}>
            <CustomText style={[styles.retry, { color: ACCENT_BLUE }]}>{STRINGS.RETRY}</CustomText>
          </Pressable>
        ) : null}
      </DashboardCard>
    </View>
  );
};

OfflineNotice.propTypes = {
  compact: PropTypes.bool,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  variant: PropTypes.oneOf(["offline", "waiting"]),
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  box: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  boxCompact: { paddingVertical: 18 },
  text: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  retry: { fontSize: 13, fontWeight: "700", marginTop: 2 },
});

export default OfflineNotice;
