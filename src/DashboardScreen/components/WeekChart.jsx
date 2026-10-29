import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { weekdayNarrow } from "@common/dateLocale";
import PropTypes from "prop-types";
import { ChevronLeftIcon, ChevronRight } from "@common/icons";
import { CustomText, STRINGS, constant, trackDashboardEvent } from "@common";
import { getDayActivity } from "../../database/analytics";
import useDashboardTheme from "./dashboardTheme";
import SectionError from "./SectionError";
import SectionLabel from "./SectionLabel";
import SkeletonBlock from "./SkeletonBlock";
import useAsyncSection from "./useAsyncSection";
import weekRangeLabel from "./weekRangeLabel";

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;

// 7-day window ending `offsetWeeks` weeks before today (0 = last 7 days
// ending today), oldest first. Stepping by whole weeks (not arbitrary days)
// mirrors MonthCalendar's month-at-a-time history browsing.
const daysForOffset = (offsetWeeks) => {
  const anchor = new Date();
  anchor.setDate(anchor.getDate() - offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - (6 - i));
    return d;
  });
};

const WeekChart = ({ refreshKey = 0 }) => {
  const { mutedText, brandText, theme, palette } = useDashboardTheme();
  // Highlighted (today) bar + label color.
  // The chart's own blue, brighter than the brand navy the rest of the screen
  // uses: at bar size on a white card the navy reads as a black block.
  const barColor = palette.chartBar;
  const [weekOffset, setWeekOffset] = useState(0);

  // Stepping back and forward through weeks. `offset` says how far from this
  // week they went, so a single curious tap reads apart from real browsing.
  const stepWeek = useCallback((direction) => {
    setWeekOffset((o) => {
      const next = direction === "back" ? o + 1 : Math.max(0, o - 1);
      trackDashboardEvent("week_navigated", { surface: "week_chart", direction, offset: next });
      return next;
    });
  }, []);
  const [bars, setBars] = useState([]);
  const [avg, setAvg] = useState(0);

  const days = useMemo(() => daysForOffset(weekOffset), [weekOffset]);

  const task = useCallback(async () => {
    const rows = await Promise.all(days.map((d) => getDayActivity(ymd(d))));
    const todayKey = ymd(new Date());
    const mins = rows.map((r) =>
      r ? Math.round(((r.reading_seconds ?? 0) + (r.listening_seconds ?? 0)) / 60) : 0
    );
    const max = Math.max(1, ...mins);
    setBars(
      days.map((d, i) => ({
        letter: weekdayNarrow(d.getDay()),
        mins: mins[i],
        ratio: mins[i] / max,
        isToday: ymd(d) === todayKey,
      }))
    );
    const total = mins.reduce((a, b) => a + b, 0);
    setAvg(Math.round(total / 7));
    // refreshKey isn't read above but forces a refetch on screen focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, days]);

  const { loading, error, retry } = useAsyncSection(task);

  const inactiveBar = palette.chartBarInactive;

  // No activity data exists before DASHBOARD_HISTORY_FLOOR (see MonthCalendar,
  // which enforces the same floor). Block stepping back once the NEXT window
  // back would fall entirely before it — its most recent day (index 6) is the
  // one to check, since a window straddling the floor still has real days to
  // show.
  const { year: floorYear, month: floorMonth } = constant.DASHBOARD_HISTORY_FLOOR;
  const floorDate = useMemo(() => new Date(floorYear, floorMonth - 1, 1), [floorYear, floorMonth]);
  const canGoPrev = daysForOffset(weekOffset + 1)[6] >= floorDate;
  const canGoNext = weekOffset > 0;

  const rangeLabel = useMemo(
    () => weekRangeLabel(days, weekOffset === 0),
    // STRINGS.getLanguage() in deps so the label (THIS_WEEK / month names)
    // recomputes when the user switches app language, not just on week change.
    [weekOffset, days, STRINGS.getLanguage()]
  );

  return (
    <View>
      <SectionLabel
        title={rangeLabel}
        // The week range is a heading, not a caption: brand navy in light,
        // white in dark, at the shared heading size.
        color={brandText}
        uppercase={false}
        titleStyle={{ fontSize: theme.type.heading.fontSize, fontWeight: "600", letterSpacing: 0 }}
        right={
          <View style={styles.navRow}>
            <CustomText style={[styles.avg, { color: mutedText }]} numberOfLines={2}>
              {STRINGS.formatString(STRINGS.AVG_PER_DAY, { count: avg })}
            </CustomText>
            <Pressable
              onPress={() => stepWeek("back")}
              disabled={!canGoPrev}
              hitSlop={8}
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
            >
              <ChevronLeftIcon size={16} color={mutedText} />
            </Pressable>
            <Pressable
              onPress={() => stepWeek("forward")}
              disabled={!canGoNext}
              hitSlop={8}
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
            >
              <ChevronRight size={16} color={mutedText} />
            </Pressable>
          </View>
        }
      />
      <View style={styles.wrap}>
        <View style={styles.card}>
          {loading ? (
            <View style={styles.chart}>
              {Array.from({ length: 7 }).map((_, i) => (
                <View key={i} style={styles.barCol}>
                  <SkeletonBlock style={styles.barSkeleton} />
                </View>
              ))}
            </View>
          ) : null}
          {!loading && error ? <SectionError compact onRetry={retry} /> : null}
          {!loading && !error ? (
            <View style={styles.chart}>
              {bars.map((b, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(6, b.ratio * 100)}%`,
                          backgroundColor: b.isToday ? barColor : inactiveBar,
                        },
                      ]}
                    />
                  </View>
                  <CustomText
                    style={[styles.barLabel, { color: b.isToday ? barColor : mutedText }]}
                  >
                    {b.letter}
                  </CustomText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

WeekChart.propTypes = { refreshKey: PropTypes.number };

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  card: { paddingVertical: 8 },
  // Yields before the week range does — the date is the heading, the average
  // is a caption.
  avg: { fontSize: 12, flexShrink: 1 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 8 },
  barCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  barTrack: { flex: 1, width: 18, justifyContent: "flex-end" },
  // bar: { width: 18, borderRadius: 9 },
  bar: {
    width: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  barLabel: { fontSize: 12, marginTop: 8, fontWeight: "500" },
  barSkeleton: { width: 18, height: 60, borderRadius: 8 },
});

export default WeekChart;
