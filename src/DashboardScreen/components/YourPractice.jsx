import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Polyline } from "react-native-svg";
import PropTypes from "prop-types";
import { CustomText, STRINGS } from "@common";
import { getAllTimeTotals, getYearActivityTotals } from "../../database/analytics";
import DashboardCard from "./DashboardCard";
import useDashboardTheme from "./dashboardTheme";
import SectionError from "./SectionError";
import SectionLabel from "./SectionLabel";
import SkeletonBlock from "./SkeletonBlock";
import useAsyncSection from "./useAsyncSection";

const BookIcon = ({ color }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);
BookIcon.propTypes = { color: PropTypes.string.isRequired };

const ClockIcon = ({ color }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);
ClockIcon.propTypes = { color: PropTypes.string.isRequired };

// Lifetime mini-stats (reading/listening hrs, longest streak, active days) are
// hidden from the UI per design but still tracked in the background — see the
// commented-out fmtHrs/MiniStat/JSX below for a quick re-enable.
// const fmtHrs = (secs) => {
//   if (!secs) return { value: "0", unit: "min" };
//   const mins = Math.floor(secs / 60);
//   if (mins < 60) return { value: String(mins), unit: "min" };
//   return { value: String(Math.floor(secs / 3600)), unit: "hrs" };
// };

// numFont/labelFont: explicit fontFamily with NO fontWeight alongside it — these
// are custom TTFs (same convention as StreakCard/TodaysNitnem), and pairing them
// with a numeric fontWeight makes Android synthesize a fake bold and silently
// fall back off the real glyph, which is why these hero numbers weren't matching
// the rest of the dashboard's brand font.
const HeroStat = ({
  icon,
  value,
  label,
  sub,
  accent,
  numColor,
  labelColor,
  mutedText,
  numFont,
  labelFont,
}) => (
  <View style={styles.hero}>
    {icon === "book" ? <BookIcon color={accent} /> : <ClockIcon color={accent} />}
    <CustomText
      style={[
        styles.heroValue,
        {
          color: numColor,
          fontFamily: numFont,
          // Faux-bold to match the username / streak count (custom TTF ignores fontWeight).
          textShadowColor: numColor,
          textShadowOffset: { width: 0.5, height: 0 },
          textShadowRadius: 0.4,
        },
      ]}
    >
      {value}
    </CustomText>
    <CustomText style={[styles.heroLabel, { color: labelColor, fontFamily: labelFont }]}>
      {label}
    </CustomText>
    <CustomText style={[styles.heroSub, { color: mutedText }]}>{sub}</CustomText>
  </View>
);
HeroStat.propTypes = {
  icon: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sub: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
  numColor: PropTypes.string.isRequired,
  labelColor: PropTypes.string.isRequired,
  mutedText: PropTypes.string.isRequired,
  numFont: PropTypes.string.isRequired,
  labelFont: PropTypes.string.isRequired,
};

// const MiniStat = ({ value, unit, label, accent, primaryText, mutedText }) => (
//   <View style={styles.miniStat}>
//     <View style={styles.miniRow}>
//       <CustomText style={[styles.miniValue, { color: primaryText }]}>{value}</CustomText>
//       <CustomText style={[styles.miniUnit, { color: accent }]}>{unit}</CustomText>
//     </View>
//     <CustomText style={[styles.miniLabel, { color: mutedText }]}>{label}</CustomText>
//   </View>
// );
// MiniStat.propTypes = {
//   value: PropTypes.string.isRequired,
//   unit: PropTypes.string.isRequired,
//   label: PropTypes.string.isRequired,
//   accent: PropTypes.string.isRequired,
//   primaryText: PropTypes.string.isRequired,
//   mutedText: PropTypes.string.isRequired,
// };

const YourPractice = ({ refreshKey = 0 }) => {
  const { mutedText, theme, palette } = useDashboardTheme();
  const numFont = theme.typography.fonts.balooPaajiSemiBold;
  const labelFont = theme.typography.fonts.balooPaaji;
  // Hero numbers match the username / streak count exactly (color + faux-bold).
  // The headline figure is the brand blue in light and white in dark — it is
  // the thing the card exists to show, not body copy.
  const heroNumColor = palette.brandText;
  const heroLabelColor = palette.heroLabel;
  // Book/clock icon tint — light blue in dark mode, brand blue in light.
  const iconColor = palette.heroIcon;
  const [data, setData] = useState(null);

  const task = useCallback(async () => {
    // Baseline (restored once, survives reinstall) + live (this install only) —
    // see getAllTimeTotals for why the raw live-only queries alone reset to 0
    // right after a reinstall.
    // banisCompleted is all-time; the hours are scoped to the current LOCAL year
    // (resets at the user's New Year), so fetch both.
    const year = new Date().getFullYear();
    const [totals, yearTotals] = await Promise.all([
      getAllTimeTotals(),
      getYearActivityTotals(String(year)),
    ]);
    setData({
      banisCompleted: totals.banisCompleted,
      yearReadingSeconds: yearTotals.total_reading_seconds,
      yearListeningSeconds: yearTotals.total_listening_seconds,
    });
    // refreshKey isn't read above but forces a refetch on screen focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const { loading, error, retry } = useAsyncSection(task);

  const completed = data ? data.banisCompleted : 0;
  const readSecs = data?.yearReadingSeconds ?? 0;
  const listenSecs = data?.yearListeningSeconds ?? 0;
  const nitnemHrs = Math.floor((readSecs + listenSecs) / 3600);
  // Still tracked in the background — see the commented-out mini-stats block below.
  // const readStat = fmtHrs(readSecs);
  // const listenStat = fmtHrs(listenSecs);
  // const longest = data?.summary?.longest_streak ?? 0;
  // const activeDays = data?.summary?.total_days_active ?? 0;

  return (
    <View>
      <SectionLabel title={STRINGS.INSIGHTS} />
      <View style={styles.wrap}>
        {loading ? (
          <View style={styles.heroRow}>
            <DashboardCard style={styles.heroBox}>
              <SkeletonBlock style={styles.heroSkeleton} />
            </DashboardCard>
            <DashboardCard style={styles.heroBox}>
              <SkeletonBlock style={styles.heroSkeleton} />
            </DashboardCard>
          </View>
        ) : null}

        {!loading && error ? (
          <DashboardCard style={styles.errorBox}>
            <SectionError compact onRetry={retry} />
          </DashboardCard>
        ) : null}

        {/* Two hero stats, each its own box */}
        {!loading && !error ? (
          <View style={styles.heroRow}>
            <DashboardCard style={styles.heroBox}>
              <HeroStat
                icon="book"
                value={completed.toLocaleString()}
                label={STRINGS.BANIS_COMPLETED}
                sub={STRINGS.ALL_TIME}
                accent={iconColor}
                numColor={heroNumColor}
                labelColor={heroLabelColor}
                mutedText={mutedText}
                numFont={numFont}
                labelFont={labelFont}
              />
            </DashboardCard>
            <DashboardCard style={styles.heroBox}>
              <HeroStat
                icon="clock"
                value={`${nitnemHrs}h`}
                label={STRINGS.IN_NITNEM}
                sub={STRINGS.THIS_YEAR}
                accent={iconColor}
                numColor={heroNumColor}
                labelColor={heroLabelColor}
                mutedText={mutedText}
                numFont={numFont}
                labelFont={labelFont}
              />
            </DashboardCard>
          </View>
        ) : null}

        {/* Lifetime stats (2×2) — hidden from UI per design, still tracked.
        <View style={[card, styles.card]}>
          <View style={styles.miniRowWrap}>
            <MiniStat
              value={readStat.value}
              unit={readStat.unit}
              label={STRINGS.TOTAL_READING_HRS}
              accent={accentBlue}
              primaryText={primaryText}
              mutedText={mutedText}
            />
            <MiniStat
              value={listenStat.value}
              unit={listenStat.unit}
              label={STRINGS.TOTAL_LISTENING_HRS}
              accent={accentBlue}
              primaryText={primaryText}
              mutedText={mutedText}
            />
          </View>
          <View style={[styles.miniRowWrap, styles.miniRow2]}>
            <MiniStat
              value={String(longest)}
              unit="days"
              label={STRINGS.LONGEST_STREAK}
              accent={accentBlue}
              primaryText={primaryText}
              mutedText={mutedText}
            />
            <MiniStat
              value={String(activeDays)}
              unit="total"
              label={STRINGS.TOTAL_ACTIVE_DAYS}
              accent={accentBlue}
              primaryText={primaryText}
              mutedText={mutedText}
            />
          </View>
        </View>
        */}
      </View>
    </View>
  );
};

YourPractice.propTypes = { refreshKey: PropTypes.number };

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroBox: { flex: 1, padding: 18 },
  hero: { flex: 1, gap: 5 },
  heroValue: { fontSize: 39, marginTop: -5 },
  heroLabel: { fontSize: 13, marginTop: -15 },
  heroSub: { fontSize: 11 },
  heroSkeleton: { width: "70%", height: 40, alignSelf: "flex-start" },
  errorBox: { flex: 1, padding: 18 },
});

// Paired with the commented-out MiniStat component/JSX above — kept for a quick
// re-enable if the lifetime mini-stats ever come back to the UI.
// const miniStyles = {
//   card: { padding: 20 },
//   miniRowWrap: { flexDirection: "row" },
//   miniRow2: { marginTop: 16 },
//   miniStat: { flex: 1 },
//   miniRow: { flexDirection: "row", alignItems: "baseline" },
//   miniValue: { fontSize: 22, fontWeight: "600" },
//   miniUnit: { fontSize: 12, fontWeight: "500", marginLeft: 5 },
//   miniLabel: { fontSize: 11, fontWeight: "500", letterSpacing: 0.6, marginTop: 2 },
// };

export default YourPractice;
