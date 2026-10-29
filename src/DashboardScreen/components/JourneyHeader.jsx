import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import PropTypes from "prop-types";
import { gold } from "@theme/palette";
import { paletteFor } from "@theme/screenPalettes";
import { CustomText, useTheme, STRINGS, GradientDivider } from "@common";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  gurmukhiLine: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.8,
  },
  title: {
    fontSize: 32,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  divider: {
    marginTop: 4,
    alignSelf: "stretch",
  },
  rightControls: {
    position: "absolute",
    right: 16,
    bottom: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  streakNum: {
    fontSize: 13,
    fontWeight: "700",
    color: gold[400],
  },
});

const FlameIcon = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M12 23c-4.4 0-8-3.6-8-8 0-2.1.8-4.1 2.2-5.6C7.4 8 8.5 6.3 9 4.4c.1-.3.4-.5.8-.4.3.1.5.3.5.6.1 1.2.6 2.3 1.4 3.2C12.4 6.4 13 4.6 13 2.8c0-.4.3-.7.7-.7.2 0 .4.1.5.2 2.3 2 3.8 4.9 3.8 8 0 4.4-3.6 8-8 8z" />
  </Svg>
);
FlameIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const JourneyHeader = ({ streak = 0 }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const palette = paletteFor("dashboard", theme);
  const { top: safeTop } = useSafeAreaInsets();

  const invocationColor = palette.invocationText;
  const bg = palette.journeyBg;
  const titleColor = palette.journeyTitle;

  return (
    <View style={[styles.container, { paddingTop: safeTop + 4, backgroundColor: bg }]}>
      <CustomText style={[styles.gurmukhiLine, { color: invocationColor }]}>
        ॥ ੴ ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥
      </CustomText>
      <CustomText style={[styles.title, { color: titleColor }]}>{STRINGS.MY_JOURNEY}</CustomText>

      <GradientDivider style={styles.divider} />

      {streak > 0 && (
        <View style={[styles.rightControls, { top: safeTop + 4 }]}>
          <View
            style={[
              styles.streakPill,
              { backgroundColor: palette.journeyFlameBg },
            ]}
          >
            <FlameIcon size={12} color={gold[400]} />
            <CustomText style={styles.streakNum}>{streak}</CustomText>
          </View>
        </View>
      )}
    </View>
  );
};

JourneyHeader.propTypes = {
  streak: PropTypes.number,
};

export default JourneyHeader;
