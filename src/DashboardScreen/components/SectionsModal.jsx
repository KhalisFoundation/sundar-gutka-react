import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import { ChevronRight, DragHandleIcon, EyeIcon } from "@common/icons";
import {
  CustomText,
  STRINGS,
  constant,
  actions,
  showErrorToast,
  trackDashboardEvent,
} from "@common";
import { requestPush } from "../../services/dashboard/syncSignal";
import useDashboardTheme from "./dashboardTheme";
import { sectionLabel } from "./sectionRegistry";
import SheetModal from "./SheetModal";

// The Dashboard's section list, in two views.
//
// BROWSE is what opens: a plain list of the sections on the page, and tapping
// one closes the sheet and takes you to it. That is what this sheet is for most
// of the time — the page is long, and scrolling to the calendar was the only
// way to reach it.
//
// EDIT is the old sheet, reached by the button in the header: press and hold to
// reorder, and an eye to show or hide. Rearranging your dashboard is a rare,
// deliberate act, so it no longer greets everyone who wants to jump to
// Reminders.
const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  container: { flex: 1 },
  listContent: { padding: 20, paddingTop: 6, paddingBottom: 24 },
  listWrap: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  // Starts from its OWN width, not from zero.
  //
  // `flex: 1` here meant `flexBasis: 0`: the title began at zero width and
  // lived on whatever Cancel and Save left over. Both of those carry text that
  // grows with the OS text setting, so at a raised size the leftover was
  // narrower than the word "Customize" — and a word with nowhere to wrap breaks
  // mid-word, which is how the title rendered as "Custo / mize lay…". Starting
  // from its own width means the three shrink in proportion instead.
  //
  // `alignItems: center` on the row keeps Cancel and Save centred against a
  // title that has grown to two lines.
  headerTitle: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    fontSize: 17,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  // 44pt minimum touch targets on both header controls.
  headerBtn: { minHeight: 44, minWidth: 60, justifyContent: "center" },
  headerBtnEnd: { alignItems: "flex-end" },
  // The same bar with the title lifted onto its own line — see headerBar.
  headerStacked: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  // Owns the full width here, so it neither pads itself in from the actions nor
  // grows — `flexGrow` in a COLUMN would stretch it vertically instead.
  headerTitleStacked: { flexGrow: 0, paddingHorizontal: 0 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  action: { fontSize: 15 },
  saveBtn: {
    minHeight: 44,
    minWidth: 60,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // See EditBanisModal: colour comes from c.onAccent at render.
  saveText: { fontSize: 15 },
  pressed: { opacity: 0.7 },
  hint: { fontSize: 12, paddingHorizontal: 20, paddingTop: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    // A solid 1dp, not a hairline: on a non-integer density a hairline rounds
    // to zero on alternate rows, so half the rules simply vanish.
    borderBottomWidth: 1,
  },
  // A minimum, so a long translation makes the row taller rather than clipping.
  browseRow: { minHeight: 56 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  // The eye is its own target inside a row that is itself draggable, so it
  // needs a full-size box of its own rather than relying on the glyph.
  eyeBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  resetBtn: { alignItems: "center", paddingVertical: 18 },
  resetText: { fontSize: 14 },
});

const SectionsModal = ({ visible, onClose, onSelectSection }) => {
  const { cardBg, accentBlue, primaryText, mutedText, separator, theme, c, palette } =
    useDashboardTheme();
  // Explicit fontFamily (no fontWeight alongside it) — pairing a numeric
  // fontWeight with a custom TTF makes Android synthesize a fake bold and
  // silently fall back off the real glyph, which was making the title/Save
  // text render in the system font instead of Baloo Paaji.
  const boldFont = theme.typography.fonts.balooPaajiSemiBold;
  const dispatch = useDispatch();
  const layout = useSelector((state) => state.dashboardLayout);

  // Past this the header's three parts stop sharing a line — see headerBar.
  // The same threshold the shared list Row uses for its title/value pair, so
  // the app breaks to two lines at one size rather than several.
  const { fontScale } = useWindowDimensions();
  const stackHeader = fontScale >= 1.3;

  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(layout.order);
  // Measured space left for the list once the header and hint have taken theirs.
  const [listHeight, setListHeight] = useState(0);
  const onListWrapLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    setListHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, []);
  const [hidden, setHidden] = useState(layout.hidden);

  // A reopened sheet starts in BROWSE with the saved layout, so an abandoned
  // edit is never waiting where a jump was expected.
  useEffect(() => {
    if (visible) {
      setEditing(false);
      setOrder(layout.order);
      setHidden(layout.hidden);
    }
  }, [visible, layout]);

  const visibleCount = order.filter((k) => !hidden.includes(k)).length;

  const toggleHidden = useCallback(
    (key) => {
      setHidden((prev) => {
        if (prev.includes(key)) return prev.filter((k) => k !== key);
        // Enforce minimum visible sections.
        if (visibleCount <= constant.DASHBOARD_MIN_VISIBLE) {
          showErrorToast(`Keep at least ${constant.DASHBOARD_MIN_VISIBLE} sections visible`);
          return prev;
        }
        return [...prev, key];
      });
    },
    [visibleCount]
  );

  // The layout is account data, not device data — it travels with the person.
  // Both paths ring the sync signal; without it a rearranged dashboard sat on
  // this phone until something unrelated happened to trigger a push.
  const save = useCallback(() => {
    // What the page ends up looking like, not which rows were touched: the
    // useful question is how many people hide sections and reorder at all.
    trackDashboardEvent("sections_changed", {
      hidden_count: hidden.length,
      visible_count: order.length - hidden.length,
      reordered: order.join(",") !== layout.order.join(","),
    });
    dispatch(actions.setDashboardLayout({ order, hidden }));
    requestPush("dashboard-layout");
    setEditing(false);
  }, [order, hidden, dispatch, layout.order]);

  const reset = useCallback(() => {
    trackDashboardEvent("sections_reset");
    dispatch(actions.resetDashboardLayout());
    requestPush("dashboard-layout-reset");
    setEditing(false);
  }, [dispatch]);

  // Only what is actually ON the page can be jumped to, so browse lists the
  // visible sections in their rendered order — the same list the Dashboard
  // maps over. A hidden section has nowhere to scroll to.
  const browsable = layout.order.filter((key) => !layout.hidden.includes(key));

  const renderItem = useCallback(
    ({ item: key, drag, isActive }) => {
      const isVisible = !hidden.includes(key);
      return (
        <ShadowDecorator>
          <ScaleDecorator>
            {/* Long-press anywhere on the row to pick it up and drag (same gesture
                as Edit Bani Order). Rows render flat on the screen background with
                a subtle divider — no card rectangle. The eye handles its own taps. */}
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              delayLongPress={150}
              style={[
                styles.row,
                { borderBottomColor: palette.listDivider },
                isActive && { backgroundColor: cardBg, borderBottomColor: "transparent" },
              ]}
            >
              <DragHandleIcon color={mutedText} />
              <CustomText
                style={[styles.rowLabel, { color: isVisible ? primaryText : mutedText }]}
                numberOfLines={2}
              >
                {sectionLabel(key)}
              </CustomText>
              {/* An eye rather than a switch: a switch is a setting you leave
                  on or off, and this is one row's visibility among many. The
                  struck-through eye says "hidden" without depending on colour. */}
              <Pressable
                onPress={() => toggleHidden(key)}
                hitSlop={8}
                style={styles.eyeBtn}
                accessibilityRole="button"
                accessibilityState={{ selected: isVisible }}
                accessibilityLabel={`${sectionLabel(key)}, ${
                  isVisible ? STRINGS.SECTION_HIDE : STRINGS.SECTION_SHOW
                }`}
              >
                <EyeIcon size={22} off={!isVisible} color={isVisible ? accentBlue : mutedText} />
              </Pressable>
            </Pressable>
          </ScaleDecorator>
        </ShadowDecorator>
      );
    },
    [hidden, cardBg, mutedText, primaryText, accentBlue, palette, toggleHidden]
  );

  // Both views wear the same bar — [action] [title] [action] — so it is built
  // once. The two differ only in what those three are.
  //
  // Past a raised OS text size the three cannot share a line. Cancel and Save
  // both carry text that grows with the setting and neither can shrink, so what
  // is left in the middle ends up narrower than the word "Customize" — and a
  // word with nowhere to wrap breaks mid-word, which is how the title rendered
  // as "Custo / mize lay…". Giving the title a proper flex basis was not enough
  // because the room genuinely was not there; stacked, it owns the full width
  // and the two actions share the row beneath it.
  const headerBar = (left, title, right) => (
    <View
      style={[stackHeader ? styles.headerStacked : styles.header, { borderBottomColor: separator }]}
    >
      {stackHeader ? (
        <>
          <CustomText
            style={[
              styles.headerTitle,
              styles.headerTitleStacked,
              { color: primaryText, fontFamily: boldFont },
            ]}
          >
            {title}
          </CustomText>
          <View style={styles.headerActions}>
            {left}
            {right}
          </View>
        </>
      ) : (
        <>
          {left}
          <CustomText
            style={[styles.headerTitle, { color: primaryText, fontFamily: boldFont }]}
            numberOfLines={2}
          >
            {title}
          </CustomText>
          {right}
        </>
      )}
    </View>
  );

  const cancelAction = (onPress) => (
    <Pressable onPress={onPress} style={styles.headerBtn} hitSlop={8}>
      <CustomText style={[styles.action, { color: mutedText }]}>{STRINGS.CANCEL}</CustomText>
    </Pressable>
  );

  const header = editing
    ? headerBar(
        cancelAction(() => setEditing(false)),
        STRINGS.CUSTOMIZE_LAYOUT,
        // Primary action, styled as a button — matches Edit Banis.
        <Pressable
          onPress={save}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: accentBlue },
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <CustomText style={[styles.saveText, { fontFamily: boldFont, color: c.onAccent }]}>
            {STRINGS.SAVE}
          </CustomText>
        </Pressable>
      )
    : headerBar(
        cancelAction(onClose),
        STRINGS.SECTIONS,
        // Rearranging is the rarer job, so it is a quiet link here rather than
        // the filled button — that weight belongs to Save, inside the edit view.
        <Pressable
          onPress={() => setEditing(true)}
          style={[styles.headerBtn, styles.headerBtnEnd]}
          hitSlop={8}
          accessibilityRole="button"
        >
          <CustomText style={[styles.action, { color: accentBlue, fontFamily: boldFont }]}>
            {STRINGS.EDIT}
          </CustomText>
        </Pressable>
      );

  return (
    <SheetModal visible={visible} onClose={onClose} heightRatio={0.75}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.container}>
          {header}

          <CustomText style={[styles.hint, { color: mutedText }]}>
            {editing ? STRINGS.DRAG_TO_REORDER : STRINGS.SECTIONS_HINT}
          </CustomText>

          {/* DraggableFlatList needs an EXPLICIT height. Inside a Modal a
              flex:1 chain does not resolve reliably — the list measured zero
              and rendered nothing — so this wrapper is measured and the height
              handed to the list directly. The list is withheld until that
              first layout arrives rather than mounted at zero height. */}
          <View style={styles.listWrap} onLayout={onListWrapLayout}>
            {listHeight > 0 && editing ? (
              <DraggableFlatList
                data={order}
                keyExtractor={(key) => key}
                renderItem={renderItem}
                onDragEnd={({ data }) => setOrder(data)}
                style={{ height: listHeight }}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                  <Pressable onPress={reset} style={styles.resetBtn} hitSlop={6}>
                    <CustomText style={[styles.resetText, { color: mutedText }]}>
                      {STRINGS.RESET_TO_DEFAULT}
                    </CustomText>
                  </Pressable>
                }
              />
            ) : null}

            {/* Browse needs no drag gesture and no measured height, so it is an
                ordinary ScrollView rather than a second draggable list. */}
            {!editing ? (
              <ScrollView contentContainerStyle={styles.listContent}>
                {browsable.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => {
                      trackDashboardEvent("section_jump", { section: key });
                      onSelectSection(key);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      styles.browseRow,
                      { borderBottomColor: palette.listDivider },
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                  >
                    <CustomText style={[styles.rowLabel, { color: primaryText }]} numberOfLines={2}>
                      {sectionLabel(key)}
                    </CustomText>
                    <ChevronRight size={20} color={mutedText} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </GestureHandlerRootView>
    </SheetModal>
  );
};

SectionsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /** Closes the sheet and takes the reader to that section on the page. */
  onSelectSection: PropTypes.func.isRequired,
};

export default SectionsModal;
