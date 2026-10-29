import React, { useCallback, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { androidLineHeight } from "@theme/lineHeight";
import PropTypes from "prop-types";
import { gurmukhiToDevanagari } from "@common/gurmukhiToDevanagari";
import { CustomText, STRINGS } from "@common";
import {
  getWordOfDay,
  getNextEvent,
  isBundledWord,
  isBundledEvent,
} from "../../services/dashboard";
import DashboardCard from "./DashboardCard";
import useDashboardTheme from "./dashboardTheme";
import SectionError from "./SectionError";
import SectionLabel from "./SectionLabel";
import SkeletonBlock from "./SkeletonBlock";
import useAsyncSection from "./useAsyncSection";
import useRefetchOnReconnect from "./useRefetchOnReconnect";

const Discover = ({ refreshKey = 0 }) => {
  // Word of the Day and Upcoming sit side by side, each on half the width.
  // That column stops working once the text inside outgrows it — "Pure,\n  // selfless\n divine love." one word per line. No flex tweak helps: the column
  // is genuinely too narrow, so below a threshold the pair stacks instead.
  //
  // The test is the RATIO, not either number alone: the column shrinks with the
  // screen (a raised display size) while the text grows with the OS font
  // setting, and it is the two together that break it.
  const { width, fontScale } = useWindowDimensions();
  const columnWidth = (width - 40 - 14) / 2; // page gutters + the row gap
  // 120 is the narrowest column the pair still reads well in at text scale 1;
  // the requirement grows with the setting. Tuned so nothing changes for a
  // default phone — stacking is for the sizes that are already broken.
  const stacked = columnWidth < 120 * Math.min(fontScale || 1, 1.5);

  const { accentBlue, gold, theme, c } = useDashboardTheme();
  // Thick (bolder) Gurbani weight so the featured word carries the same visual
  // prominence a fontWeight override would have given a Latin font — already
  // the boldest Gurbani variant registered, so no further bolding is applied.
  const gurbaniFont = theme.typography.fonts.gurbaniThick;
  // Client-specified accents — main card texts / secondary card texts, light
  // mode only; dark keeps the existing primaryText/mutedText pairing. The
  // upcoming "days away" number instead gets its own dark-mode value.
  // Hero values (featured word + days-away count) match the "This week" / month
  // title color exactly.
  const cardMainColor = c.textPrimary;
  const cardSecondaryColor = c.textSecondary;
  const upcomingNumColor = c.textPrimary;
  const [word, setWord] = useState(null);
  const [event, setEvent] = useState(null);

  // The word is ALWAYS shown in Gurmukhi, whatever the app language. It is a
  // Gurbani word — showing only its transliteration hides the thing being
  // taught, and the pairing with a second line is how the word is learnt.
  //
  // The second line is that word in the READER's own script: Devanagari under
  // Hindi (derived on the fly, since the feed carries only Gurmukhi + roman),
  // and the roman form everywhere else.
  const lang = STRINGS.getLanguage();
  const displayWord = word ? word.gurmukhi : "—";
  const secondLine = (() => {
    if (!word) return "";
    if (lang === "hi") return gurmukhiToDevanagari(word.gurmukhi);
    return word.transliteration ?? "";
  })();
  // Gurmukhi always, so always the Gurbani face.
  const wordFont = gurbaniFont;

  // Each tile fetches (and can fail/retry) independently, so a broken
  // upcoming-event lookup never takes the word-of-day tile down with it.
  const wordTask = useCallback(
    () => getWordOfDay().then(setWord),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );
  const wordSection = useAsyncSection(wordTask);

  // Cold-start only, deliberately NOT keyed on refreshKey — the upcoming-events
  // list changes at most daily (and has its own day-scoped cache besides), so
  // refetching on every Dashboard focus is unnecessary. Only refires if this
  // component actually unmounts and remounts (a real app cold start), not on
  // every tab switch back to Dashboard.
  const eventTask = useCallback(() => getNextEvent().then(setEvent), []);
  const eventSection = useAsyncSection(eventTask);

  // Both services fall back to a bundled list when there is no internet, so a
  // device that was offline at mount would otherwise keep showing that fallback
  // for the whole session — Upcoming especially, since it never refetches on
  // focus. Data that came from the API or the day-scoped cache is real and is
  // left alone, so a reconnect costs nothing in the normal case.
  useRefetchOnReconnect(isBundledWord(word), wordSection.retry);
  useRefetchOnReconnect(isBundledEvent(event), eventSection.retry);

  return (
    <View>
      <SectionLabel title={STRINGS.DISCOVER} />
      <View style={[styles.row, stacked && styles.rowStacked]}>
        {/* Word of the Day */}
        <DashboardCard style={styles.card}>
          <CustomText style={[styles.cardTag, { color: gold }]}>
            {STRINGS.WORD_OF_DAY.toUpperCase()}
          </CustomText>
          {wordSection.loading ? (
            <View style={styles.skeletonInner}>
              <SkeletonBlock style={styles.lineSkeletonWide} />
              <SkeletonBlock style={styles.lineSkeletonNarrow} />
              <SkeletonBlock style={styles.lineSkeletonBlock} />
            </View>
          ) : null}
          {!wordSection.loading && wordSection.error ? (
            <SectionError compact onRetry={wordSection.retry} />
          ) : null}
          {!wordSection.loading && !wordSection.error ? (
            <>
              <CustomText
                style={[
                  styles.word,
                  {
                    color: cardMainColor,
                    fontFamily: wordFont,
                    // Faux-bold to match the streak count / practice numbers.
                    textShadowColor: cardMainColor,
                    textShadowOffset: { width: 0.5, height: 0 },
                    textShadowRadius: 0.4,
                  },
                ]}
                numberOfLines={1}
              >
                {displayWord}
              </CustomText>
              <CustomText
                style={[styles.translit, { color: cardSecondaryColor }]}
                numberOfLines={1}
              >
                {/* Devanagari under Hindi, roman elsewhere. The line above is
                    always Gurmukhi, so this is never a duplicate of it. */}
                {secondLine}
              </CustomText>
              <CustomText style={[styles.meaning, { color: cardSecondaryColor }]} numberOfLines={4}>
                {word?.meaning ?? ""}
              </CustomText>
            </>
          ) : null}
        </DashboardCard>

        {/* Upcoming event */}
        <DashboardCard style={styles.card}>
          <CustomText style={[styles.cardTag, { color: accentBlue }]}>
            {STRINGS.UPCOMING.toUpperCase()}
          </CustomText>
          {eventSection.loading ? (
            <View style={styles.skeletonInner}>
              <SkeletonBlock style={styles.lineSkeletonWide} />
              <SkeletonBlock style={styles.lineSkeletonNarrow} />
              <SkeletonBlock style={styles.lineSkeletonBlock} />
            </View>
          ) : null}
          {!eventSection.loading && eventSection.error ? (
            <SectionError compact onRetry={eventSection.retry} />
          ) : null}
          {!eventSection.loading && !eventSection.error ? (
            <>
              <CustomText
                style={[
                  styles.bigNum,
                  {
                    color: upcomingNumColor,
                    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
                    // Faux-bold to match the streak count / practice numbers.
                    textShadowColor: upcomingNumColor,
                    textShadowOffset: { width: 0.5, height: 0 },
                    textShadowRadius: 0.4,
                  },
                ]}
              >
                {event ? event.daysAway : "—"}
              </CustomText>
              <CustomText style={[styles.translit, { color: cardSecondaryColor }]}>
                {event ? STRINGS.DAYS_AWAY : ""}
              </CustomText>
              <CustomText
                style={[styles.eventName, { color: cardMainColor }]}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {event?.name ?? ""}
              </CustomText>
              {event?.subtitle ? (
                <CustomText
                  style={[styles.meaning, { color: cardSecondaryColor }]}
                  numberOfLines={1}
                >
                  {event.subtitle}
                </CustomText>
              ) : null}
            </>
          ) : null}
        </DashboardCard>
      </View>
    </View>
  );
};

Discover.propTypes = { refreshKey: PropTypes.number };

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, paddingHorizontal: 20 },
  // One card per line. `flex: 1` on the cards still applies but means nothing
  // in a column, so each simply takes the full width.
  rowStacked: { flexDirection: "column" },
  // No fixed aspectRatio — a long shabad's translation needs to grow the card
  // instead of being clipped by a locked square height.
  card: { flex: 1, padding: 16 },
  cardTag: { fontSize: 10, fontWeight: "600", letterSpacing: 0.8, marginBottom: 6 },
  word: { fontSize: 20, lineHeight: androidLineHeight(26) },
  bigNum: { fontSize: 20, lineHeight: androidLineHeight(24) },
  translit: { fontSize: 12, marginTop: 2 },
  meaning: { fontSize: 12, marginTop: 6, lineHeight: androidLineHeight(16) },
  eventName: { fontSize: 12, fontWeight: "600", marginTop: 5, lineHeight: androidLineHeight(15) },
  skeletonInner: { gap: 8, marginTop: 4 },
  lineSkeletonWide: { width: "70%", height: 20 },
  lineSkeletonNarrow: { width: "50%", height: 14 },
  lineSkeletonBlock: { width: "100%", height: 30 },
});

export default Discover;
