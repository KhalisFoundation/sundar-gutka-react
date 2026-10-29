import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import { CustomText, useTheme, logError, STRINGS } from "@common";
import { getOrCreateSummary, getAllTimeTotals } from "../../database/analytics";

const formatStatTime = (secs) => {
  if (!secs) return { value: "0", unit: STRINGS.UNIT_MIN };
  const totalMins = Math.floor(secs / 60);
  if (totalMins < 60) return { value: String(totalMins), unit: STRINGS.UNIT_MIN };
  return { value: String(Math.floor(secs / 3600)), unit: STRINGS.UNIT_HRS };
};

const StatBlock = ({ value, unit, label, theme, accentBlue }) => (
  <View style={styles.statBlock}>
    <View style={styles.valueRow}>
      {/* The figure reads as brand blue alongside its unit, rather than as
          near-black copy with a blue suffix stuck on the end. */}
      <CustomText style={[styles.bigNumber, { color: accentBlue }]}>{value}</CustomText>
      <CustomText style={[styles.unit, { color: accentBlue }]}> {unit}</CustomText>
    </View>
    <CustomText style={[styles.statLabel, { color: theme.c.textSecondary }]}>
      {label}
    </CustomText>
  </View>
);

StatBlock.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  theme: PropTypes.object.isRequired,
  accentBlue: PropTypes.string.isRequired,
};

const LifetimeStats = ({ refreshKey = 0 }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);
  // The Dashboard blue, from the token layer — see ActivityCalendar.
  const accentBlue = c.textBrand;
  const bg = palette.sectionBg;

  const [summary, setSummary] = useState(null);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    // Baseline (restored once, survives reinstall) + live (this install only).
    Promise.all([getOrCreateSummary(), getAllTimeTotals()])
      .then(([summaryRow, totalsRow]) => {
        setSummary(summaryRow);
        setTotals(totalsRow);
      })
      .catch(logError);
  }, [refreshKey]);

  const readStat = totals ? formatStatTime(totals.readingSeconds) : { value: "—", unit: "hrs" };
  const listenStat = totals ? formatStatTime(totals.listeningSeconds) : { value: "—", unit: "hrs" };
  const longestStreak = summary ? String(summary.longest_streak ?? 0) : "—";
  const activeDays = summary ? String(summary.total_days_active ?? 0) : "—";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <CustomText style={[styles.sectionTitle, { color: theme.c.textPrimary }]}>
        {STRINGS.LIFETIME}
      </CustomText>

      {/* Row 1: Reading + Listening with vertical divider */}
      <View style={styles.statsRow}>
        <StatBlock
          value={readStat.value}
          unit={readStat.unit}
          label={STRINGS.STAT_TOTAL_READING}
          theme={theme}
          accentBlue={accentBlue}
        />
        <View style={[styles.vertDivider, { backgroundColor: accentBlue }]} />
        <StatBlock
          value={listenStat.value}
          unit={listenStat.unit}
          label={STRINGS.STAT_TOTAL_LISTENING}
          theme={theme}
          accentBlue={accentBlue}
        />
      </View>

      {/* Row 2: Streak + Active Days */}
      <View style={[styles.statsRow, styles.row2]}>
        <StatBlock
          value={longestStreak}
          unit={STRINGS.UNIT_DAYS}
          label={STRINGS.LONGEST_STREAK}
          theme={theme}
          accentBlue={accentBlue}
        />
        {/* Invisible divider — same width as the visible one in row 1 to keep columns aligned */}
        <View style={[styles.vertDivider, { opacity: 0 }]} />
        <StatBlock
          value={activeDays}
          unit={STRINGS.UNIT_TOTAL}
          label={STRINGS.TOTAL_ACTIVE_DAYS}
          theme={theme}
          accentBlue={accentBlue}
        />
      </View>
    </View>
  );
};

LifetimeStats.propTypes = {
  refreshKey: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  row2: {
    marginTop: 20,
  },
  statBlock: {
    flex: 1,
  },
  vertDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
    alignSelf: "center",
    opacity: 0.6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: "600",
  },
  unit: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    // Uppercases Latin-script labels for the original look; a no-op for
    // Devanagari/Gurmukhi (which have no letter case), so those read naturally.
    textTransform: "uppercase",
  },
});

export default LifetimeStats;
