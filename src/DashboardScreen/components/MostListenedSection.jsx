import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { androidLineHeight } from "@theme/lineHeight";
import PropTypes from "prop-types";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import { CustomText, useTheme, logError } from "@common";
import { getTopListenedBanis } from "../../database/analytics";
import { getRestoredTopBanis } from "../../services/dashboard";

const HeadphoneIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);
HeadphoneIcon.propTypes = { size: PropTypes.number, color: PropTypes.string.isRequired };

const PlayIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M8 5v14l11-7z" />
  </Svg>
);
PlayIcon.propTypes = { size: PropTypes.number, color: PropTypes.string.isRequired };

const formatDuration = (secs) => {
  if (!secs) return "0m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const MostListenedSection = ({ refreshKey = 0 }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);
  // The Dashboard blue, from the token layer — see ActivityCalendar.
  const accentBlue = c.textBrand;
  const bg = palette.sectionBg;
  const playBtnBg = palette.playButtonBg;

  const [banis, setBanis] = useState([]);

  useEffect(() => {
    getTopListenedBanis(5)
      .then((rows) => {
        if (rows.length > 0) {
          setBanis(rows);
          return;
        }
        // Raw session history doesn't survive a reinstall — fall back to the
        // top5 snapshot captured at the last cloud push (no artist info in
        // that compact form, but the artist line is already optional below).
        getRestoredTopBanis().then((restored) => {
          const top5 = restored?.listen?.top5 ?? [];
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
            Top Listened
          </CustomText>
          <HeadphoneIcon size={22} color={accentBlue} />
        </View>
        <View style={styles.emptyCard}>
          <CustomText style={[styles.emptyText, { color: c.textSecondary }]}>
            Listen to a track to see your top listens here
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.titleRow}>
        <CustomText style={[styles.sectionTitle, { color: c.textPrimary }]}>
          Top Listened
        </CustomText>
        <HeadphoneIcon size={22} color={accentBlue} />
      </View>
      {banis.map((b, i) => {
        const artistName = b.artist_name;
        return (
          <View key={b.bani_id ?? i} style={styles.card}>
            <View style={[styles.playBtn, { backgroundColor: playBtnBg }]}>
              <PlayIcon size={22} color={c.textPrimary} />
            </View>

            <View style={styles.textBlock}>
              <CustomText
                style={[styles.baniTitle, { color: c.textPrimary }]}
                numberOfLines={1}
              >
                {b.bani_title ?? `Bani ${b.bani_id}`}
              </CustomText>
              {artistName ? (
                <CustomText
                  style={[styles.artistName, { color: c.textSecondary }]}
                  numberOfLines={1}
                >
                  {artistName}
                </CustomText>
              ) : null}
            </View>

            {/* Vertical divider */}
            <View style={[styles.vertDivider, { backgroundColor: c.border }]} />

            {/* Duration */}
            <CustomText style={[styles.duration, { color: c.textPrimary }]}>
              {formatDuration(b.total_seconds)}
            </CustomText>
          </View>
        );
      })}
    </View>
  );
};

MostListenedSection.propTypes = {
  refreshKey: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 12,
  },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  baniTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  artistName: {
    fontSize: 13,
    fontWeight: "400",
  },
  vertDivider: {
    width: 1,
    height: 40,
    opacity: 0.5,
  },
  duration: {
    fontSize: 20,
    fontWeight: "600",
    minWidth: 50,
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

export default MostListenedSection;
