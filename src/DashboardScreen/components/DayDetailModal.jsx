import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { androidLineHeight } from "@theme/lineHeight";
import { paletteFor, themeForScreen } from "@theme/screenPalettes";
import PropTypes from "prop-types";
import Overlay from "@common/components/ui/Overlay";
import { SheetGestureRoot, SheetHandle, useSheetMotion } from "@common/components/ui/sheetDrag";
import { formatDayMonth } from "@common/dateLocale";
import { CustomText, useTheme, logError } from "@common";
import { getDayDetail, getDayActivity } from "../../database/analytics";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  dateText: {
    fontSize: 24,
    fontWeight: "500",
    marginBottom: 16,
  },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actMid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  actTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  actDuration: {
    fontSize: 14,
    fontWeight: "400",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
    lineHeight: androidLineHeight(22),
  },
});

const BookIcon = ({ color }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);
BookIcon.propTypes = {
  color: PropTypes.string.isRequired,
};

const HeadphoneIcon = ({ color }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);
HeadphoneIcon.propTypes = {
  color: PropTypes.string.isRequired,
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, mo, d] = dateStr.split("-").map(Number);
  return formatDayMonth(new Date(y, mo - 1, d));
};

const DayDetailModal = ({ visible, date = null, onClose }) => {
  const { theme } = useTheme();
  // The Dashboard's own colours, not the semantic layer.
  const { c } = themeForScreen(theme, "dashboard");
  const palette = paletteFor("dashboard", theme);
  // The Dashboard blue, from the token layer — see ActivityCalendar.
  const accentBlue = c.textBrand;
  const bg = palette.sectionBg;
  const iconBg = palette.dayIconBg;

  const [detail, setDetail] = useState(null);
  const [dayActivity, setDayActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  // Opens, drags and closes like every other sheet — see sheetDrag. Dragged
  // from anywhere on it: nothing inside scrolls.
  const motion = useSheetMotion({ visible, onClose, grabEverywhere: true });

  useEffect(() => {
    if (!visible || !date) return;
    setLoading(true);
    setDetail(null);
    setDayActivity(null);
    Promise.all([getDayDetail(date), getDayActivity(date)])
      .then(([d, activity]) => {
        setDetail(d);
        setDayActivity(activity);
      })
      .catch(logError)
      .finally(() => setLoading(false));
  }, [visible, date]);

  const totalReadSecs = detail?.reads.reduce((s, r) => s + (r.duration || 0), 0) ?? 0;
  const totalListenSecs = detail?.listens.reduce((s, r) => s + (r.duration || 0), 0) ?? 0;

  const hasRead = totalReadSecs > 0;
  const hasListen = totalListenSecs > 0;

  // Per-session detail (bani_read_history/audio_history) is device-local and
  // never restored from a cloud snapshot — only the daily aggregate is. So a
  // day restored on a fresh install has real activity but no per-bani rows.
  // Fall back to the aggregate rather than falsely showing "no activity".
  const aggregateReadSecs = dayActivity?.reading_seconds ?? 0;
  const aggregateListenSecs = dayActivity?.listening_seconds ?? 0;
  const showAggregateRead = !hasRead && aggregateReadSecs > 0;
  const showAggregateListen = !hasListen && aggregateListenSecs > 0;

  if (!motion.mounted) return null;

  return (
    // The slide up starts on `onShow` — see sheetDrag.
    <Overlay animationType="none" onRequestClose={onClose} onShow={motion.onShow}>
      {/* The same plain scrim every other overlay in the app uses. This was the
          last native BlurView left: it rendered differently on iOS and Android,
          and it was the only backdrop on the Dashboard that did not match the
          sheets beside it. */}
      {/* A Modal is its own window on Android, outside the app's gesture root.
          See sheetDrag. */}
      <SheetGestureRoot>
        <View style={styles.root}>
          {/* Thins as the card is dragged away. */}
          <Reanimated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: c.scrim }, motion.scrimStyle]}
          />
          {/* Tap anywhere outside the card to dismiss. */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
          <GestureDetector gesture={motion.gesture}>
            <Reanimated.View style={motion.panelStyle} onLayout={motion.onPanelLayout}>
              <View
                style={[styles.sheet, { backgroundColor: bg }]}
                onStartShouldSetResponder={() => true}
              >
                <SheetHandle onClose={onClose} />

                <CustomText style={[styles.dateText, { color: c.textPrimary }]}>
                  {formatDate(date)}
                </CustomText>

                {loading && (
                  <CustomText style={[styles.emptyText, { color: c.textSecondary }]}>
                    Loading...
                  </CustomText>
                )}

                {!loading && (
                  <>
                    {(hasRead || showAggregateRead) && (
                      <View style={styles.actRow}>
                        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                          <BookIcon color={accentBlue} />
                        </View>
                        <View style={styles.actMid}>
                          <CustomText style={[styles.actTitle, { color: c.textPrimary }]}>
                            Reading
                          </CustomText>
                          <CustomText style={[styles.actDuration, { color: c.textSecondary }]}>
                            {Math.floor((hasRead ? totalReadSecs : aggregateReadSecs) / 60)}m
                          </CustomText>
                        </View>
                      </View>
                    )}

                    {(hasListen || showAggregateListen) && (
                      <View style={styles.actRow}>
                        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                          <HeadphoneIcon color={accentBlue} />
                        </View>
                        <View style={styles.actMid}>
                          <CustomText style={[styles.actTitle, { color: c.textPrimary }]}>
                            Listening
                          </CustomText>
                          <CustomText style={[styles.actDuration, { color: c.textSecondary }]}>
                            {Math.floor((hasListen ? totalListenSecs : aggregateListenSecs) / 60)}m
                          </CustomText>
                        </View>
                      </View>
                    )}

                    {!hasRead && !hasListen && !showAggregateRead && !showAggregateListen && (
                      <CustomText style={[styles.emptyText, { color: c.textSecondary }]}>
                        No activity recorded for this day
                      </CustomText>
                    )}
                  </>
                )}
              </View>
            </Reanimated.View>
          </GestureDetector>
        </View>
      </SheetGestureRoot>
    </Overlay>
  );
};

DayDetailModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  date: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default DayDetailModal;
