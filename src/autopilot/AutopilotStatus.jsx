// Autopilot's one line of status (download progress, listening, microphone off), shown at the bottom
// of the Reader until a pangti is being followed; then it gets out of the way.
import React from "react";
import { Linking, StyleSheet, Text } from "react-native";
import { useReaderTheme } from "@theme/reader";
import PropTypes from "prop-types";
import { STRINGS } from "@common";

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    zIndex: 20,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: "hidden",
    fontSize: 13,
  },
});

const label = (status, progress) => {
  switch (status) {
    case "loading":
      return progress > 0 && progress < 1
        ? `${STRINGS.AUTOPILOT} · ${Math.round(progress * 100)}%`
        : `${STRINGS.AUTOPILOT} · …`;
    case "listening":
      return `${STRINGS.AUTOPILOT} · ${STRINGS.AUTOPILOT_LISTENING}`;
    case "mic":
      return STRINGS.AUTOPILOT_MIC_OFF;
    case "error":
      return STRINGS.AUTOPILOT_UNAVAILABLE;
    default:
      return null; // off, or following: nothing to show
  }
};

const AutopilotStatus = ({ status, progress, bottom }) => {
  // The reading theme's header colours, so the pill matches the bar above it in every theme.
  const { headerBackground, headerForeground } = useReaderTheme().theme.chrome;
  const text = label(status, progress);
  return text ? (
    <Text
      style={[styles.pill, { bottom, backgroundColor: headerBackground, color: headerForeground }]}
      accessibilityLiveRegion={status === "loading" ? "none" : "polite"}
      // microphone off: a tap opens Settings (the only way back on iOS once access was refused)
      onPress={status === "mic" ? () => Linking.openSettings() : undefined}
      accessibilityRole={status === "mic" ? "button" : "text"}
    >
      {text}
    </Text>
  ) : null;
};

AutopilotStatus.propTypes = {
  status: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired,
  bottom: PropTypes.number.isRequired,
};

export default AutopilotStatus;
