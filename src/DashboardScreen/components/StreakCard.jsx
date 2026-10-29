import React, { useState, useCallback, useMemo } from "react";
import { View, ScrollView, Image, Pressable, StyleSheet } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { weekdayNarrow } from "@common/dateLocale";
import PropTypes from "prop-types";
// Aliased: this file already defines its own local ChevronRight (the
// flower-strip scroll hint below) — importing the shared icon under the same
// name would collide with it.
import { ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "@common/icons";
import { CustomText, STRINGS, constant, showInfoToast, trackDashboardEvent } from "@common";
import { getOrCreateSummary, getDailyActivity } from "../../database/analytics";
import { dayQualifies, getLocalDate } from "../../services/streakDays";
import useDashboardTheme from "./dashboardTheme";
import DayDetailModal from "./DayDetailModal";
import SectionError from "./SectionError";
import SkeletonBlock from "./SkeletonBlock";
import useAsyncSection from "./useAsyncSection";
import weekRangeLabel from "./weekRangeLabel";

// 13 lotus growth stages: flower_1 (base) → flower_14 (max bloom).
// flower_6 (the old "21" stage) is intentionally dropped per design.
const FLOWERS = [
  require("../../assets/images/lotus/flower_1.png"),
  require("../../assets/images/lotus/flower_2.png"),
  require("../../assets/images/lotus/flower_3.png"),
  require("../../assets/images/lotus/flower_4.png"),
  require("../../assets/images/lotus/flower_5.png"),
  require("../../assets/images/lotus/flower_7.png"),
  require("../../assets/images/lotus/flower_8.png"),
  require("../../assets/images/lotus/flower_9.png"),
  require("../../assets/images/lotus/flower_10.png"),
  require("../../assets/images/lotus/flower_11.png"),
  require("../../assets/images/lotus/flower_12.png"),
  require("../../assets/images/lotus/flower_13.png"),
  require("../../assets/images/lotus/flower_14.png"),
];

// Streak (days) required to reach each of the 13 stages. Stage 1 starts at day 1.
const THRESHOLDS = [1, 2, 5, 10, 15, 30, 45, 60, 90, 120, 180, 270, 365];

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  hero: { width: 88, height: 88 },
  streakText: { flex: 1 },
  streakLine: {},
  bigNum: { fontSize: 30 },
  dayStreak: { fontSize: 16 },
  sub: { fontSize: 12, marginTop: 2 },
  flowerStripWrap: { position: "relative" },
  flowerStrip: { gap: 14, paddingTop: 16, paddingRight: 22, alignItems: "flex-end" },
  flowerCol: { alignItems: "center", gap: 4 },
  flowerImg: { width: 44, height: 44 },
  flowerImgFuture: { opacity: 0.28 },
  flowerLabel: { fontSize: 11, fontWeight: "600" },
  flowerScrollHint: {
    position: "absolute",
    right: 0,
    top: 16,
    bottom: 0,
    justifyContent: "center",
    opacity: 0.6,
  },
  // Heading for the week strip below. fontWeight (no fontFamily beside it) so
  // CustomText resolves the real SemiBold face — see the numFont note in the
  // component. Size and colour come from the caller, matching the chart's.
  weekTitle: { paddingTop: 18, fontWeight: "600" },
  // 6, not 18: the heading above it now carries the gap that used to sit here.
  weekNavRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 6 },
  weekRow: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  dayCol: { flex: 1, alignItems: "center", gap: 6 },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { fontSize: 12, fontWeight: "500" },
  heroSkeleton: { width: 88, height: 88, borderRadius: 44 },
  lineSkeletonBig: { width: 150, height: 26, marginBottom: 8 },
  lineSkeletonSmall: { width: 190, height: 14 },
  dotSkeleton: { width: 34, height: 34, borderRadius: 17 },
});

const CheckIcon = ({ color }) => (
  <Svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
CheckIcon.propTypes = { color: PropTypes.string.isRequired };

const ChevronRight = ({ color }) => (
  <Svg
    width={14}
    height={14}
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

const hasAnyActivity = (row) =>
  !!row && ((row.reading_seconds ?? 0) > 0 || (row.listening_seconds ?? 0) > 0);

// Monday-first week (M T W T F S S) containing the day `offsetWeeks` weeks
// before today — 0 = the week containing today.
const weekDatesForOffset = (offsetWeeks) => {
  const anchor = new Date();
  anchor.setDate(anchor.getDate() - offsetWeeks * 7);
  const mondayOffset = (anchor.getDay() + 6) % 7; // days since Monday
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const StreakCard = ({ refreshKey = 0 }) => {
  const { mutedText, accentBlue, separator, theme, palette } = useDashboardTheme();
  // A done day is green — see `streakDone` in screenPalettes for the pairing
  // and why the tick colour differs by mode.
  const doneFill = palette.streakDone;
  const doneTick = palette.onStreakDone;
  // Streak number matches the username: brand blue (light) / off-white (dark).
  const numColor = palette.brandText;
  const dayStreakColor = palette.statLabel;
  // Text below the streak count — same client-specified accent as the date
  // line under the username in DashboardHeader.
  const belowStreakColor = palette.subtleText;
  // Explicit fontFamily (no fontWeight alongside it) — these are custom TTFs, not
  // system fonts, so pairing them with a numeric fontWeight makes Android
  // synthesize a fake bold/medium and silently fall back off the real glyph.
  const numFont = theme.typography.fonts.balooPaajiSemiBold;
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [days, setDays] = useState([]);
  const [modalDate, setModalDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  // Measured width of the 7-column day strip (between the two nav arrows), so
  // the dots can shrink on a narrow phone instead of overflowing/clipping —
  // same approach as MonthCalendar's responsive day circles.
  const [weekRowWidth, setWeekRowWidth] = useState(0);
  const dotSize = useMemo(() => {
    if (!weekRowWidth) return 34;
    const column = weekRowWidth / 7;
    return Math.round(Math.max(24, Math.min(34, column - 10)));
  }, [weekRowWidth]);

  const task = useCallback(async () => {
    const summary = await getOrCreateSummary();
    if (summary) {
      setCurrent(summary.current_streak ?? 0);
      setLongest(summary.longest_streak ?? 0);
    }

    const weekDates = weekDatesForOffset(weekOffset);

    // Activity for the month(s) this week touches.
    const months = new Set(weekDates.map((d) => `${d.getFullYear()}-${d.getMonth() + 1}`));
    const monthRows = await Promise.all(
      [...months].map((mk) => {
        const [y, m] = mk.split("-");
        return getDailyActivity(Number(y), Number(m));
      })
    );
    const map = {};
    monthRows.flat().forEach((r) => {
      map[r.date] = r;
    });

    const todayStr = getLocalDate();
    const list = weekDates.map((d) => {
      const key = getLocalDate(d);
      return {
        date: key,
        letter: weekdayNarrow(d.getDay()),
        done: dayQualifies(map[key]),
        hasActivity: hasAnyActivity(map[key]),
        isToday: key === todayStr,
        isFuture: key > todayStr,
      };
    });
    setDays(list);
    // refreshKey isn't read above but forces a refetch on screen focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, weekOffset]);

  const { loading, error, retry } = useAsyncSection(task);

  // No activity data exists before DASHBOARD_HISTORY_FLOOR (same floor
  // MonthCalendar/WeekChart enforce). Block stepping back once the NEXT week
  // back would fall entirely before it.
  const { year: floorYear, month: floorMonth } = constant.DASHBOARD_HISTORY_FLOOR;
  const floorDate = useMemo(() => new Date(floorYear, floorMonth - 1, 1), [floorYear, floorMonth]);
  const canGoPrevWeek = weekDatesForOffset(weekOffset + 1)[6] >= floorDate;
  const canGoNextWeek = weekOffset > 0;

  // Names the week the strip is showing, in the same words the minutes chart
  // below uses for its own week — the two steppers sit on the same screen, and
  // only one of them used to say which week you had stepped to.
  const weekLabel = useMemo(
    () => weekRangeLabel(weekDatesForOffset(weekOffset), weekOffset === 0),
    // STRINGS.getLanguage() in deps so the label (THIS_WEEK / month names)
    // recomputes when the user switches app language, not just on week change.
    [weekOffset, STRINGS.getLanguage()]
  );

  const openDay = useCallback((day) => {
    // Every tap is reported, including the two that open nothing — a strip
    // mostly tapped on empty days says something the successful opens do not.
    const outcome = day.isFuture ? "future" : (day.hasActivity && "opened") || "empty";
    trackDashboardEvent("day_tapped", { surface: "streak_strip", outcome });
    // Future day → nothing to show yet, and nothing to say either.
    if (day.isFuture) return;
    // No activity on this (past/today) day → quick toast instead of an empty detail sheet.
    if (!day.hasActivity) {
      showInfoToast(STRINGS.NO_ACTIVITY);
      return;
    }
    setModalDate(day.date);
    setModalVisible(true);
  }, []);

  // Stepping back and forward through weeks. `offset` says how far from this
  // week they went, so a single curious tap reads apart from real browsing.
  const stepWeek = useCallback((direction) => {
    setWeekOffset((o) => {
      const next = direction === "back" ? o + 1 : Math.max(0, o - 1);
      trackDashboardEvent("week_navigated", { surface: "streak_strip", direction, offset: next });
      return next;
    });
  }, []);

  // stage = number of thresholds reached (1..14).
  const stage = Math.min(THRESHOLDS.filter((t) => current >= t).length || 1, 14);
  const hero = FLOWERS[stage - 1];

  if (loading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.topRow}>
          <SkeletonBlock style={styles.heroSkeleton} />
          <View style={styles.streakText}>
            <SkeletonBlock style={styles.lineSkeletonBig} />
            <SkeletonBlock style={styles.lineSkeletonSmall} />
          </View>
        </View>
        {/* 24 (original gap) + 18 (weekTitle's paddingTop, absent here since
            there's no heading in the loading state) — keeps skeleton spacing
            identical to the loaded layout below. The block below stands in for
            the week heading, so the dots don't jump down when it arrives. */}
        <SkeletonBlock style={[styles.lineSkeletonSmall, { marginTop: 42 }]} />
        <View style={[styles.weekRow, { marginTop: 6 }]}>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} style={styles.dotSkeleton} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap}>
        <SectionError onRetry={retry} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Image source={hero} style={styles.hero} resizeMode="contain" fadeDuration={0} />
        <View style={styles.streakText}>
          {/* Nested inline Text keeps the number + label on one shared baseline. */}
          <CustomText style={styles.streakLine}>
            <CustomText
              style={[
                styles.bigNum,
                {
                  color: numColor,
                  fontFamily: numFont,
                  // Faux-bold: Baloo ships only Regular + SemiBold and a named TTF
                  // ignores fontWeight, so thicken with a same-color shadow (matches
                  // the header name treatment).
                  textShadowColor: numColor,
                  textShadowOffset: { width: 0.6, height: 0 },
                  textShadowRadius: 0.5,
                },
              ]}
            >
              {current}
            </CustomText>
            <CustomText style={[styles.dayStreak, { color: dayStreakColor, fontFamily: numFont }]}>
              {`   ${STRINGS.DAY_STREAK}`}
            </CustomText>
          </CustomText>
          <CustomText style={[styles.sub, { color: belowStreakColor }]} numberOfLines={2}>
            {STRINGS.BEST_STREAK_LABEL} · {longest}
            {longest === 1 ? " day" : " days"}
            {/* A brand-new user hasn't started a streak yet — "keep it going" reads
                oddly at zero, so it only shows once there's something to keep going. */}
            {current > 0 ? ` · ${STRINGS.KEEP_IT_GOING}` : ""}
          </CustomText>
        </View>
      </View>

      {/* 14-stage lotus growth row */}
      <View style={styles.flowerStripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flowerStrip}
        >
          {FLOWERS.map((src, i) => {
            const reached = stage >= i + 1;
            return (
              <View key={THRESHOLDS[i]} style={styles.flowerCol}>
                <Image
                  source={src}
                  style={[styles.flowerImg, !reached && styles.flowerImgFuture]}
                  resizeMode="contain"
                  fadeDuration={0}
                />
                <CustomText
                  style={[styles.flowerLabel, { color: reached ? accentBlue : mutedText }]}
                >
                  {THRESHOLDS[i]}
                </CustomText>
              </View>
            );
          })}
        </ScrollView>
        {/* Hints the row scrolls horizontally — non-interactive, sits above the fade. */}
        <View style={styles.flowerScrollHint} pointerEvents="none">
          <ChevronRight color={mutedText} />
        </View>
      </View>

      {/* Week activity strip — minimal: weekday letters only, no dates. done =
          filled green + check, today = green ring, past-missed = dashed, future
          = faint ring. Tap a day for its detail / no-activity toast. ‹ ›
          steps a full Monday-first week at a time, floored at
          DASHBOARD_HISTORY_FLOOR and capped at the current week. */}
      <CustomText
        style={[
          styles.weekTitle,
          { color: palette.brandText, fontSize: theme.type.heading.fontSize },
        ]}
        // Wraps rather than clipping, exactly as the chart's heading does: a
        // range losing its month reads as broken, a second line does not.
        numberOfLines={2}
      >
        {weekLabel}
      </CustomText>
      <View style={styles.weekNavRow}>
        <Pressable
          onPress={() => stepWeek("back")}
          disabled={!canGoPrevWeek}
          hitSlop={8}
          style={[styles.navBtn, !canGoPrevWeek && styles.navBtnDisabled]}
        >
          <ChevronLeftIcon size={14} color={mutedText} />
        </Pressable>
        <View style={styles.weekRow} onLayout={(e) => setWeekRowWidth(e.nativeEvent.layout.width)}>
          {days.map((s) => (
            <Pressable key={s.date} style={styles.dayCol} onPress={() => openDay(s)}>
              <View
                style={[
                  styles.dayDot,
                  { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
                  s.done && { backgroundColor: doneFill, borderColor: doneFill },
                  !s.done &&
                    !s.isToday &&
                    !s.isFuture && {
                      borderColor: mutedText,
                      borderWidth: 1.5,
                      borderStyle: "dashed",
                      opacity: 0.2,
                    },
                  !s.done && s.isFuture && { borderColor: separator, borderWidth: 1.5 },
                  !s.done && s.isToday && { borderColor: doneFill, borderWidth: 2 },
                ]}
              >
                {s.done ? <CheckIcon color={doneTick} /> : null}
              </View>
              <CustomText style={[styles.dayLabel, { color: s.isToday ? doneFill : mutedText }]}>
                {s.letter}
              </CustomText>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => stepWeek("forward")}
          disabled={!canGoNextWeek}
          hitSlop={8}
          style={[styles.navBtn, !canGoNextWeek && styles.navBtnDisabled]}
        >
          <ChevronRightIcon size={14} color={mutedText} />
        </Pressable>
      </View>

      <DayDetailModal
        visible={modalVisible}
        date={modalDate}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

StreakCard.propTypes = { refreshKey: PropTypes.number };

export default StreakCard;
