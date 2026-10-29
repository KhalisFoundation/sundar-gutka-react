import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import { weekdayNarrow } from "@common/dateLocale";
import PropTypes from "prop-types";
import { CustomText, useTheme, logError } from "@common";
import { getDailyActivity } from "../../database/analytics";
import { dayQualifies } from "../../services/streakDays";

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getCurrentWeek = () => {
  const today = new Date();
  const dow = today.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return { dateStr: `${y}-${m}-${day}`, dayNum: d.getDate(), dow: i };
  });
};

const SlimCalendarStrip = ({ refreshKey = 0 }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);
  // The Dashboard blue, from the token layer — see ActivityCalendar.
  const accentBlue = c.textBrand;
  const todayStr = getTodayStr();
  const weekDays = getCurrentWeek();
  const [activityMap, setActivityMap] = useState({});

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.spring(slideAnim, {
      toValue: 1,
      tension: 130,
      friction: 14,
      useNativeDriver: true,
    });
    anim.start();
    // Stop the native-driven spring if this strip unmounts mid-animation (e.g.
    // dashboard re-layout / section reorder). Otherwise the driver keeps pushing
    // props onto a node whose backing Animated.Value may already be dropped,
    // which crashes in PropsAnimatedNode.updateView with "Mapped property node
    // does not exist" (RN #12893 / #37267).
    return () => anim.stop();
  }, [slideAnim]);

  useEffect(() => {
    const now = new Date();
    getDailyActivity(now.getFullYear(), now.getMonth() + 1)
      .then((rows) => {
        const map = {};
        rows.forEach((r) => {
          map[r.date] = r;
        });
        setActivityMap(map);
      })
      .catch(logError);
  }, [refreshKey]);

  const bg = palette.sectionBg;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: slideAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: bg,
            borderBottomColor: c.border,
          },
        ]}
      >
        {weekDays.map(({ dateStr, dayNum, dow }) => {
          const row = activityMap[dateStr];
          const isToday = dateStr === todayStr;
          const qualifies = dayQualifies(row);
          const hasAny = row && row.reading_seconds + row.listening_seconds > 0;
          return (
            <View key={dow} style={styles.cell}>
              <CustomText style={[styles.dayLetter, { color: c.textSecondary }]}>
                {weekdayNarrow(dow)}
              </CustomText>
              <View
                style={[
                  styles.circle,
                  qualifies && { backgroundColor: accentBlue },
                  !qualifies && hasAny && { borderWidth: 1.5, borderColor: accentBlue },
                  isToday &&
                    !qualifies &&
                    !hasAny && { borderWidth: 2, borderColor: c.borderStrong },
                ]}
              >
                <CustomText
                  style={[
                    styles.dayNum,
                    { color: qualifies ? c.onAccent : c.textPrimary },
                    isToday && !qualifies && { fontWeight: "700" },
                  ]}
                >
                  {dayNum}
                </CustomText>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

SlimCalendarStrip.propTypes = {
  refreshKey: PropTypes.number,
};

const CIRCLE = 30;

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  container: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dayLetter: {
    fontSize: 11,
    fontWeight: "500",
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayNum: {
    fontSize: 12,
  },
});

export default SlimCalendarStrip;
