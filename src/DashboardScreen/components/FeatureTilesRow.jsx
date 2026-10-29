import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { androidLineHeight } from "@theme/lineHeight";
import PropTypes from "prop-types";
import useBaniLookup from "@common/hooks/useBaniLookup";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import { CustomText, useTheme, STRINGS, openInAppBrowser, logError, constant } from "@common";
import { getRecentReadBanis, getRecentListenedBanis } from "../../database/analytics";
import { getRestoredTopBanis } from "../../services/dashboard";
// eslint-disable-next-line import/order
const KHALIS_LOGO = require("../../assets/images/khalis.png");
// eslint-disable-next-line import/order
const STTM_LOGO = require("../../assets/images/sikhi2max.webp");

const HUKAMNAMA_URL = "https://www.sikhitothemax.org/hukamnama";
const KHALIS_AI_URL = "https://www.sikhitothemax.org/";
const STTM_SEARCH = "https://www.sikhitothemax.org";

const fmtDuration = (secs) => {
  if (!secs || secs < 60) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const HeadphonesIcon = ({ size, color }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);
HeadphonesIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const BookOpenIcon = ({ size, color }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);
BookOpenIcon.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const APP_TILES = [
  { id: "hukamnama", labelKey: "LISTEN_HUKAMNAMA", image: STTM_LOGO, url: HUKAMNAMA_URL },
  { id: "khalis-ai", labelKey: "KHALIS_AI", image: KHALIS_LOGO, url: KHALIS_AI_URL },
  { id: "search-gurbani", labelKey: "SEARCH_GURBANI", image: STTM_LOGO, url: STTM_SEARCH },
];

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "500",
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  row: {
    paddingHorizontal: 18,
    gap: 12,
  },
  tile: {
    width: 148,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  tileIconWrap: {
    marginBottom: 10,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconInner: {
    width: 34,
    height: 34,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: androidLineHeight(20),
  },
  tileMeta: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
  },
});

const FeatureTilesRow = () => {
  // The tiles live in a HORIZONTAL scroller, so width is cheap: a wider tile
  // just means one fewer on screen at a time. At a fixed 148 the labels
  // ("Learn Gurmukhi Words") ran to three lines and clipped against
  // numberOfLines={2}. Growing with the text keeps them readable.
  const { fontScale } = useWindowDimensions();
  const tileWidth = Math.round(148 * Math.min(Math.max(fontScale || 1, 1), 1.5));

  const navigation = useNavigation();
  // The proper bani name, so the Reader header is not handed the server's
  // abbreviated title.
  const { nameOf } = useBaniLookup();
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);

  const cardBg = palette.sectionBg;
  const borderColor = palette.tileBorder;
  // The one Dashboard blue. This was the seventh copy of the same local
  // ternary; see ActivityCalendar.
  const accentColor = palette.sectionAccentBlue;
  const textPrimary = c.textPrimary;
  const textSecondary = c.textSecondary;
  const iconBg = palette.tileIconBg;

  const [lastRead, setLastRead] = useState(null);
  const [lastListened, setLastListened] = useState(null);

  useEffect(() => {
    // Raw session history doesn't survive a reinstall — fall back to the
    // last-read/listened baaniId captured at the last cloud push (no title in
    // that compact form, but bani_title is already optional at render below).
    getRecentReadBanis(1)
      .then(async (rows) => {
        if (rows[0]) {
          setLastRead(rows[0]);
          return;
        }
        const restored = await getRestoredTopBanis();
        const baniId = restored?.read?.last?.baaniId;
        setLastRead(baniId != null ? { bani_id: baniId } : null);
      })
      .catch(logError);
    getRecentListenedBanis(1)
      .then(async (rows) => {
        if (rows[0]) {
          setLastListened(rows[0]);
          return;
        }
        const restored = await getRestoredTopBanis();
        const baniId = restored?.listen?.last?.baaniId;
        setLastListened(baniId != null ? { bani_id: baniId } : null);
      })
      .catch(logError);
  }, []);

  const goToReader = (item) => {
    navigation.navigate(constant.READER, {
      key: `Reader-${item.bani_id}`,
      params: {
        id: item.bani_id,
        // The proper name rather than the server's abbreviated `bani_title` —
        // see the note on the same call in ExploreGurbani.
        title: nameOf(item.bani_id) || item.bani_title || "",
        titleUni: nameOf(item.bani_id) || item.bani_title || "",
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <CustomText style={[styles.sectionTitle, { color: textPrimary }]}>
        {STRINGS.ACTIVITY}
      </CustomText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Last read — tappable, continues bani in Reader */}
        {lastRead && (
          <Pressable
            onPress={() => goToReader(lastRead)}
            style={({ pressed }) => [
              styles.tile,
              { width: tileWidth },
              { backgroundColor: cardBg, borderColor },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
          >
            <View style={styles.tileIconWrap}>
              <BookOpenIcon size={20} color={accentColor} />
            </View>
            <CustomText style={[styles.tileLabel, { color: textPrimary }]} numberOfLines={2}>
              {nameOf(lastRead.bani_id) || lastRead.bani_title || `Bani ${lastRead.bani_id}`}
            </CustomText>
            {fmtDuration(lastRead.total_seconds) !== "" && (
              <CustomText style={[styles.tileMeta, { color: textSecondary }]}>
                {fmtDuration(lastRead.total_seconds)}
              </CustomText>
            )}
          </Pressable>
        )}

        {/* Last listened — tappable, opens bani in Reader */}
        {lastListened && (
          <Pressable
            onPress={() => goToReader(lastListened)}
            style={({ pressed }) => [
              styles.tile,
              { width: tileWidth },
              { backgroundColor: cardBg, borderColor },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
          >
            <View style={styles.tileIconWrap}>
              <HeadphonesIcon size={20} color={accentColor} />
            </View>
            <CustomText style={[styles.tileLabel, { color: textPrimary }]} numberOfLines={2}>
              {nameOf(lastListened.bani_id) || lastListened.bani_title || `Bani ${lastListened.bani_id}`}
            </CustomText>
            {fmtDuration(lastListened.total_seconds) !== "" && (
              <CustomText style={[styles.tileMeta, { color: textSecondary }]}>
                {fmtDuration(lastListened.total_seconds)}
              </CustomText>
            )}
          </Pressable>
        )}

        {/* App link tiles */}
        {APP_TILES.map(({ id, labelKey, label, image, url }) => (
          <Pressable
            key={id}
            onPress={() => openInAppBrowser(url)}
            style={({ pressed }) => [
              styles.tile,
              { width: tileWidth },
              { backgroundColor: cardBg, borderColor },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="link"
            accessibilityLabel={labelKey ? STRINGS[labelKey] : label}
          >
            <View style={styles.tileIconWrap}>
              <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>
                <Image source={image} style={styles.tileIconInner} resizeMode="contain" />
              </View>
            </View>
            <CustomText style={[styles.tileLabel, { color: textPrimary }]}>
              {labelKey ? STRINGS[labelKey] : label}
            </CustomText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default FeatureTilesRow;
