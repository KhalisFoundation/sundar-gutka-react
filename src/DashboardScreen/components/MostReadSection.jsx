import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { androidLineHeight } from "@theme/lineHeight";
import PropTypes from "prop-types";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import { CustomText, useTheme, STRINGS, logError } from "@common";
import { getTopReadBanis } from "../../database/analytics";
import { getRestoredTopBanis } from "../../services/dashboard";

const formatDuration = (secs) => {
  if (!secs) return "0m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const SparkleIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </Svg>
);
SparkleIcon.propTypes = { size: PropTypes.number, color: PropTypes.string.isRequired };

const MostReadSection = ({ refreshKey = 0 }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);
  // The Dashboard blue, from the token layer — see ActivityCalendar.
  const accentBlue = c.textBrand;
  const bg = palette.sectionBg;
  const [banis, setBanis] = useState([]);

  useEffect(() => {
    getTopReadBanis(5)
      .then((rows) => {
        if (rows.length > 0) {
          setBanis(rows);
          return;
        }
        // Raw session history doesn't survive a reinstall — fall back to the
        // top5 snapshot captured at the last cloud push, so a returning user
        // doesn't see a false "you've never read anything" empty state.
        getRestoredTopBanis().then((restored) => {
          const top5 = restored?.read?.top5 ?? [];
          setBanis(
            top5.map(([baniId, sessionCount, totalSeconds]) => ({
              bani_id: baniId,
              session_count: sessionCount,
              total_seconds: totalSeconds,
            }))
          );
        });
      })
      .catch(logError);
  }, [refreshKey]);

  if (!banis.length) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.titleRow}>
          <CustomText style={[styles.sectionTitle, { color: c.textPrimary }]}>
            {STRINGS.MOST_READ}
          </CustomText>
          <SparkleIcon size={22} color={accentBlue} />
        </View>
        <View style={[styles.emptyCard, { backgroundColor: c.controlAccent }]}>
          <CustomText style={[styles.emptyText, { color: c.textSecondary }]}>
            Read a Bani to see your top reads here
          </CustomText>
        </View>
      </View>
    );
  }

  const maxSeconds = banis[0]?.total_seconds ?? 1;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.titleRow}>
        <CustomText style={[styles.sectionTitle, { color: c.textPrimary }]}>
          {STRINGS.MOST_READ}
        </CustomText>
        <SparkleIcon size={22} color={accentBlue} />
      </View>
      {banis.map((b, i) => {
        const pct = maxSeconds > 0 ? ((b.total_seconds ?? 0) / maxSeconds) * 100 : 0;
        return (
          <View key={b.bani_id ?? i} style={styles.row}>
            <CustomText style={[styles.rank, { color: c.textSecondary }]}>
              {i + 1}
            </CustomText>
            <View style={styles.middle}>
              <CustomText
                style={[styles.baniTitle, { color: c.textPrimary }]}
                numberOfLines={1}
              >
                {b.bani_title ?? `Bani ${b.bani_id}`}
              </CustomText>
              <View style={[styles.barBg, { backgroundColor: c.surfaceSelected }]}>
                <View style={[styles.bar, { width: `${pct}%`, backgroundColor: accentBlue }]} />
              </View>
            </View>
            <CustomText style={[styles.count, { color: accentBlue }]}>
              {formatDuration(b.total_seconds)}
            </CustomText>
          </View>
        );
      })}
    </View>
  );
};

MostReadSection.propTypes = {
  refreshKey: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 12,
  },
  rank: {
    width: 20,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  middle: {
    flex: 1,
  },
  baniTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },
  barBg: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  bar: {
    height: 3,
    borderRadius: 2,
  },
  count: {
    fontSize: 20,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
  },
  emptyCard: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: androidLineHeight(20),
  },
});

export default MostReadSection;
