import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";
import { useSelector } from "react-redux";
import { androidLineHeight } from "@theme/lineHeight";
import PropTypes from "prop-types";
import { formatWeekdayLong, formatDayMonth } from "@common/dateLocale";
import { CloseIcon, PersonIcon } from "@common/icons";
import { CustomText, STRINGS } from "@common";
import { getNanakshahiDate, fetchNanakshahiDate } from "../../services/dashboard";
import { useSyncStatus, formatSyncLine } from "../../services/dashboard/syncStatus";
import { useNowTick } from "../../services/dashboard/useNowTick";
import useDashboardTheme from "./dashboardTheme";

const MenuIcon = ({ color }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
  >
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Line x1="3" y1="12" x2="21" y2="12" />
    <Line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
);
MenuIcon.propTypes = { color: PropTypes.string.isRequired };

// The Fateh, broken at its own halfway point rather than wherever the line
// happens to run out. Left to wrap on its own, the closing ॥ was landing alone
// on the second line; the two halves are also how it is conventionally written.
// The no-break space binds each ॥ to the word before it, so the mark can never
// be orphaned even if a half has to wrap on a very narrow screen.
const FATEH = "ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ ॥\nਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥";

const DashboardHeader = ({
  onMenuPress = () => {},
  onClosePress = () => {},
  onAvatarPress = () => {},
}) => {
  const { mutedText, theme, c, layout, palette } = useDashboardTheme();
  const { top: safeTop } = useSafeAreaInsets();

  // Signed-in account, for the avatar only. The header deliberately shows no
  // greeting — the Fateh is its title — so this changes the glyph inside the
  // existing circle and nothing else.
  const authUser = useSelector((state) => state.auth.user);
  // The STATUS, not just the user: "unknown" (the Keychain read has not
  // resolved yet) has to stay distinguishable from "signedOut", or every cold
  // start tells a signed-in person their progress is not being saved.
  const authStatus = useSelector((state) => state.auth.status);
  const avatarInitial = (authUser?.firstname || authUser?.email || "")
    .trim()
    .charAt(0)
    .toUpperCase();

  // The Fateh is the header's TITLE, so it takes the headline colour the cards
  // use — the brand blue in light, white in dark. It was gold, which is this
  // screen's DECORATIVE accent (the streak flame, the Vaak tab): a heading in a
  // decorative colour reads as a badge rather than as the page's title, and the
  // gold measures 2.2:1 on the light ground, well under the 4.5:1 text needs.
  // Taken from the palette rather than written here, so a designed theme
  // re-derives it with everything else (see themedScreenPalette).
  const fatehColor = palette.brandText;
  // Date line under the Fateh — a brand tint, quieter than the Fateh itself.
  const belowNameColor = palette.subtleText;
  // The one Dashboard blue, not a second brand pair.
  const avatarTextColor = c.textBrand;
  // The one header foreground — brand navy in light, white in dark, independent
  // of the golden Fateh it sits next to. Matches the Seva header's cross.
  const closeIconColor = c.headerFg;

  // Seeded from the bundled table so the line is complete on the first frame —
  // a date that appears a beat after everything else reads as a fault, and the
  // two agree in the ordinary case anyway (the table holds the same SGPC month
  // starts the backend serves). The remote value then replaces it, which is
  // what lets a correction upstream reach users without an app release.
  const [nanakLabel, setNanakLabel] = useState(() => getNanakshahiDate(new Date()).label);

  useEffect(() => {
    let active = true;
    // Resolves null rather than throwing when there is nothing better to show,
    // so an outage simply leaves the bundled label in place.
    fetchNanakshahiDate().then((remote) => {
      if (active && remote?.label) setNanakLabel(remote.label);
    });
    return () => {
      active = false;
    };
  }, []);

  const dateLine = useMemo(() => {
    const now = new Date();
    return `${formatWeekdayLong(now)} · ${formatDayMonth(now)} · ${nanakLabel}`;
    // STRINGS.getLanguage() so the weekday and month re-localise on a language
    // switch, exactly as the sync label below does.
  }, [nanakLabel, STRINGS.getLanguage()]);

  // Diagnostic, for the cloud sync push (see services/dashboard/syncStatus).
  //
  // It used to show only a timestamp, so a device that had never pushed read
  // "never" whether the push was skipped before it started or the server
  // refused it — and those need opposite fixes. It now carries the reason.
  // Live: re-renders the moment a push or pull is recorded, so a sync that
  // completes while this screen is open is visible immediately. STRINGS is read
  // during render, so a language switch relocalises it too.
  const syncStatus = useSyncStatus();
  // Ticks so the relative label stays true while the screen sits open; the sync
  // store alone only fires when a push or pull is recorded.
  const now = useNowTick();
  const syncLine = formatSyncLine({
    status: syncStatus,
    authStatus,
    now,
    strings: STRINGS,
    formatDayMonth,
  });

  const bg = c.backgroundAlt;

  return (
    <View style={[styles.container, { paddingTop: safeTop + 8, backgroundColor: bg }]}>
      <View style={styles.topRow}>
        <CustomText
          style={[
            styles.salutation,
            // GurbaniAkharHeavy is the heaviest Gurmukhi face shipped, so the
            // weight lives in the FACE. No fontWeight on top of it: a numeric
            // weight against a named TTF drops the family on Android and the
            // Gurmukhi falls back to the system font.
            { color: fatehColor, fontFamily: theme.typography.fonts.gurbaniHeavy },
          ]}
          // NO line cap, and never shrunk either.
          //
          // adjustsFontSizeToFit would render the Fateh at a different size on
          // every screen width. A line cap is no better: the string carries its
          // own newline, so it is two lines by design, but at a raised OS text
          // size each half can wrap again and needs four — a cap of three cut
          // the last one and left "…ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ …" with the closing ॥
          // ellipsized away. Any fixed number is a guess at a width and a text
          // size, and the one case it gets wrong is the one that truncates
          // scripture.
          //
          // Nothing in this header has a fixed height, so with no cap the block
          // simply takes the lines it needs and the header grows under it.
        >
          {FATEH}
        </CustomText>
        {/* Top-right dismiss, level with the golden salutation line rather
            than down in the avatar/menu row. */}
        <Pressable
          onPress={onClosePress}
          hitSlop={8}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.CLOSE}
        >
          <CloseIcon size={layout.header.closeIconSize} color={closeIconColor} />
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.nameBlock}>
          {/* No account system exists, so there is no name to greet. The Fateh
              above stands in its place as the header's title. */}
          {/* Gregorian + Nanakshahi date line. */}
          {/* Two lines: "Thursday · August 13, 2026 · 30 Sawan 557" does not fit
              on one at a raised text size, and a date clipped mid-month reads
              as broken rather than abbreviated. */}
          <CustomText style={[styles.date, { color: belowNameColor }]} numberOfLines={2}>
            {dateLine}
          </CustomText>
          {/* Either "Last synced: 2 mins ago" or, signed out, the nudge that the
              work being done here is not being kept anywhere. Null while auth is
              still unknown, so neither claim is made before it is true.

              NO line cap, for the same reason the Fateh above has none: the
              signed-out sentence is long, longer again in Punjabi and Hindi, and
              longer still at a raised OS text size. Any fixed number is a guess
              at a width, and the case it gets wrong is the one that truncates
              the message telling someone their progress is at risk. The header
              has no fixed height, so it simply grows. */}
          {syncLine ? (
            <CustomText style={[styles.syncLine, { color: mutedText }]}>{syncLine}</CustomText>
          ) : null}
        </View>

        <View style={styles.controls}>
          {/* The menu button and the avatar are one pair: same circle, same
              fill, same glyph colour. They previously differed in all three,
              which read as two unrelated controls sitting next to each other. */}
          <Pressable
            onPress={onMenuPress}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: palette.headerPill }]}
          >
            <MenuIcon color={avatarTextColor} />
          </Pressable>
          {/* Signed out this starts the Khalis SSO login; signed in it shows
              the account's initial and opens Settings, where the account
              details and sign-out live (one destructive surface, not two). */}
          <Pressable
            onPress={onAvatarPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={authUser ? STRINGS.ACCOUNT : STRINGS.SIGN_IN}
            style={({ pressed }) => [
              styles.avatar,
              { backgroundColor: palette.headerPill },
              pressed && styles.avatarPressed,
            ]}
          >
            {avatarInitial ? (
              <CustomText style={[styles.avatarInitial, { color: avatarTextColor }]}>
                {avatarInitial}
              </CustomText>
            ) : (
              <PersonIcon size={22} color={avatarTextColor} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

DashboardHeader.propTypes = {
  onMenuPress: PropTypes.func,
  onClosePress: PropTypes.func,
  onAvatarPress: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    // Top-aligned so the dismiss button stays level with the Fateh's first
    // line instead of drifting down when it wraps to two.
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  salutation: {
    fontSize: 19,
    lineHeight: androidLineHeight(28),
    flex: 1,
    paddingRight: 8,
  },
  closeBtn: {
    padding: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameBlock: {
    flex: 1,
    paddingRight: 12,
  },
  date: {
    fontSize: 13,
    lineHeight: androidLineHeight(18),
    fontWeight: 650,
    marginTop: 2,
  },
  syncLine: {
    fontSize: 11,
    lineHeight: androidLineHeight(15),
    marginTop: 2,
    opacity: 0.7,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // The menu button and the avatar sit side by side, so they share one circle.
  // They were 42 and 46, which reads as a mistake rather than a hierarchy.
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPressed: {
    opacity: 0.7,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "600",
  },
});

export default DashboardHeader;
