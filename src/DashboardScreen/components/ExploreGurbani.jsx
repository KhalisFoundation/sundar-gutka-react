import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Image, Platform } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { brandMarks } from "@theme/palette";
import PropTypes from "prop-types";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { openAppLink } from "@common/openAppLink";
import { CustomText, STRINGS, constant, actions, trackDashboardEvent } from "@common";
import { getRecentReadBanis, getRecentListenedBanis } from "../../database/analytics";
import { getRestoredTopBanis } from "../../services/dashboard";
import { bundledExploreLinks } from "../../services/dashboard/exploreBundled";
import { getExploreLinks } from "../../services/dashboard/exploreLinks";
import DashboardCard, { CARD_SHADOW_BLEED } from "./DashboardCard";
import useDashboardTheme from "./dashboardTheme";
import SectionLabel from "./SectionLabel";
import SkeletonBlock from "./SkeletonBlock";
import { plateFor } from "./tilePlate";
import useAsyncSection from "./useAsyncSection";
import useBaniLookup from "@common/hooks/useBaniLookup";

// Sri Darbar Sahib, cut out of its white background and cropped to the
// building. It replaces a stroked vector glyph of the same subject, which at
// this size read as a scribble. A drawing rather than a logotype, so it is
// sized as one — see ILLUSTRATION_SIZE.
const DARBAR_MARK = require("../../assets/images/darbar-sahib-mark.png");
const KHALIS_LOGO = require("../../assets/images/khalis.png");
const STTM_LOGO = require("../../assets/images/sikhi2max.webp");
const SEHAJ_PATH_LOGO = require("../../assets/images/sehajpath.webp");
const SHABADAVALI_LOGO = require("../../assets/images/shabadavali.png");

// An illustration needs more of the box than a logotype does: a logo is a
// simple mark that still reads at 32, where a drawing of a building has domes,
// arches and a balustrade to resolve. `contain` keeps the aspect, so 40 renders
// the darbar at 40x33 with a few points of air on every side. A module constant
// rather than a StyleSheet entry so the image keeps one stable style reference.
const ILLUSTRATION_SIZE = { width: 40, height: 40 };

const BookIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);
BookIcon.propTypes = { color: PropTypes.string.isRequired };

const HeadphonesIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);
HeadphonesIcon.propTypes = { color: PropTypes.string.isRequired };

// A globe, for a tile whose icon key this build does not bundle — a tile the
// backend added after this version shipped. Drawn in the theme's tile-icon
// colour like the book and headphones, so it belongs to the row rather than
// looking like a missing image.
const LinkIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
    <Path d="M2 12h20" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);
LinkIcon.propTypes = { color: PropTypes.string.isRequired };

// The Gurdham mark, as supplied. It replaces the location pin that stood in
// while no artwork existed.
//
// Its own colours, not the theme's: this is brand artwork, like the Khalis and
// Shabadavali logos beside it, so it looks the same in both themes. The stops
// come from `palette.brandMarks` for the same reason the social marks do —
// fixed values still belong in one place.
//
// Sized to the same 32pt box as the logo IMAGES rather than the 22pt stroked
// glyphs, since it reads as a logo; the viewBox is taller than it is wide, so
// the width is derived from that ratio to avoid distorting it.
const GurdhamIcon = ({ mode }) => (
  <Svg width={(32 * 76) / 88} height={32} viewBox="0 0 76 88" fill="none">
    <Defs>
      {/* Both stops lift in dark mode — the light-mode bottom stop is a
          near-black indigo that disappears into the card. */}
      <LinearGradient id="gurdham" x1={38} y1={2} x2={38} y2={86} gradientUnits="userSpaceOnUse">
        <Stop stopColor={brandMarks.gurdham.gradientTop[mode]} />
        <Stop offset={1} stopColor={brandMarks.gurdham.gradientBottom[mode]} />
      </LinearGradient>
    </Defs>
    <Path
      d="M71.5342 74.568C70.3507 76.1586 71.0411 82.8521 71.5342 86L4.46575 85.503C5.45206 84.0118 5.45206 76.5562 4.46575 74.568C3.67671 72.9775 4.13699 72.2485 4.46575 72.0828C2.49315 70.8899 2 68.9349 2 68.1065L3.47945 68.6036C-1.94521 48.2249 20.2466 37.787 24.6849 35.7988C28.2356 34.2083 30.4384 31.8225 31.0959 30.8284C29.9123 28.4426 31.9178 27.8462 33.0685 27.8462C33.8575 24.2675 35.3699 23.0414 36.0274 22.8757C36.8164 21.6828 36.6849 21.0533 36.5205 20.8876C35.337 19.297 36.3562 17.9053 37.0137 17.4083C37.4082 17.0107 37.1781 16.5799 37.0137 16.4142C35.0411 16.0166 36.1918 14.9231 37.0137 14.426C37.4082 13.2331 37.1781 12.6036 37.0137 12.4379C35.8301 10.8473 36.8223 9.78698 37.4663 9.45562V7.92178C36.734 7.11577 37.1839 5.63329 37.5069 4.98225V2H38.4932V4.98225C39.2822 6.57278 38.8219 7.63314 38.4932 7.9645V9.45562C39.9726 9.95266 39.4795 11.9408 38.9863 12.4379C38.5918 12.8355 38.8219 13.929 38.9863 14.426C40.5644 15.6189 39.6438 16.2485 38.9863 16.4142C38.5918 16.8118 38.8219 17.2426 38.9863 17.4083C40.5644 18.6012 39.9726 20.2249 39.4795 20.8876C39.0849 21.2852 39.6438 22.3787 39.9726 22.8757C41.1562 23.2734 42.4384 26.355 42.9315 27.8462C45.6932 28.2438 45.3973 29.6686 44.9041 30.3314C44.9041 31.9219 49.1781 34.6391 51.3151 35.7988C74.1973 45.7396 74.9863 61.8107 72.5205 68.6036L74 68.1065C73.5068 72.5799 70.5479 71.0888 71.5342 72.0828C72.3233 72.8781 71.863 74.071 71.5342 74.568Z"
      fill="url(#gurdham)"
    />
    <Path
      d="M37.5068 1C36.9546 1.00001 36.5068 1.44772 36.5068 2V4.77051C36.335 5.17091 36.1602 5.71088 36.0967 6.2832C36.034 6.8481 36.0646 7.59554 36.4658 8.24512V8.93164C36.1274 9.21664 35.7996 9.61665 35.6133 10.1377C35.2999 11.0146 35.4604 12.0208 36.209 13.0293C36.2141 13.0495 36.2231 13.084 36.2275 13.1348C36.2387 13.2623 36.2326 13.4793 36.1553 13.7969C36.0049 13.9048 35.8523 14.0253 35.71 14.1572C35.474 14.376 35.1818 14.6992 35.0293 15.1074C34.9482 15.3247 34.8954 15.5967 34.9424 15.8965C34.9908 16.2053 35.1342 16.4752 35.3379 16.6914C35.4956 16.8587 35.6865 16.9883 35.8945 17.0928C35.5852 17.4412 35.2912 17.8969 35.1221 18.4414C34.8499 19.3181 34.9284 20.3508 35.6387 21.3701C35.621 21.4846 35.5557 21.7134 35.3506 22.0684C34.8274 22.3258 34.2799 22.8118 33.7861 23.4961C33.2173 24.2845 32.6727 25.3965 32.2656 26.9189C31.6906 27.0199 31.0441 27.244 30.5381 27.6992C30.1222 28.0733 29.8149 28.5944 29.748 29.2559C29.7017 29.7149 29.7775 30.194 29.9531 30.6895C29.1245 31.7131 27.1931 33.5791 24.2764 34.8857C22.034 35.8902 15.2368 39.0574 9.67773 44.5967C4.40313 49.8525 0.174388 57.3293 2.10938 67.1133C1.86622 67.0865 1.61866 67.1492 1.41602 67.2949C1.1549 67.4828 1.00002 67.7847 1 68.1064C1 69.0602 1.4643 70.938 3.11914 72.3408C2.93137 73.0566 3.06506 73.9942 3.57031 75.0127C3.7359 75.3467 3.90662 76.0394 4.02832 77.0283C4.1456 77.9816 4.20507 79.1046 4.20508 80.2217C4.20508 81.3398 4.14548 82.4287 4.0293 83.3145C3.97112 83.7579 3.90047 84.1352 3.82227 84.4316C3.73961 84.7449 3.66545 84.9003 3.63184 84.9512C3.42947 85.2571 3.41054 85.6499 3.58301 85.9736C3.75548 86.2971 4.09145 86.5001 4.45801 86.5029L71.5264 87C71.8199 87.0022 72.1003 86.8756 72.292 86.6533C72.4835 86.4311 72.5677 86.1355 72.5225 85.8457C72.2801 84.2985 71.9887 81.8782 71.9043 79.6621C71.862 78.5521 71.8729 77.5204 71.96 76.6865C72.0532 75.7936 72.2181 75.3247 72.3369 75.165C72.3478 75.1504 72.3581 75.1353 72.3682 75.1201C72.5989 74.7712 72.8649 74.2042 72.9453 73.5615C72.996 73.1561 72.9745 72.6853 72.7969 72.2256C73.2351 71.9959 73.7057 71.6303 74.1035 71.0244C74.5438 70.3536 74.8587 69.4446 74.9941 68.2158C75.0314 67.8767 74.8926 67.5422 74.627 67.3281C74.446 67.1823 74.2232 67.1068 73.9971 67.1074C74.8303 63.4598 74.754 58.3473 72.335 52.9717C69.4694 46.6039 63.3559 39.9503 51.7617 34.9023C50.7237 34.3371 49.1856 33.4051 47.916 32.4326C47.2724 31.9396 46.7302 31.4605 46.3584 31.0352C46.173 30.8231 46.0489 30.6464 45.9756 30.5078C45.9731 30.5031 45.9721 30.4977 45.9697 30.4932C46.2115 29.9961 46.3636 29.3096 46.0576 28.5957C45.6972 27.7553 44.8559 27.2351 43.6836 26.9688C43.4152 26.2354 43.0357 25.3208 42.5957 24.4854C42.3152 23.9528 41.9946 23.4229 41.6455 22.9863C41.3949 22.6729 41.0711 22.3318 40.6738 22.1025C40.5721 21.9236 40.467 21.7137 40.4014 21.5215C40.3801 21.4592 40.368 21.4089 40.3594 21.3711C40.6766 20.904 40.9939 20.1875 41.0098 19.3662C41.0251 18.5717 40.7552 17.7373 40.0557 17.0215C40.3126 16.8485 40.6164 16.5666 40.7676 16.1367C41.0833 15.2387 40.5615 14.4528 39.8633 13.8506C39.8235 13.6866 39.7877 13.4975 39.7744 13.3203C39.7651 13.1959 39.7698 13.1072 39.7773 13.0527C40.0025 12.7927 40.164 12.4645 40.2695 12.1631C40.3946 11.806 40.4795 11.3827 40.4795 10.9463C40.4794 10.512 40.3938 10.0148 40.127 9.55762C39.9685 9.28614 39.756 9.04981 39.4932 8.8584V8.29395C39.9642 7.53764 40.1661 6.27769 39.4932 4.7666V2C39.4932 1.44772 39.0454 1.00001 38.4932 1H37.5068ZM40.2461 21.5254C40.2299 21.5472 40.2114 21.5696 40.1895 21.5918C40.21 21.5711 40.2275 21.5478 40.2461 21.5254Z"
      stroke={brandMarks.gurdham.outline}
      strokeOpacity={0.2}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

GurdhamIcon.propTypes = { mode: PropTypes.oneOf(["light", "dark"]).isRequired };

// The artwork a tile's `icon` key names. Icons are app assets — a database can
// point at one but cannot ship one — so the backend's tile list carries keys
// and this map turns them into pictures. A key this build does not know draws
// the globe, so a tile added after this version shipped still renders.
//
// The darbar is an ILLUSTRATION: it needs the deep plate (gold and white
// marble vanish on a pale one) and the larger box — see ILLUSTRATION_SIZE.
const TILE_ICONS = {
  sttm: { image: STTM_LOGO },
  darbar: { image: DARBAR_MARK, illustration: true },
  khalis: { image: KHALIS_LOGO },
  sehajpath: { image: SEHAJ_PATH_LOGO },
  shabadavali: { image: SHABADAVALI_LOGO },
  gurdham: { Component: GurdhamIcon },
};

const TileArtwork = ({ icon, mode, fallbackColor }) => {
  const art = icon ? TILE_ICONS[icon] : null;
  if (!art) return <LinkIcon color={fallbackColor} />;
  if (art.Component) return <art.Component mode={mode} />;
  return (
    <Image
      source={art.image}
      style={art.illustration ? ILLUSTRATION_SIZE : styles.iconImg}
      resizeMode="contain"
    />
  );
};
TileArtwork.propTypes = {
  icon: PropTypes.string,
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  fallbackColor: PropTypes.string.isRequired,
};
TileArtwork.defaultProps = { icon: null };

const ExploreGurbani = ({ refreshKey = 0 }) => {
  const { gold, mutedText, theme, c, palette } = useDashboardTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const language = useSelector((state) => state.language);
  const { nameOf } = useBaniLookup();
  const iconBg = palette.iconPlate;
  // Tile titles match the streak count / username navy.
  const titleColor = palette.exploreTitle;
  // Tile icons (search / read / listen) go white in dark mode for contrast on the navy card.
  const iconColor = palette.tileIcon;
  // Explicit SemiBold (no fontWeight) — same convention as the header name/streak
  // count, so the titles render the real SemiBold glyph instead of a fake-bold
  // (fontWeight + custom TTF) or Regular fallback that looks like a different font.
  const titleFont = theme.typography.fonts.balooPaajiSemiBold;

  const [lastRead, setLastRead] = useState(null);
  const [lastListened, setLastListened] = useState(null);
  // The app tiles start from the bundled list rather than from nothing, so the
  // row is never empty — not on first launch offline, and not for the moment
  // the network takes to answer. The fetched list replaces it when it lands.
  const [explore, setExplore] = useState(() => ({
    links: bundledExploreLinks(),
    source: "bundled",
  }));

  const task = useCallback(async () => {
    // The tile list and the recent history are independent; neither failing
    // may hide the other, and getExploreLinks never throws.
    const [r, l, links] = await Promise.all([
      getRecentReadBanis(1),
      getRecentListenedBanis(1),
      getExploreLinks({ lang: language }),
    ]);
    setExplore({ links: links.links, source: links.source });
    // Raw session history doesn't survive a reinstall — fall back to the
    // last-read/listened baaniId captured at the last cloud push. nameOf()
    // above already resolves the display name from the static bani
    // reference, so only the id is actually needed here.
    if (r[0]) {
      setLastRead(r[0]);
    } else {
      const restored = await getRestoredTopBanis();
      const baniId = restored?.read?.last?.baaniId;
      setLastRead(baniId != null ? { bani_id: baniId } : null);
    }
    if (l[0]) {
      setLastListened(l[0]);
    } else {
      const restored = await getRestoredTopBanis();
      const baniId = restored?.listen?.last?.baaniId;
      setLastListened(baniId != null ? { bani_id: baniId } : null);
    }
    // refreshKey isn't read above but forces a refetch on screen focus;
    // language is, so a switch re-resolves the labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, language]);

  // No SectionError on failure: these tiles are supplementary personalization,
  // not core content — falling back to "no continue tiles" (same as a genuinely
  // new user) keeps the row from disappearing behind a heavy error block.
  const { loading } = useAsyncSection(task);

  // withAudio = true opens the bani with the audio player active (Continue Listening);
  // false opens it for reading (Continue Reading). The Reader only mounts the
  // AudioPlayer when state.isAudio is true.
  const openReader = (item, withAudio) => {
    trackDashboardEvent(withAudio ? "continue_listening_tap" : "continue_reading_tap", {
      bani_id: item.bani_id,
      // The resolved name, so the report reads without an id lookup.
      bani_title: nameOf(item.bani_id) || item.bani_title,
    });
    dispatch(actions.toggleAudio(withAudio));
    navigation.navigate(constant.READER, {
      key: `Reader-${item.bani_id}`,
      // The proper name, NOT the server's `bani_title`, which is often an
      // abbreviation — the Reader header showed "ਜਪੁਜੀ" opened from here and
      // "ਜਪੁਜੀ ਸਾਹਿਬ" opened from the bani list. This tile already renders
      // `nameOf` for its own label, so it was displaying the full name while
      // handing the Reader the short one.
      params: {
        id: item.bani_id,
        title: nameOf(item.bani_id) || item.bani_title || "",
        titleUni: nameOf(item.bani_id) || item.bani_title || "",
      },
    });
  };

  // Installed app, then its store, then the web — and which one took the tap
  // goes to analytics with the tile, so a campaign can see app opens apart
  // from store visits apart from web fallbacks.
  const openTile = async (tile, index) => {
    const outcome = await openAppLink(tile);
    trackDashboardEvent("explore_tile_tap", {
      tile_id: tile.id,
      // The label as the user read it, so a report needs no id lookup. It is
      // the LOCALISED title, which is what was actually on the tile.
      tile_title: tile.title,
      outcome,
      position: index,
      source: explore.source,
      // Whether this platform had an app route to try at all. Without it a
      // "browser" outcome on a web-only tile looks like a failed app open.
      has_app:
        Platform.OS === "ios"
          ? !!(tile.appLink || tile.iosAppId)
          : !!(tile.appLink || tile.androidPkg),
      badge: tile.badge || null,
      tile_count: explore.links.length,
    });
  };

  // The denominator for those taps: the row as it was seen. Keyed on the id
  // list, so it fires once per distinct set — not per re-render, not per
  // horizontal scroll, and not again when a focus refetch returns the same
  // tiles. A backend change to the list is a new set and reports again.
  const reportedTiles = useRef("");
  useEffect(() => {
    if (loading) return;
    const ids = explore.links.map((t) => t.id).join(",");
    if (!ids || ids === reportedTiles.current) return;
    reportedTiles.current = ids;
    trackDashboardEvent("explore_impression", {
      tile_ids: ids,
      tile_count: explore.links.length,
      source: explore.source,
    });
  }, [loading, explore]);

  const ContinueTile = ({ icon, label, item, withAudio }) => (
    <DashboardCard style={styles.tile}>
      <Pressable
        onPress={() => openReader(item, withAudio)}
        style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          {icon === "book" ? <BookIcon color={iconColor} /> : <HeadphonesIcon color={iconColor} />}
        </View>
        {/* Same allowance as the app tiles — bani names run long in Gurmukhi. */}
        <CustomText
          style={[styles.title, { color: titleColor, fontFamily: titleFont }]}
          numberOfLines={3}
        >
          {nameOf(item.bani_id) || item.bani_title || `Bani ${item.bani_id}`}
        </CustomText>
        <CustomText style={[styles.subtitle, { color: mutedText }]} numberOfLines={2}>
          {label}
        </CustomText>
      </Pressable>
    </DashboardCard>
  );
  ContinueTile.propTypes = {
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    withAudio: PropTypes.bool.isRequired,
  };

  return (
    <View>
      <SectionLabel title={STRINGS.EXPLORE} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {/* While the recent-history lookup is in flight, hold the tiles' place
            with skeletons instead of popping them in after the app tiles. */}
        {loading ? (
          <>
            <DashboardCard style={styles.tile}>
              <SkeletonBlock style={styles.tileSkeleton} />
            </DashboardCard>
            <DashboardCard style={styles.tile}>
              <SkeletonBlock style={styles.tileSkeleton} />
            </DashboardCard>
          </>
        ) : null}

        {/* New users with no read/listen history yet get no tile — never a
            fabricated "Continue" pointing at a bani they've never opened. */}
        {!loading && lastRead ? (
          <ContinueTile
            icon="book"
            label={STRINGS.CONTINUE_READING}
            item={lastRead}
            withAudio={false}
          />
        ) : null}
        {!loading && lastListened ? (
          <ContinueTile
            icon="headphones"
            label={STRINGS.CONTINUE_LISTENING}
            item={lastListened}
            withAudio
          />
        ) : null}

        {explore.links.map((t, index) => {
          const plate = plateFor(t, theme, iconBg);
          return (
          <DashboardCard key={t.id} style={styles.tile}>
            <Pressable
              onPress={() => openTile(t, index)}
              style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}
              accessibilityRole="link"
              accessibilityLabel={t.title}
            >
              <View style={styles.iconRow}>
                <View style={[styles.iconBox, { backgroundColor: plate }]}>
                  <TileArtwork icon={t.icon} mode={theme.mode} fallbackColor={iconColor} />
                </View>
                {t.badge ? (
                  <View style={[styles.badge, { backgroundColor: gold }]}>
                    <CustomText style={[styles.badgeText, { color: c.onGold }]}>{t.badge}</CustomText>
                  </View>
                ) : null}
              </View>
              {/* Three lines, not two: the longest translations ("Rechercher
                  sur SikhiToTheMax") need a third rather than being cut off.
                  The row stretches every tile to the tallest, so allowing it
                  costs alignment nothing. */}
              <CustomText
                style={[styles.title, { color: titleColor, fontFamily: titleFont }]}
                numberOfLines={3}
              >
                {t.title}
              </CustomText>
              <CustomText style={[styles.subtitle, { color: mutedText }]} numberOfLines={2}>
                {t.subtitle}
              </CustomText>
            </Pressable>
          </DashboardCard>
          );
        })}
      </ScrollView>
    </View>
  );
};

ExploreGurbani.propTypes = { refreshKey: PropTypes.number };

const styles = StyleSheet.create({
  // A horizontal ScrollView clips to its bounds, so the row reserves the card
  // shadow's full reach; `scroll` pulls the same amount back off the layout so
  // the extra room costs no visible space.
  row: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: CARD_SHADOW_BLEED,
    paddingBottom: CARD_SHADOW_BLEED,
  },
  scroll: { marginTop: -CARD_SHADOW_BLEED, marginBottom: -CARD_SHADOW_BLEED + 4 },
  // Sized to its content, not to a fixed width. At 128 the text box was 96dp,
  // narrower than the single word "SikhiToTheMax" (~114dp at 16px), so RN split
  // it mid-word; the longer French and Spanish labels truncated outright.
  // minWidth keeps short tiles from looking cramped, maxWidth forces wrapping
  // so one long translation can't stretch a tile across the screen. Tiles are
  // stretched to a common height by the row, so they stay aligned.
  tile: { minWidth: 150, maxWidth: 190 },
  // The padding sits on the Pressable, not the card, and the Pressable fills
  // the card: the row stretches every tile to the tallest one, and a tile
  // with a one-line title used to have a dead band below its text where a
  // tap did nothing.
  tilePress: { flex: 1, paddingHorizontal: 16, paddingVertical: 20 },
  pressed: { opacity: 0.75 },
  iconRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  iconBox: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 14 },
  iconImg: { width: 32, height: 32 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  // Colour comes from c.onGold at render: white on the mid-yellow gold fill
  // measures about 2:1 and fails 1.4.3 outright, in BOTH themes.
  // No fontWeight either — Baloo is a named TTF, so a weight loses the glyph.
  badgeText: { fontSize: 10, letterSpacing: 0.5 },
  // The title carries NO lineHeight, and that is the fix for the gap that opened
  // between a card's title and its subtitle in pa/hi on Realme and on tablets.
  //
  // Baloo Paaji 2 is a 1000upem face with hhea ascent/descent 1157/-614, so its
  // own line box is 1.771em — 28.3pt at this size. Pinning lineHeight to 24 left
  // it 4pt short, and Android answers a too-small box by measuring a line it then
  // never draws (facebook/react-native#53286). That phantom line is what pushed
  // the subtitle down a full 24pt on some cards and not others. The face's own
  // spacing is both correct and self-scaling, so it is left unset — the same
  // conclusion HomeScreen's header title and the Reader header already reached.
  //
  // `includeFontPadding: false` used to sit on both of these and was removed: it
  // is inert next to a lineHeight. RN's CustomLineHeightSpan ends by setting
  // fm.top = fm.ascent and fm.bottom = fm.descent, which are the only two values
  // setIncludePad() would have substituted. It was tested on device and changed
  // nothing. Do not add it back expecting a vertical shift.
  title: { fontSize: 16 },
  // Keeps an explicit value because it wraps (numberOfLines={2}) and the gap
  // between its two lines is worth controlling. 20 clears the clipping floor —
  // ink box 1.541em vs hhea 1.771em leaves 0.091em a side, so 1.589em (19.1pt
  // here) is the minimum before half-leading starts cutting into the glyphs.
  subtitle: { fontSize: 12, lineHeight: 20, marginTop: 3 },
  tileSkeleton: { width: "100%", height: 88 },
});

export default ExploreGurbani;
