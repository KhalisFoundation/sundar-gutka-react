import React, { useState, useCallback, useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { CustomText, STRINGS, openInAppBrowser, trackDashboardEvent } from "@common";
import { getRandomShabad } from "../../services/dashboard";
import DashboardCard from "./DashboardCard";
import useDashboardTheme from "./dashboardTheme";
import RefreshSpinner from "./RefreshSpinner";
import SectionError from "./SectionError";
import SkeletonBlock from "./SkeletonBlock";
import useAsyncSection from "./useAsyncSection";

const ChevronRight = ({ color }) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
ChevronRight.propTypes = { color: PropTypes.string.isRequired };

const RandomShabad = ({ refreshKey = 0, embedded = false, reloadNonce = 0, onLoadingChange = () => {} }) => {
  const { accentBlue, gold, theme, palette } = useDashboardTheme();
  // The card under these is a deep navy panel in BOTH themes, so the text on
  // it is light in both. Following the theme's text roles here put near-black
  // Gurbani on a navy card in light mode.
  const gurmukhiColor = palette.onVaakCard;
  const translationColor = palette.onVaakCardMuted;
  const gurmukhiFont = theme.typography.fonts.gurbaniHeavy;
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const [shabad, setShabad] = useState(null);

  // refreshKey/reloadNonce (the parent's shuffle, when embedded) aren't read
  // below but force a refetch on screen focus / manual shuffle.
  const task = useCallback(
    () => getRandomShabad({ language: transliterationLanguage }).then(setShabad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transliterationLanguage, refreshKey, reloadNonce]
  );
  const { loading, refreshing, error, retry } = useAsyncSection(task);
  // `loading` covers the first fetch only — it deliberately stays false once
  // data is on screen. `refreshing` is what a shuffle actually needs, since
  // every shuffle after the first is a refetch over existing content.
  const busy = loading || refreshing;

  // Reported upward so whichever shuffle control is on screen can spin and
  // refuse repeat taps; otherwise the button looks inert for the ~2s a fetch
  // takes and each extra tap queues another swap.
  useEffect(() => {
    onLoadingChange(busy);
  }, [busy, onLoadingChange]);

  // A local-DB tukk has no ang/raag/shabadId, so hide the Ang·Raag + Read row.
  const showFooter = !!shabad?.shabadId;

  const body = (
    <>
      {/* Standalone: title + shuffle in the header. Embedded: the parent provides
          the tab title + shuffle, so neither is rendered here. */}
      {embedded ? null : (
        <View style={styles.headerRow}>
          <CustomText style={[styles.cardTitle, { color: gold }]}>
            {STRINGS.RANDOM_SHABAD.toUpperCase()}
          </CustomText>
          <Pressable
            onPress={retry}
            disabled={busy}
            hitSlop={8}
            style={({ pressed }) => [
              styles.shuffleBtn,
              { backgroundColor: palette.shufflePillBg },
              pressed && styles.shuffleBtnPressed,
              busy && styles.shuffleBtnBusy,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
          >
            <RefreshSpinner color={accentBlue} spinning={busy} />
            <CustomText style={[styles.shuffleText, { color: accentBlue }]}>
              {STRINGS.SHUFFLE}
            </CustomText>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonBlock style={styles.lineSkeletonWide} />
          <SkeletonBlock style={styles.lineSkeletonWide} />
          <SkeletonBlock style={styles.lineSkeletonNarrow} />
        </View>
      ) : null}

      {!loading && error ? <SectionError compact onRetry={retry} /> : null}

      {!loading && !error
        ? (shabad?.lines ?? []).map((line, i) => (
            <CustomText key={i} style={[styles.gurmukhi, { color: gurmukhiColor, fontFamily: gurmukhiFont }]}>
              {line}
            </CustomText>
          ))
        : null}
      {/* Gurbani only on this card — the translation belongs in the Reader,
          where the user's own translation settings apply. */}

      {!loading && !error && showFooter ? (
        <>
          <View style={[styles.footerDivider, { backgroundColor: translationColor }]} />
          <View style={styles.footer}>
            {/* No line cap. Capped at one, "Ang 1234 · Raag Gauri" clipped the
                moment the OS text size grew — the row shares its width with the
                Read link, which does not shrink. The footer has no fixed
                height, so wrapping simply makes it taller. */}
            {/* The card's OWN muted ink, not the screen's. `mutedText` is paired with
                the light page behind this card, so on the card itself it fell to
                2.42:1 in light mode — below AA, and the reason the Ang line was
                hard to read. `onVaakCardMuted` is the same role measured against
                this card, and the pair is re-derived together for every designed
                theme, so no theme can drift back apart. */}
            <CustomText style={[styles.meta, { color: translationColor }]}>
              {[shabad.ang ? `${STRINGS.ANG} ${shabad.ang}` : null, shabad.raag || null]
                .filter(Boolean)
                .join(" · ")}
            </CustomText>
            <Pressable
              style={styles.readLink}
              hitSlop={6}
              onPress={() => {
                trackDashboardEvent("shabad_open", {
                  shabad_id: shabad.shabadId,
                  ang: shabad.ang,
                  raag: shabad.raag,
                });
                openInAppBrowser(`https://www.sikhitothemax.org/shabad?id=${shabad.shabadId}`);
              }}
            >
              <CustomText style={[styles.readText, { color: gurmukhiColor }]}>
                {STRINGS.READ_SHABAD}
              </CustomText>
              <ChevronRight color={gurmukhiColor} />
            </Pressable>
          </View>
        </>
      ) : null}
    </>
  );

  if (embedded) return body;
  return (
    <View style={styles.wrap}>
      <DashboardCard style={styles.card}>{body}</DashboardCard>
    </View>
  );
};

RandomShabad.propTypes = {
  refreshKey: PropTypes.number,
  embedded: PropTypes.bool,
  reloadNonce: PropTypes.number,
  onLoadingChange: PropTypes.func,
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  card: { padding: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 12, fontWeight: "600", letterSpacing: 1.2 },
  skeletonWrap: { alignItems: "center", gap: 10, paddingVertical: 18 },
  lineSkeletonWide: { width: "80%", height: 18 },
  lineSkeletonNarrow: { width: "55%", height: 18 },
  gurmukhi: {
    fontSize: 19,
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 31,
    paddingHorizontal: 4,
  },
  footerDivider: { height: 1, marginVertical: 16 },
  // `space-between` only produces a gap while there is room to spare. Once the
  // raag and the link together exceed the row the gap collapses to nothing,
  // they butt together and the link runs off the card. An explicit gap
  // survives that, and the meta yields so the actionable half stays whole.
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  meta: { fontSize: 13, flexShrink: 1 },
  // Shrinks and wraps like the "Ang · Raag" meta it sits beside. It was
  // flexShrink 0, so at a raised OS text size the meta gave way and this did
  // not — one half of the footer wrapping while the other held its line read as
  // lopsided. Both halves now yield, and the chevron keeps its size either way.
  readLink: { flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 1 },
  readText: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  // Dimmed while a shabad is in flight, so the control reads as busy rather
  // than broken when it stops responding to taps.
  shuffleBtnBusy: { opacity: 0.6 },
  // Instant acknowledgement on touch-down, before any async work starts.
  shuffleBtnPressed: { opacity: 0.5 },
  shuffleText: { fontSize: 13, fontWeight: "600" },
});

export default RandomShabad;
