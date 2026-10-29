import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Platform, View, Pressable, ScrollView, StyleSheet } from "react-native";
import Svg, { Circle, Polyline, Path, Line } from "react-native-svg";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import { Text as UIText } from "@common/components/ui";
import useBaniLookup from "@common/hooks/useBaniLookup";
import nitnemSelection from "@common/nitnem/selection";
import { defaultPothi } from "@common/pothi/model";
import { CustomText, STRINGS, constant, actions, logError, trackDashboardEvent } from "@common";
import { getDayDetail } from "../../database/analytics";
import { requestPush } from "../../services/dashboard/syncSignal";
import CheckCircle from "./CheckCircle";
import DashboardCard from "./DashboardCard";
import useDashboardTheme from "./dashboardTheme";
import EditBanisModal from "./EditBanisModal";
import SectionLabel from "./SectionLabel";

const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  card: { padding: 18 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  editLink: { fontSize: 13, fontWeight: "600" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerText: { flex: 1 },
  subtitle: { fontSize: 17 },
  ringCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  // An explicit lineHeight means two different things on the two platforms.
  // Android pads the glyph box and draws whatever overflows; iOS takes the
  // number literally and CLIPS to it, so Baloo's tall digits lost their top
  // inside the ring at 15/17. iOS gets a line box the glyphs actually fit in
  // (and no negative margin pulling the label into the number above it);
  // Android keeps the values its rhythm was tuned with.
  //
  // The two lines still clear the ring: 20 + 13 against an inner diameter of
  // 46 (64 across, 9 of stroke each side).
  ringNum: {
    fontSize: 15,
    lineHeight: Platform.OS === "ios" ? 20 : 17,
    textAlign: "center",
  },
  ringLabel: {
    fontSize: 10,
    lineHeight: Platform.OS === "ios" ? 13 : 11,
    marginTop: Platform.OS === "ios" ? 0 : -1,
    textAlign: "center",
  },
  listDivider: { height: 1, marginVertical: 16 },
  // ~8 rows visible (4 per column) then scrolls within the card.
  gridScroll: { maxHeight: 184 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingRight: 8,
  },
  baniNamePress: { flex: 1 },
  baniName: { fontSize: 13, fontWeight: "400", flexShrink: 1 },
  actions: { flexDirection: "row", gap: 12, marginTop: 18 },
  primaryBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  // Colour comes from c.onAccent at render — the button is filled with the
  // Dashboard blue, which is a LIGHT blue in dark mode.
  primaryBtnText: { fontSize: 13, flexShrink: 1 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, flexShrink: 1 },
  // The completed badge. The primary button's own padding and radius, centred
  // and full width — it replaces the whole action row, so anything narrower
  // reads as a button that lost its partner. No fixed height: it grows with the
  // label's own translation and the user's font-size setting.
  doneBanner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  doneText: { fontSize: 13, flexShrink: 1 },
});

// Builds a filled "rounded annulus sector" — the progress fill as its own
// shape (outer arc + inner arc + 4 small corner fillets of radius `capR`)
// instead of a stroked circle. Unlike strokeLinecap="round" (always exactly
// stroke/2), this corner radius is independent of the bar's thickness — set
// it below stroke/2 for a flat-topped end with softened corners.
const buildRoundedArcPath = (cx, cy, r, stroke, startDeg, endDeg, capR) => {
  const outerR = r + stroke / 2;
  const innerR = r - stroke / 2;
  const toXY = (deg, radius) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
  };
  const span = endDeg - startDeg;
  // Shrink the corner radius if the arc is too short to fit two fillets.
  const maxCapR = (span * innerR * Math.PI) / 360;
  const safeCapR = Math.max(0, Math.min(capR, maxCapR * 0.85));
  const outerInset = (safeCapR / outerR) * (180 / Math.PI);
  const innerInset = (safeCapR / innerR) * (180 / Math.PI);

  const pOuterStart = toXY(startDeg + outerInset, outerR);
  const pOuterEnd = toXY(endDeg - outerInset, outerR);
  const pOuterFlatStart = toXY(startDeg, outerR - safeCapR);
  const pOuterFlatEnd = toXY(endDeg, outerR - safeCapR);
  const pInnerFlatStart = toXY(startDeg, innerR + safeCapR);
  const pInnerFlatEnd = toXY(endDeg, innerR + safeCapR);
  const pInnerStart = toXY(startDeg + innerInset, innerR);
  const pInnerEnd = toXY(endDeg - innerInset, innerR);
  const largeArc = span > 180 ? 1 : 0;

  return [
    `M ${pOuterStart.x} ${pOuterStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${pOuterEnd.x} ${pOuterEnd.y}`,
    `A ${safeCapR} ${safeCapR} 0 0 1 ${pOuterFlatEnd.x} ${pOuterFlatEnd.y}`,
    `L ${pInnerFlatEnd.x} ${pInnerFlatEnd.y}`,
    `A ${safeCapR} ${safeCapR} 0 0 1 ${pInnerEnd.x} ${pInnerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${pInnerStart.x} ${pInnerStart.y}`,
    `A ${safeCapR} ${safeCapR} 0 0 1 ${pInnerFlatStart.x} ${pInnerFlatStart.y}`,
    `L ${pOuterFlatStart.x} ${pOuterFlatStart.y}`,
    `A ${safeCapR} ${safeCapR} 0 0 1 ${pOuterStart.x} ${pOuterStart.y}`,
    "Z",
  ].join(" ");
};

// EDGE_PAD keeps the ring's OUTER edge strictly inside the SVG viewport. Without
// it r = (size - stroke) / 2 puts that edge at exactly size/2 — flush with the
// boundary — and subpixel rounding shaved a chunk off, which is why the ring
// rendered as a broken "C" instead of a closed circle.
const RING_EDGE_PAD = 1.5;

const ProgressRing = ({ done, total, accent, track, numColor, labelColor, numFont }) => {
  const size = 64;
  const stroke = 9;
  const r = (size - stroke) / 2 - RING_EDGE_PAD;
  const cx = size / 2;
  const cy = size / 2;
  const pct = total > 0 ? done / total : 0;
  // Independent of stroke width — smaller than stroke/2 softens the corners
  // without a full round "pill" bulge. Tune this one number to taste.
  const capR = 2.5;
  const progressPath =
    pct > 0 && pct < 1 ? buildRoundedArcPath(cx, cy, r, stroke, 0, pct * 360, capR) : null;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* viewBox pins the coordinate space so the ring renders identically at
          any pixel density / font scale. */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {pct >= 1 ? (
          <Circle cx={cx} cy={cy} r={r} stroke={accent} strokeWidth={stroke} fill="none" />
        ) : null}
        {progressPath ? <Path d={progressPath} fill={accent} /> : null}
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.ringCenter}>
          {/* Font scaling is capped INSIDE the ring. The ring is a fixed 64pt
              SVG, and these two lines carry hardcoded line heights (17 and 11).
              React Native scales `fontSize` with the OS setting but leaves an
              explicit `lineHeight` alone, so at 1.5x a 22pt "0/5" sat in a 17dp
              box and "banis" — pulled up by its own -1 margin — printed on top
              of it. Capping keeps the label legible and inside its circle; the
              same count is in the heading beside it either way. */}
          <UIText
            variant="inherit"
            style={[styles.ringNum, { color: numColor, fontFamily: numFont }]}
            maxFontSizeMultiplier={1}
          >
            {done}/{total}
          </UIText>
          <UIText
            variant="inherit"
            style={[styles.ringLabel, { color: labelColor }]}
            maxFontSizeMultiplier={1}
          >
            {STRINGS.BANIS_LABEL}
          </UIText>
        </View>
      </View>
    </View>
  );
};
ProgressRing.propTypes = {
  done: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  accent: PropTypes.string.isRequired,
  track: PropTypes.string.isRequired,
  numColor: PropTypes.string.isRequired,
  labelColor: PropTypes.string.isRequired,
  numFont: PropTypes.string.isRequired,
};

// Bare checkmark (no ring) for the "Mark done" button — distinct from the
// filled-circle Check used per-bani in the grid above.
const CheckIcon = ({ color }) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
CheckIcon.propTypes = { color: PropTypes.string.isRequired };

const PlayIcon = ({ color }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill={color}>
    <Path d="M8 5v14l11-7z" />
  </Svg>
);
PlayIcon.propTypes = { color: PropTypes.string.isRequired };

const EditIcon = ({ color }) => (
  <Svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
  </Svg>
);
EditIcon.propTypes = { color: PropTypes.string.isRequired };

const PlusCircle = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
    <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
PlusCircle.propTypes = { color: PropTypes.string.isRequired };

// Small counts only (realistic Nitnem list size); falls back to the numeral past 20.
const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];
const numberToWords = (n) => ONES[n] ?? String(n);

const TodaysNitnem = ({ refreshKey = 0 }) => {
  const {
    accentBlue: baseAccentBlue,
    mutedText,
    separator,
    theme,
    c,
    palette,
  } = useDashboardTheme();
  // Matches the username/streak accent color (blue in light, off-white in dark).
  // Nitnem's own figure/label colour, NOT the body text colour: the ring count,
  // "banis left today", a completed bani name and Mark Done all read as one
  // accent rather than as ordinary near-black copy.
  const accentTextColor = palette.accentText;
  // The shared dashboard accent, with no local override. There used to be a
  // dark-mode-only variant here; it is gone, because every blue role now
  // resolves to the one app blue in dark mode, so a second value could only
  // drift away from it.
  const accentBlue = baseAccentBlue;
  const boldFont = theme.typography.fonts.balooPaajiSemiBold;
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { completed } = useSelector((state) => state.todaysNitnem);
  // Today's Nitnem IS the Morning Nitnem pothi. The heading stays "Today's
  // Nitnem", but there is no separate list behind it: adding or removing a bani
  // here edits that pothi, and editing the pothi from the Folders tab shows up
  // here, because there is only ever one list. It used to keep its own
  // `selectedBaniIds`, which meant the same user had two different Nitnems.
  const morning = useSelector((state) => defaultPothi(state.pothis, "morning"));
  // The pothi's own list when the pothi exists — that is where a signed-in
  // account's list arrives from, and where this user's edits go — and the
  // built-in defaults only when there is no pothi at all (fresh state, or the
  // account boundary reset it before the Home-tab hook re-seeds). An EMPTIED
  // pothi is shown as empty: substituting the defaults there made "unselect
  // all, save" look like it had not saved. See nitnemSelection. READ-only:
  // nothing here writes the pothi or the sync payload.
  const { ids: selectedBaniIds, emptied } = useMemo(() => nitnemSelection(morning), [morning]);
  const { map: baniMap, nameOf } = useBaniLookup();

  const [editVisible, setEditVisible] = useState(false);
  // This card edits the Morning Nitnem POTHI. Signed in, the two are one list
  // and the change syncs on the account; signed out the nitnem is still the
  // user's to arrange, and stays on the device until there is an account to
  // carry it.
  const openEditor = useCallback(() => {
    trackDashboardEvent("nitnem_edit_opened");
    setEditVisible(true);
  }, []);

  const today = todayStr();

  // Single source of truth for what's done today: the persisted `completed`
  // list. It holds both manual ticks (TOGGLE_NITNEM_DONE) and auto-detected
  // 95%-scroll reads (folded in by markNitnemAutoDone below), so a manual
  // un-tick actually sticks instead of being re-added from a live DB read.
  const doneSet = useMemo(() => new Set(completed?.[today] ?? []), [completed, today]);

  // Auto-completion is 95%-scroll ONLY. useReadingSession marks a read
  // `completed` once the scroll crosses 95% — and with audio sync-scroll on,
  // the text auto-scrolls as it plays, so listening to the end hits 95% and
  // records a read completion too. There is deliberately no separate
  // listen-duration path. Detected ids are merged into the persisted `completed`
  // list (so they survive reinstall + cloud sync); markNitnemAutoDone never
  // resurrects an id the user has since manually un-ticked (see autoSeeded).
  useEffect(() => {
    let active = true;
    getDayDetail(today)
      .then(({ reads }) => {
        if (!active) return;
        // Carry WHEN each read completed, not just which bani. The reducer
        // needs it to tell this same read being re-reported on every refocus
        // (must not undo an un-tick) from a genuinely new one after an un-tick
        // (must count) — see MARK_NITNEM_AUTO_DONE.
        const ids = reads
          .filter((r) => r.completed)
          .map((r) => ({ id: r.bani_id, at: r.completed_at ?? null }));
        if (ids.length > 0) dispatch(actions.markNitnemAutoDone(today, ids));
      })
      .catch(logError);
    return () => {
      active = false;
    };
  }, [today, refreshKey, dispatch]);
  const doneCount = selectedBaniIds.filter((id) => doneSet.has(id)).length;
  const remaining = selectedBaniIds.length - doneCount;
  const firstIncomplete = selectedBaniIds.find((id) => !doneSet.has(id));

  const openBani = useCallback(
    (id) => {
      const b = baniMap[id];
      if (!b) return;
      // `done` separates re-reading a finished bani from working through the
      // remaining ones, which are different intents on the same control.
      trackDashboardEvent("nitnem_bani_open", { bani_id: id, done: doneSet.has(id) });
      dispatch(actions.toggleAudio(false));
      navigation.navigate(constant.READER, {
        key: `Reader-${b.id}`,
        params: { id: b.id, title: b.gurmukhi, titleUni: b.gurmukhiUni },
      });
    },
    [baniMap, dispatch, navigation, doneSet]
  );

  // English spells the count out ("two banis left"); other languages keep the
  // numeral since spelled-out numbers need per-language translation we don't have.
  const isEnglish = STRINGS.getLanguage() === "en-US";
  // An empty pothi is NOT "all done today" — that read as a finished Nitnem to
  // someone who has none. Emptied on purpose (here, or from another device) it
  // says so; the other empty — a signed-in first launch before the folders
  // pull lands — keeps the generic line.
  let doneSubtitle = STRINGS.ALL_DONE_TODAY;
  if (emptied) doneSubtitle = STRINGS.NITNEM_NO_BANI_ADDED;
  else if (selectedBaniIds.length === 0) doneSubtitle = STRINGS.POTHI_NO_BANIS;
  const rawSubtitle =
    remaining > 0
      ? STRINGS.formatString(STRINGS.NITNEM_LEFT, {
          count: isEnglish ? numberToWords(remaining) : remaining,
        })
      : doneSubtitle;
  // numberToWords lowercases the spelled-out count ("five"), which sits first
  // in the sentence — capitalize it (no-op for a leading digit in other langs).
  const subtitle = rawSubtitle ? rawSubtitle[0].toUpperCase() + rawSubtitle.slice(1) : rawSubtitle;

  // Two-column grid cells: all selected banis + a trailing "Add a bani" cell.
  const cells = [...selectedBaniIds.map((id) => ({ type: "bani", id })), { type: "add" }];

  /**
   * The card's actions, which depend on how much of the Nitnem is left.
   *
   * Finished, the two buttons are replaced by a completion badge rather than
   * left on screen doing nothing. It takes over the primary button's own fill,
   * padding and radius, so the row keeps exactly the weight and shape it had a
   * moment ago instead of changing colour when the last bani is ticked.
   *
   * It is a STATUS, not a control: no press handler and no press state. The
   * banis stay tappable in the grid above, so re-reading one needs no button.
   *
   * The banis themselves stay tappable in the grid above, so re-reading one
   * costs nothing and needs no button of its own.
   */
  const actionsFor = () => {
    if (selectedBaniIds.length === 0) return null;

    if (!firstIncomplete) {
      return (
        <View
          style={[styles.actions, styles.doneBanner, { backgroundColor: accentBlue }]}
          accessibilityRole="text"
        >
          <CheckIcon color={c.onAccent} />
          <CustomText
            style={[styles.doneText, { color: c.onAccent, fontFamily: boldFont }]}
            numberOfLines={2}
          >
            {STRINGS.NITNEM_COMPLETE}
          </CustomText>
        </View>
      );
    }

    return (
      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: accentBlue }]}
          onPress={() => openBani(firstIncomplete)}
          accessibilityRole="button"
        >
          <PlayIcon color={c.onAccent} />
          <CustomText
            style={[styles.primaryBtnText, { color: c.onAccent, fontFamily: boldFont }]}
            numberOfLines={2}
          >
            {`${STRINGS.CONTINUE} · ${nameOf(firstIncomplete) || ""}`.trim().replace(/·\s*$/, "")}
          </CustomText>
        </Pressable>
        {/* Bulk mark-done for Nitnem completed outside the app. Its OWN action,
            not the auto-detection one: that path deliberately ignores any id it
            has already seeded, so sharing it left this button dead from the
            second press onward — tick all, untick one, and nothing happened. */}
        <Pressable
          style={[styles.secondaryBtn, { borderColor: separator }]}
          onPress={() => {
            // `remaining`, not the list length: the banis already ticked are
            // not completed again by this press, and counting them would
            // inflate every bulk completion by whatever was done beforehand.
            trackDashboardEvent("nitnem_marked_done", { source: "mark_all", count: remaining });
            dispatch(actions.markNitnemDone(today, selectedBaniIds));
            requestPush("nitnem-mark-all");
          }}
          accessibilityRole="button"
        >
          <CheckIcon color={accentBlue} />
          <CustomText
            style={[styles.secondaryBtnText, { color: accentTextColor, fontFamily: boldFont }]}
            numberOfLines={2}
          >
            {STRINGS.MARK_DONE}
          </CustomText>
        </Pressable>
      </View>
    );
  };

  return (
    <View>
      <SectionLabel
        title={STRINGS.TODAYS_NITNEM}
        right={
          <Pressable onPress={openEditor} hitSlop={8} style={styles.editRow}>
            {/* Icon and label are ONE control and share one colour. */}
            <EditIcon color={accentBlue} />
            <CustomText style={[styles.editLink, { color: accentBlue }]}>
              {STRINGS.EDIT_BANIS}
            </CustomText>
          </Pressable>
        }
      />

      <View style={styles.wrap}>
        <DashboardCard style={styles.card}>
          <View style={styles.headerRow}>
            <ProgressRing
              done={doneCount}
              total={selectedBaniIds.length}
              accent={accentBlue}
              track={palette.ringTrack}
              numColor={accentTextColor}
              labelColor={mutedText}
              numFont={boldFont}
            />
            <View style={styles.headerText}>
              <CustomText
                style={[styles.subtitle, { color: accentTextColor, fontFamily: boldFont }]}
              >
                {subtitle}
              </CustomText>
            </View>
          </View>

          <View style={[styles.listDivider, { backgroundColor: separator }]} />

          {/* Two-column grid; shows ~8 then scrolls within the card */}
          <ScrollView
            style={styles.gridScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            indicatorStyle={theme.chrome.scrollIndicator}
            persistentScrollbar
            contentContainerStyle={styles.grid}
          >
            {cells.map((cell) => {
              if (cell.type === "add") {
                return (
                  <Pressable key="add" style={styles.gridItem} onPress={openEditor}>
                    <PlusCircle color={accentBlue} />
                    <CustomText style={[styles.baniName, { color: accentBlue }]} numberOfLines={2}>
                      {STRINGS.ADD_BANI}
                    </CustomText>
                  </Pressable>
                );
              }
              const isDone = doneSet.has(cell.id);
              return (
                <View key={cell.id} style={styles.gridItem}>
                  {/* Manual tick — toggles the bani in the same persisted
                      `completed` list the 95%-scroll auto-detection writes to,
                      so it both marks AND un-marks (incl. auto-completed banis). */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      // Read BEFORE the dispatch: `isDone` is this render's
                      // state, so it says which way the toggle is about to go.
                      if (isDone) trackDashboardEvent("nitnem_unmarked");
                      else trackDashboardEvent("nitnem_marked_done", { source: "tick", count: 1 });
                      dispatch(actions.toggleNitnemDone(today, cell.id));
                      requestPush("nitnem-tick");
                    }}
                  >
                    <CheckCircle filled={isDone} accent={accentBlue} muted={mutedText} />
                  </Pressable>
                  <Pressable style={styles.baniNamePress} onPress={() => openBani(cell.id)}>
                    <CustomText
                      style={[
                        styles.baniName,
                        { color: mutedText },
                        isDone && { color: accentTextColor, fontFamily: boldFont },
                      ]}
                      // Wraps onto a second line instead of clipping to
                      // "ਜਪੁਜੀ ਸਾ…". The grid scrolls inside the card, so a
                      // taller row costs nothing but reading the whole name.
                      numberOfLines={2}
                    >
                      {nameOf(cell.id) || `Bani ${cell.id}`}
                    </CustomText>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          {/* Three states, and never a control that does nothing.
              Continue was already `disabled` when there was nothing left to
              continue, but it kept its filled accent so it read as live, and
              Mark Done stayed fully enabled while dispatching a no-op — two
              buttons that answered a tap with silence.
              Nothing to read at all → no row: the grid's own "Add a bani" cell
              is the only action that makes sense, and it is already there. */}
          {actionsFor()}
        </DashboardCard>
      </View>

      <EditBanisModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
};

TodaysNitnem.propTypes = { refreshKey: PropTypes.number };

export default TodaysNitnem;
