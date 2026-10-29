import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated from "react-native-reanimated";
import PropTypes from "prop-types";
import Overlay from "@common/components/ui/Overlay";
import { SheetGestureRoot, SheetHandle, useSheetMotion } from "@common/components/ui/sheetDrag";
import { monthShort } from "@common/dateLocale";
import { ChevronLeftIcon, ChevronRight, CloseIcon } from "@common/icons";
import { CustomText, constant } from "@common";
import useDashboardTheme from "./dashboardTheme";

// Localised short month labels (Jan…Dec in the app language), built at render
// time so a language switch is reflected immediately.
const monthLabels = () => Array.from({ length: 12 }, (_, i) => monthShort(i));

/** Earliest month any activity can exist for. Nothing before it is reachable. */
const FLOOR = constant.DASHBOARD_HISTORY_FLOOR;

const getToday = () => {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1 };
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    // Set at render from c.scrim — dark mode needs a heavier one.
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    // The grab bar brings its own space above and below it.
    paddingTop: 4,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  // Arrows hug the year rather than being pushed to the sheet's edges.
  yearCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navBtn: { padding: 4 },
  navBtnPlaceholder: { padding: 4, width: 18 },
  // Nothing in this sheet is ever disabled, so the only state to express is the
  // touch. Matches the month arrows in MonthCalendar.
  navBtnPressed: { opacity: 0.45 },
  yearText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    // Wide enough that stepping 2026 -> 2027 does not shuffle the arrows.
    minWidth: 64,
  },
  // Out of the flow entirely, so it cannot shift the centred year cluster.
  closeBtn: { position: "absolute", right: 0, padding: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cell: {
    width: "22%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
  },
  cellPressed: {
    opacity: 0.6,
  },
  /** Unreachable months keep their chip but read as inert. */
  cellDisabled: {
    opacity: 0.4,
  },
  cellText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

// react-native-modal-datetime-picker has no working dark-mode hook on Android
// (isDarkModeEnabled/accentColor/textColor are IOS-only in the underlying
// @react-native-community/datetimepicker — confirmed by grepping its native
// Android sources, which contain no theme concept at all). The native
// Android dialog always renders in the OS's day/night style, independent of
// this app's own in-app theme toggle — so it could never actually "match the
// app's theme" the way every other themed piece of the dashboard does. This
// is a fully custom, themed replacement: a plain dim (no blur) behind a
// sheet that slides up and down like every other sheet in the app.
const MonthYearPickerModal = ({ visible, year, month, onSelect, onClose }) => {
  const { cardBg, accentBlue, primaryText, mutedText, c, layout } = useDashboardTheme();
  const today = getToday();

  // Defaults to today's year every time the picker opens — same "show
  // today's date by default" behavior the native picker had, independent of
  // whichever month the calendar happens to be showing underneath.
  const [viewYear, setViewYear] = useState(today.year);
  // The shared motion, so this picker, the Dashboard's other sheets and the
  // Settings sheets all open and close the same way. Dragged from anywhere on
  // it: nothing inside scrolls or moves vertically, and a tap on a month still
  // selects it — only a downward drag closes.
  const motion = useSheetMotion({ visible, onClose, grabEverywhere: true });

  // The picker always opens on today's year, whichever month the calendar
  // behind it happens to be showing.
  useEffect(() => {
    if (visible) setViewYear(today.year);
  }, [visible]);

  if (!motion.mounted) return null;

  // Every month and year is reachable. A month with no data reads as an empty
  // calendar, which tells the user more than an arrow that refuses to move.
  const chipBg = c.surfaceSelected;
  // Stepping back a whole year from the earliest year with any history would
  // land entirely before it, so the control is not offered.
  const canGoBack = viewYear - 1 >= FLOOR.year;

  return (
    // The slide up starts on `onShow` — see sheetDrag.
    <Overlay animationType="none" onRequestClose={onClose} onShow={motion.onShow}>
      {/* A Modal is its own window on Android, outside the app's gesture root.
          See sheetDrag. */}
      <SheetGestureRoot>
        <View style={styles.root}>
          {/* Instant, like every other scrim in the app, and thinning as the
            sheet is dragged away. */}
          <Reanimated.View
            pointerEvents="none"
            style={[styles.dim, { backgroundColor: c.scrim }, motion.scrimStyle]}
          />
          <View
            style={styles.dim}
            onStartShouldSetResponder={() => true}
            onResponderRelease={onClose}
          />
          <GestureDetector gesture={motion.gesture}>
            <Reanimated.View style={motion.panelStyle} onLayout={motion.onPanelLayout}>
              <View
                style={[styles.sheet, { backgroundColor: cardBg }]}
                onStartShouldSetResponder={() => true}
              >
                <SheetHandle onClose={onClose} />

                <View style={styles.header}>
                  {/* The arrows sit either side of the year as one cluster, centred
                in the sheet. The close button is taken out of the flow so it
                cannot pull that cluster off-centre. */}
                  <View style={styles.yearCluster}>
                    {canGoBack ? (
                      <Pressable
                        onPress={() => setViewYear((y) => y - 1)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
                      >
                        <ChevronLeftIcon size={18} color={primaryText} />
                      </Pressable>
                    ) : (
                      <View style={styles.navBtnPlaceholder} />
                    )}
                    <CustomText style={[styles.yearText, { color: primaryText }]}>
                      {viewYear}
                    </CustomText>
                    <Pressable
                      onPress={() => setViewYear((y) => y + 1)}
                      hitSlop={8}
                      style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
                    >
                      <ChevronRight size={18} color={primaryText} />
                    </Pressable>
                  </View>
                  <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                    <CloseIcon size={layout.header.closeIconSize} color={mutedText} />
                  </Pressable>
                </View>

                <View style={styles.grid}>
                  {monthLabels().map((label, i) => {
                    const m = i + 1;
                    const isSelected = viewYear === year && m === month;
                    const isToday = viewYear === today.year && m === today.month;
                    // In the floor year the months before the floor have no history
                    // and never will. Shown but not selectable, rather than removed —
                    // pulling four chips out of a 12-cell grid reflows the rest and
                    // makes the year look like it starts in July.
                    const beforeFloor = viewYear === FLOOR.year && m < FLOOR.month;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => onSelect(viewYear, m)}
                        disabled={beforeFloor}
                        accessibilityState={{ disabled: beforeFloor, selected: isSelected }}
                        style={({ pressed }) => [
                          styles.cell,
                          // Every cell keeps the same chip shape/size so the grid
                          // reads as one consistent grid regardless of state —
                          // only the fill/border changes.
                          { backgroundColor: chipBg },
                          isSelected && { backgroundColor: accentBlue },
                          !isSelected && isToday && { borderWidth: 1.5, borderColor: accentBlue },
                          beforeFloor && styles.cellDisabled,
                          pressed && !beforeFloor && styles.cellPressed,
                        ]}
                      >
                        <CustomText
                          style={[
                            styles.cellText,
                            { color: isSelected ? c.onAccent : primaryText },
                            beforeFloor && { color: mutedText },
                          ]}
                        >
                          {label}
                        </CustomText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Reanimated.View>
          </GestureDetector>
        </View>
      </SheetGestureRoot>
    </Overlay>
  );
};

MonthYearPickerModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MonthYearPickerModal;
