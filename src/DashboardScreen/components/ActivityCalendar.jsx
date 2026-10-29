import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Polyline, Path } from "react-native-svg";
import { weekdayNarrowRow, monthLong } from "@common/dateLocale";
import PropTypes from "prop-types";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import { CustomText, useTheme, logError } from "@common";
import { getDailyActivity } from "../../database/analytics";
import { dayQualifies } from "../../services/streakDays";
import DayDetailModal from "./DayDetailModal";

const ChevronLeft = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);
ChevronLeft.propTypes = { color: PropTypes.string.isRequired };

const ChevronRight = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
ChevronRight.propTypes = { color: PropTypes.string.isRequired };

const FlameIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M12 23c-4.4 0-8-3.6-8-8 0-2.1.8-4.1 2.2-5.6C7.4 8 8.5 6.3 9 4.4c.1-.3.4-.5.8-.4.3.1.5.3.5.6.1 1.2.6 2.3 1.4 3.2C12.4 6.4 13 4.6 13 2.8c0-.4.3-.7.7-.7.2 0 .4.1.5.2 2.3 2 3.8 4.9 3.8 8 0 4.4-3.6 8-8 8z" />
  </Svg>
);
FlameIcon.propTypes = { size: PropTypes.number, color: PropTypes.string.isRequired };

const getLocalYM = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Builds a calendar grid starting on Monday
const buildWeekRows = (year, month) => {
  // getDay() returns 0=Sun…6=Sat; convert to Monday-first (0=Mon…6=Sun)
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
};

const ActivityCalendar = ({ refreshKey = 0 }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);
  // The Dashboard blue, from the token layer. This was a local ternary
  // duplicated across six components, which is how dark mode drifted to a
  // different blue to the rest of the page.
  const accentBlue = c.textBrand;
  const todayStr = getTodayStr();
  const curYM = getLocalYM();

  const [year, setYear] = useState(curYM.year);
  const [month, setMonth] = useState(curYM.month);
  const [activityMap, setActivityMap] = useState({});
  const [modalDate, setModalDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadActivity = useCallback(async (y, m) => {
    try {
      const rows = await getDailyActivity(y, m);
      const map = {};
      rows.forEach((r) => { map[r.date] = r; });
      setActivityMap(map);
    } catch (err) {
      logError(err);
    }
  }, []);

  useEffect(() => {
    loadActivity(year, month);
  }, [year, month, loadActivity, refreshKey]);

  const canGoForward = year < curYM.year || (year === curYM.year && month < curYM.month);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (!canGoForward) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const handleDayPress = useCallback((d) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setModalDate(dateStr);
    setModalVisible(true);
  }, [year, month]);

  const monthName = monthLong(month - 1);
  const rows = buildWeekRows(year, month);

  const getDayState = (d) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const row = activityMap[dateStr];
    const isToday = dateStr === todayStr;
    const qualifies = dayQualifies(row);
    const hasAny = row && (row.reading_seconds + row.listening_seconds) > 0;
    return { qualifies, hasAny, isToday };
  };

  const activeDaysCount = Object.values(activityMap).filter(dayQualifies).length;

  const navColor = c.textPrimary;
  const disabledColor = c.textSecondary;
  const bg = palette.sectionBg;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header: month+year left, nav arrows right */}
      <View style={styles.header}>
        <View style={styles.monthYearRow}>
          <CustomText style={[styles.monthText, { color: c.textPrimary }]}>
            {monthName}
          </CustomText>
          <CustomText style={[styles.yearText, { color: accentBlue }]}>
            {" "}{year}
          </CustomText>
        </View>
        <View style={styles.navRow}>
          <Pressable onPress={prevMonth} hitSlop={10} style={styles.navBtn}>
            <ChevronLeft color={navColor} />
          </Pressable>
          <Pressable
            onPress={nextMonth}
            hitSlop={10}
            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
          >
            <ChevronRight color={canGoForward ? navColor : disabledColor} />
          </Pressable>
        </View>
      </View>

      {/* Day labels */}
      <View style={styles.weekRow}>
        {weekdayNarrowRow(true).map((l, i) => (
          <View key={i} style={styles.cell}>
            <CustomText style={[styles.dayLabel, { color: c.textSecondary }]}>{l}</CustomText>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((d, ci) => {
            if (!d) return <View key={`e-${ci}`} style={styles.cell} />;
            const { qualifies, hasAny, isToday } = getDayState(d);
            return (
              <Pressable key={d} style={styles.cell} onPress={() => handleDayPress(d)}>
                <View
                  style={[
                    styles.dayCircle,
                    qualifies && { backgroundColor: accentBlue },
                    !qualifies && hasAny && { borderWidth: 1.5, borderColor: accentBlue },
                    isToday && !qualifies && !hasAny && {
                      borderWidth: 2,
                      borderColor: c.borderStrong,
                    },
                  ]}
                >
                  <CustomText
                    style={[
                      styles.dayNum,
                      { color: qualifies ? palette.onAccent : (hasAny ? accentBlue : c.textPrimary) },
                      isToday && !qualifies && { fontWeight: "700" },
                    ]}
                  >
                    {d}
                  </CustomText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* Active badge — no card background */}
      <View style={styles.activeBadge}>
        <View style={[styles.flameCircle, { backgroundColor: palette.flameBg }]}>
          <FlameIcon size={16} color={palette.flame} />
        </View>
        <CustomText>
          <CustomText style={[styles.activeBold, { color: c.textPrimary }]}>
            {activeDaysCount} days
          </CustomText>
          <CustomText style={[styles.activeSuffix, { color: c.textSecondary }]}>
            {" "}connected this month
          </CustomText>
        </CustomText>
      </View>

      <DayDetailModal
        visible={modalVisible}
        date={modalDate}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

ActivityCalendar.propTypes = {
  refreshKey: PropTypes.number,
};

const CIRCLE_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthYearRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  monthText: {
    fontSize: 26,
    fontWeight: "600",
  },
  yearText: {
    fontSize: 26,
    fontWeight: "600",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "500",
    paddingVertical: 4,
  },
  dayCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayNum: {
    fontSize: 13,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  flameCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBold: {
    fontSize: 14,
    fontWeight: "700",
  },
  activeSuffix: {
    fontSize: 14,
    fontWeight: "400",
  },
});

export default ActivityCalendar;
