import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Pressable, StyleSheet, PanResponder } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { hexToRgb } from "@theme/colorUtils";
import PropTypes from "prop-types";
import { weekdayNarrowRow, formatMonthYear } from "@common/dateLocale";
import { ChevronLeftIcon, ChevronRight } from "@common/icons";
import {
  CustomText,
  STRINGS,
  constant,
  logError,
  showInfoToast,
  trackDashboardEvent,
} from "@common";
import { getDailyActivity, getOrCreateSummary } from "../../database/analytics";
import { dayQualifies } from "../../services/streakDays";
import useDashboardTheme from "./dashboardTheme";
import DayDetailModal from "./DayDetailModal";
import MonthYearPickerModal from "./MonthYearPickerModal";
import SectionError from "./SectionError";
import SkeletonBlock from "./SkeletonBlock";
import useAsyncSection from "./useAsyncSection";

// Fallback only — the real circle size is derived from the measured grid width
// (see `circle` below) so 7 columns always fit, on a small phone or a tablet.
const CIRCLE_FALLBACK = 36;
const CIRCLE_MIN = 26;
const CIRCLE_MAX = 40;
// Breathing room between the drawn shape and the SVG's own boundary. Without it
// a stroke/fill whose edge lands exactly on the viewport edge gets clipped by
// subpixel rounding — that was the "notched"/half-drawn circles.
const EDGE_PAD = 1.5;

const hasAnyActivity = (row) =>
  !!row && ((row.reading_seconds ?? 0) > 0 || (row.listening_seconds ?? 0) > 0);

const getLocalYM = () => {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1 };
};
const getTodayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
};

// Sunday-first grid (matches the new design's S M T W T F S header).
const buildWeekRows = (year, month) => {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
};

// A dashed circle drawn as SVG, not a bordered View — RN's `borderStyle:
// "dashed"` + `borderRadius` combo doesn't render rounded corners reliably
// (Android in particular falls back to a square outline), so the "missed
// day" marker has to be an actual stroked circle instead. Used standalone
// only for the small legend swatch below.
const DashedCircle = ({ size, color, strokeWidth = 1.5, dash = "4 3" }) => (
  <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <Circle
      cx={size / 2}
      cy={size / 2}
      r={size / 2 - strokeWidth / 2 - 0.5}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dash}
      fill="none"
    />
  </Svg>
);
DashedCircle.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  strokeWidth: PropTypes.number,
  dash: PropTypes.string,
};

// Every ring/fill state for a day cell (heat fill, today's accent ring, missed
// dashed ring) drawn in one SVG sharing a single cx/cy — so the fill and the
// rings are always concentric.
//
// Two things here are load-bearing and easy to regress:
//  1. NO StyleSheet.absoluteFill. absoluteFill sets top/left/right/bottom:0,
//     which stretches the SVG's LAYOUT box to the parent while the width/height
//     props define its internal viewport. When those two disagree the shapes get
//     clipped/offset — that produced the notched, half-drawn circles. The SVG is
//     positioned at top/left 0 at exactly its own size instead, and a viewBox
//     pins the coordinate space so it renders identically at any pixel density.
//  2. Everything is inset by EDGE_PAD (and rings by half their stroke on top of
//     that), so no shape's edge ever lands exactly on the viewport boundary,
//     where subpixel rounding would shave it off.
const DayMarker = ({ size, fillColor = null, todayColor = null, missedColor = null }) => {
  const c = size / 2;
  const fillR = c - EDGE_PAD;
  const missedR = c - EDGE_PAD - 1.5 / 2;
  const todayR = c - EDGE_PAD - 2 / 2;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={styles.dayMarkerSvg}
      pointerEvents="none"
    >
      {fillColor ? <Circle cx={c} cy={c} r={fillR} fill={fillColor} /> : null}
      {missedColor ? (
        <Circle
          cx={c}
          cy={c}
          r={missedR}
          stroke={missedColor}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="none"
        />
      ) : null}
      {todayColor ? (
        <Circle cx={c} cy={c} r={todayR} stroke={todayColor} strokeWidth={2} fill="none" />
      ) : null}
    </Svg>
  );
};
DayMarker.propTypes = {
  size: PropTypes.number.isRequired,
  fillColor: PropTypes.string,
  todayColor: PropTypes.string,
  missedColor: PropTypes.string,
};

// A missed day: a neutral wash, deliberately not the error red — a bani not
// read is not a fault state.

/**
 * Text colour for a heat cell at `level` (0–4).
 *
 * A named function rather than a nested ternary inline: the rule is a real
 * decision about contrast, and it reads once here instead of five levels deep
 * in the JSX.
 */
const levelTextColor = (level, c, accent, muted) => {
  // Strong fill — the accent at (near) full strength, so its contrast partner.
  if (level >= 3) return c.onAccent;
  // Faint fill — still mostly the card behind it, so the accent reads best.
  if (level > 0) return accent;
  return muted;
};

// Heatmap bucket 0..4 from total activity seconds.
const intensity = (row) => {
  if (!row) return 0;
  const total = (row.reading_seconds ?? 0) + (row.listening_seconds ?? 0);
  if (total <= 0) return 0;
  const mins = total / 60;
  if (mins < 5) return 1;
  if (mins < 15) return 2;
  if (mins < 30) return 3;
  return 4;
};

const MonthCalendar = ({ refreshKey = 0 }) => {
  const { accentBlue, mutedText, theme, c, palette } = useDashboardTheme();
  // Month arrows are controls, not secondary text: mutedText only reached
  // 2.4:1 against the light card, under the 3:1 WCAG asks of a non-text UI
  // element. primaryText also matches the arrows in ActivityCalendar.
  const navColor = c.textPrimary;
  // Real SemiBold glyph for today's number (heavier than the Regular the other
  // days use). fontWeight alone does nothing on these custom TTFs.
  const numFont = theme.typography.fonts.balooPaajiSemiBold;
  const todayStr = getTodayStr();
  const curYM = getLocalYM();

  const [year, setYear] = useState(curYM.year);
  const [month, setMonth] = useState(curYM.month);
  const [activityMap, setActivityMap] = useState({});
  const [modalDate, setModalDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  // Measured width of the grid, so the day circle can be sized to the column it
  // actually has to fit in. A hard-coded 36 overflowed its cell on narrow phones
  // (7 columns share the card width) and looked lost on wide ones.
  const [gridWidth, setGridWidth] = useState(0);
  // Defaults to false (suppressed) until the summary resolves — a brand-new
  // user must never see "missed" marks for days before they installed the
  // app, even briefly. An existing user just sees them pop in a beat later.
  const [hasEverBeenActive, setHasEverBeenActive] = useState(false);

  // The PanResponder below is created once, so its handlers must read the latest
  // year/month from a ref (not a stale closure). Without this, the captured
  // forward-guard stayed false from first render and forward swipes never worked.
  const ymRef = useRef({ year, month });
  ymRef.current = { year, month };

  // First day activity data can exist for — see constant.DASHBOARD_HISTORY_FLOOR.
  // It bounds the "missed" marker AND how far back the calendar can be browsed:
  // the back arrow is withdrawn at the floor and the swipe is guarded, since
  // every earlier month is necessarily empty.
  const { year: floorYear, month: floorMonth } = constant.DASHBOARD_HISTORY_FLOOR;
  const historyStart = `${floorYear}-${String(floorMonth).padStart(2, "0")}-01`;

  // True when the calendar is already showing the earliest month there is any
  // history for, so there is nothing further back to reach.
  const atHistoryFloor = year === floorYear && month === floorMonth;

  // A month that has not happened yet. "0 days" and "no activity recorded" are
  // both statements about the past — on a future month they read as a failure
  // rather than as a month that simply has not arrived. Real activity IS still
  // shown if any exists (a bani read ahead of time, a clock skew), so the
  // suppression is of the empty states only, never of data.
  const [todayYear, todayMonth] = todayStr.split("-").map(Number);
  const isFutureMonth = year > todayYear || (year === todayYear && month > todayMonth);

  const prevMonth = useCallback(() => {
    const { year: y, month: m } = ymRef.current;
    // Guarded HERE, not just on the arrow: the horizontal swipe calls this too,
    // so hiding the control alone would still let a drag cross the floor.
    if (y === floorYear && m === floorMonth) return;
    setYear((yy) => (m === 1 ? yy - 1 : yy));
    setMonth((mm) => (mm === 1 ? 12 : mm - 1));
  }, [floorYear, floorMonth]);

  const nextMonth = useCallback(() => {
    const { month: m } = ymRef.current;
    setYear((yy) => (m === 12 ? yy + 1 : yy));
    setMonth((mm) => (mm === 12 ? 1 : mm + 1));
  }, []);

  const loadActivity = useCallback(async (y, m) => {
    const rows = await getDailyActivity(y, m);
    const map = {};
    rows.forEach((r) => {
      map[r.date] = r;
    });
    setActivityMap(map);
  }, []);

  const task = useCallback(
    () => loadActivity(year, month),
    // refreshKey isn't read above but forces a refetch on screen focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadActivity, year, month, refreshKey]
  );
  const { loading, error, retry } = useAsyncSection(task);

  // Lifetime activity check (independent of the month being viewed) — used to
  // suppress "missed" marks for a user who never had any activity at all. Not
  // gated by the grid's own loading/error state: the calendar should still
  // work even if this secondary check fails. Re-checks on refreshKey (screen
  // focus) rather than once-only — the Dashboard tab stays frozen (not
  // unmounted) when you navigate away, so a one-time check taken before any
  // real activity existed would otherwise latch "false" for the rest of the
  // session even after the user has since built up history.
  useEffect(() => {
    let active = true;
    getOrCreateSummary()
      .then((s) => {
        if (active) setHasEverBeenActive((s?.total_days_active ?? 0) > 0);
      })
      .catch(logError);
    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Swipe left/right to change month (design: monthly calendar swipable).
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx > 40) prevMonth();
        else if (g.dx < -40) nextMonth();
      },
    })
  ).current;

  const handleDayPress = useCallback(
    (d) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      // Every tap, including the two that open nothing — see the same call on
      // the streak strip, which shares this event and differs only by surface.
      trackDashboardEvent("day_tapped", {
        surface: "month_calendar",
        outcome:
          (dateStr > todayStr && "future") ||
          (hasAnyActivity(activityMap[dateStr]) ? "opened" : "empty"),
      });
      // Future day → nothing to show yet, and nothing to say either.
      if (dateStr > todayStr) return;
      // No activity on this (past/today) day → quick toast instead of an empty detail sheet.
      if (!hasAnyActivity(activityMap[dateStr])) {
        showInfoToast(STRINGS.NO_ACTIVITY);
        return;
      }
      setModalDate(dateStr);
      setModalVisible(true);
    },
    [year, month, activityMap, todayStr]
  );

  const monthYearLabel = formatMonthYear(new Date(year, month - 1, 1));
  const rows = buildWeekRows(year, month);

  const activeDaysCount = useMemo(
    () => Object.values(activityMap).filter(dayQualifies).length,
    [activityMap]
  );

  // Circle sized to the column it must fit inside (7 across), clamped so it
  // stays tappable on a small phone and doesn't balloon on a tablet. Falls back
  // to the old fixed size for the very first frame, before onLayout reports.
  const circle = useMemo(() => {
    if (!gridWidth) return CIRCLE_FALLBACK;
    const column = gridWidth / 7;
    return Math.round(Math.max(CIRCLE_MIN, Math.min(CIRCLE_MAX, column - 6)));
  }, [gridWidth]);

  // Brand navy in light mode; the lighter same-hue accent in dark, where the
  // navy would be indistinguishable from the card behind it.
  // Derived from THE Dashboard blue rather than a hand-written rgb pair, so
  // the heat ramp and every other blue on the screen cannot drift apart.
  const heatRgb = hexToRgb(c.textBrand);
  const heatColor = (level) => {
    if (level === 0) return "transparent";
    const opacity = [0, 0.28, 0.5, 0.74, 1][level];
    return `rgba(${heatRgb},${opacity})`;
  };

  // Today is always a light-blue fill + accent ring (not the activity heat fill),
  // so it reads as a distinct "today" marker regardless of how active the day is.
  const { todayFill } = palette;

  return (
    <View style={styles.wrap}>
      <View
        style={styles.card}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <View style={styles.monthNav}>
            {/* Withdrawn at the floor rather than left as a dead control. The
                placeholder keeps the month label in the same place, so the
                header does not shift when the arrow goes. */}
            {atHistoryFloor ? (
              <View style={styles.navBtnPlaceholder} />
            ) : (
              <Pressable
                onPress={() => {
                  trackDashboardEvent("month_navigated", { direction: "back" });
                  prevMonth();
                }}
                hitSlop={8}
                style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
              >
                <ChevronLeftIcon size={16} color={navColor} />
              </Pressable>
            )}
            {/* Tap the label to jump to an arbitrary month via the date picker,
                bounded by DASHBOARD_HISTORY_FLOOR..today (see below).
                `flexShrink` lets it give up width to the arrows and daysCount,
                which do not shrink.

                Giving up width has to mean WRAPPING, not truncating. Capped at
                one line it clipped to "Augus…" the moment the OS text size grew,
                and a month you cannot read is the one thing this control exists
                to tell you. Nothing in the header has a fixed height, so it
                becomes "August" over "2026" and the row grows. */}
            <Pressable
              onPress={() => {
                trackDashboardEvent("month_navigated", { direction: "picker" });
                setPickerVisible(true);
              }}
              hitSlop={6}
              style={styles.monthLabelBtn}
            >
              <CustomText style={[styles.monthText, { color: palette.brandText }]}>
                {monthYearLabel}
              </CustomText>
            </Pressable>
            <Pressable
              onPress={() => {
                trackDashboardEvent("month_navigated", { direction: "forward" });
                nextMonth();
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
            >
              <ChevronRight size={16} color={navColor} />
            </Pressable>
          </View>
          {/* Suppressed only when a future month has nothing to report; a
              future month WITH activity still shows its count. */}
          {isFutureMonth && activeDaysCount === 0 ? null : (
            <CustomText style={[styles.daysCount, { color: mutedText }]} numberOfLines={2}>
              {STRINGS.formatString(
                activeDaysCount === 1 ? STRINGS.DAY_THIS_MONTH : STRINGS.DAYS_THIS_MONTH,
                { count: activeDaysCount }
              )}
            </CustomText>
          )}
        </View>

        <View style={styles.weekRow}>
          {weekdayNarrowRow(false).map((l, i) => (
            <View key={i} style={styles.cell}>
              <CustomText style={[styles.dayLabel, { color: mutedText }]}>{l}</CustomText>
            </View>
          ))}
        </View>

        {loading
          ? Array.from({ length: 5 }).map((_, ri) => (
              <View key={ri} style={styles.weekRow}>
                {Array.from({ length: 7 }).map((_c, ci) => (
                  <View key={ci} style={styles.cell}>
                    <SkeletonBlock
                      style={{ width: circle, height: circle, borderRadius: circle / 2 }}
                    />
                  </View>
                ))}
              </View>
            ))
          : null}

        {!loading && error ? <SectionError onRetry={retry} /> : null}

        {!loading && !error
          ? rows.map((row, ri) => (
              <View key={ri} style={styles.weekRow}>
                {row.map((d, ci) => {
                  if (!d) return <View key={`e-${ci}`} style={styles.cell} />;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(
                    2,
                    "0"
                  )}`;
                  const row2 = activityMap[dateStr];
                  const level = intensity(row2);
                  const isToday = dateStr === todayStr;
                  const isPast = dateStr < todayStr;
                  // A brand-new user never "missed" days before they installed the
                  // app, and nobody missed a day the app could not have recorded —
                  // months before historyStart are browsable but always read empty.
                  const missed =
                    isPast && dateStr >= historyStart && level === 0 && hasEverBeenActive;
                  return (
                    <Pressable key={d} style={styles.cell} onPress={() => handleDayPress(d)}>
                      <View style={[styles.dayCircle, { width: circle, height: circle }]}>
                        <DayMarker
                          size={circle}
                          fillColor={isToday ? todayFill : level > 0 ? heatColor(level) : null}
                          todayColor={isToday ? accentBlue : null}
                          missedColor={missed ? palette.missedFill : null}
                        />
                        <CustomText
                          style={[
                            styles.dayNum,
                            // Today always uses the accent (matches its ring/border
                            // colour). Otherwise: `onAccent` once the heat fill is
                            // strong enough to read as a solid blue, the accent on a
                            // faint one, muted on an empty one.
                            //
                            // The threshold is 3, not 2. `onAccent` is the contrast
                            // partner of a FULL-strength fill; at level 2 the fill is
                            // half-transparent and composites toward the card, so the
                            // accent still reads better against it. It was a hardcoded
                            // pure white, which in dark mode meant white text on a LIGHT
                            // blue cell — invisible.
                            {
                              color: isToday
                                ? accentBlue
                                : levelTextColor(level, c, accentBlue, mutedText),
                            },
                            // Today reads bolder via the real SemiBold face.
                            isToday && { fontFamily: numFont },
                          ]}
                        >
                          {d}
                        </CustomText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))
          : null}

        {/* Months after the floor but before today are reachable and can be
            genuinely empty, so say why rather than leaving a silent grid. A
            future month is not "empty" — it has not happened — so it says
            nothing at all. */}
        {!loading && !error && !isFutureMonth && activeDaysCount === 0 ? (
          <CustomText style={[styles.emptyNote, { color: mutedText }]}>
            {STRINGS.NO_ACTIVITY_MONTH}
          </CustomText>
        ) : null}

        {/* Legend: Less ▢▢▢▢ More · Missed (missed marker hidden for a user
            who has never had any activity — it would never appear anyway) */}
        {!loading && !error ? (
          <View style={styles.legend}>
            <CustomText style={[styles.legendText, { color: mutedText }]}>
              {STRINGS.LESS}
            </CustomText>
            {[1, 2, 3, 4].map((l) => (
              <View key={l} style={[styles.legendBox, { backgroundColor: heatColor(l) }]} />
            ))}
            <CustomText style={[styles.legendText, { color: mutedText }]}>
              {STRINGS.MORE}
            </CustomText>
            {hasEverBeenActive ? (
              <>
                <View style={styles.legendDot}>
                  <DashedCircle size={14} strokeWidth={1.3} dash="2.5 2" color={palette.missedFill} />
                </View>
                <CustomText style={[styles.legendText, { color: mutedText }]}>
                  {STRINGS.MISSED}
                </CustomText>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      <DayDetailModal
        visible={modalVisible}
        date={modalDate}
        onClose={() => setModalVisible(false)}
      />

      {/* Custom-built, not the native OS date picker: Android's native dialog
          has no working theme hook from JS (confirmed against the native
          module source — isDarkModeEnabled/accentColor/textColor only ever
          applied on iOS), so it always rendered in the system's day/night
          style regardless of this app's own in-app theme toggle. This
          version is themed via useDashboardTheme() like everything else on
          the dashboard, in both light and dark mode. Bounded to exactly the
          range the arrows allow, and always opens on today's year so it
          matches the "show today's date by default" behavior. */}
      <MonthYearPickerModal
        visible={pickerVisible}
        year={year}
        month={month}
        onSelect={(y, m) => {
          setYear(y);
          setMonth(m);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
};

MonthCalendar.propTypes = { refreshKey: PropTypes.number };

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  card: { paddingVertical: 4 },
  header: {
    flexDirection: "row",
    // "center" (not the original "baseline") — the label now sits inside a
    // View row with icon buttons on either side, which has no text baseline
    // for "baseline" alignment to key off.
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  // flexShrink so the label can give up width to the arrows/daysCount instead
  // of pushing them off a narrow phone; the arrows themselves (navBtn) never
  // shrink, so they stay full touch-target size regardless.
  monthNav: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  monthLabelBtn: { flexShrink: 1 },
  navBtn: { padding: 4, flexShrink: 0 },
  /** Holds the back arrow's footprint at the history floor. Matches navBtn. */
  navBtnPlaceholder: { padding: 4, flexShrink: 0, width: 16 },
  // Month navigation is never disabled, so the only state to express is the
  // touch itself — without it a tap that lands on an empty month gives no
  // sign it registered.
  navBtnPressed: { opacity: 0.45 },
  monthText: { fontSize: 20, fontWeight: "600" },
  daysCount: { fontSize: 13, flexShrink: 1, marginLeft: 8 },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  cell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayLabel: { fontSize: 12, fontWeight: "500", paddingVertical: 4 },
  // Deliberately NO borderRadius: this View is only a centering box — the circle
  // itself is drawn by DayMarker's SVG. A borderRadius here makes Android mask
  // the SVG child to the rounded shape and shave its edges. Width/height are
  // applied inline from the responsive `circle` size.
  dayCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Matches DayMarker's own width/height exactly (NOT absoluteFill — see the
  // comment on DayMarker for why that clipped the circles).
  dayMarkerSvg: { position: "absolute", top: 0, left: 0 },
  dayNum: { fontSize: 13 },
  emptyNote: { fontSize: 12, textAlign: "center", marginTop: 12 },
  legend: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14 },
  legendText: { fontSize: 11 },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
  legendDot: { width: 14, height: 14, marginLeft: 8 },
});

export default MonthCalendar;
