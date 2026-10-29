import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import { requestPull } from "@service/dashboard/syncSignal";
import PropTypes from "prop-types";
import useScreenPalette from "@common/hooks/useScreenPalette";
import useTokens from "@common/hooks/useTokens";
import { DragHandleIcon } from "@common/icons";
import { defaultPothiId, emptyPothis, MAX_PINNED } from "@common/pothi/model";
import { folderTabRows, resolveBanis } from "@common/pothi/selectors";
import { actions, STRINGS, trackPothiEvent, useCustomScrollbar } from "@common";
import { ListSeparator, PullToRefresh, Text } from "../common/components/ui";
import NewPothiRow from "./components/NewPothiRow";
import PothiActionsSheet from "./components/PothiActionsSheet";
import PothiRow from "./components/PothiRow";
import usePothiTitle from "./hooks/usePothiTitle";
import useSignedOutPothiHint from "./hooks/useSignedOutPothiHint";

// The Folders tab.
//
// Styled as the bani list is: one flat ground, rows separated by an inset
// hairline, no cards. Switching tabs should feel like changing what the list
// holds, not moving to a different kind of screen.
//
// Two lanes, deliberately: the user's own pothis are draggable, Sundar Gutka's
// bundled folders are not. They are one list visually but two data sources
// (see `pothi/selectors`), and only the user's lane is handed to
// DraggableFlatList — dragging a bundled folder would imply an order that is
// not the user's to change and that nothing would persist.
const PothiList = ({ baniListData, onOpenPothi, onCreatePress, onPinLimit, active = true }) => {
  const { c, space, layout } = useTokens();
  // The same ground the bani list draws on, so the two tabs are one surface.
  const ground = useScreenPalette("baniList").surface;
  const dispatch = useDispatch();
  // Falls back to an empty set: the slice is absent in a partial store and for
  // the instant before rehydration completes.
  const pothis = useSelector((state) => state.pothis) ?? emptyPothis();
  // The app-wide themed scrollbar, not a standalone one.
  const { ownedScrollProps, Indicator } = useCustomScrollbar();
  const { titleFor, variantFor } = usePothiTitle();
  useSignedOutPothiHint(active);
  // The pothi the rename/delete sheet is for. Kept after the sheet closes, so it
  // slides away still showing that pothi — clearing it on close unmounted the
  // sheet at once and cut its slide off. `actionsOpen` is whether it is open.
  const [acting, setActing] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const openActions = useCallback((row) => {
    setActing(row);
    setActionsOpen(true);
  }, []);

  // Pull to refresh, for someone who has just changed a pothi on their other
  // phone and wants it here now. It fires the same request the Dashboard's
  // pull-down does, so one gesture runs the whole account sync — dashboard,
  // reminders and pothis. Only offered signed in: signed out there is no
  // account to pull from.
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");
  // The list's own scroll offset, as the one bit of it the pull needs.
  const [atTop, setAtTop] = useState(true);
  // Off for the whole of a reorder, so a row dragged downwards from the top of
  // the list cannot also read as a pull and start a sync when it is dropped.
  const [dragging, setDragging] = useState(false);
  const onRefresh = useCallback(() => requestPull("pull-to-refresh"), []);

  // The scrollbar owns this callback as well — it is the only way the list
  // reports its offset — so both readers are given every one.
  const trackScrollbar = useRef(null);
  trackScrollbar.current = ownedScrollProps.onScrollOffsetChange;
  const onScrollOffsetChange = useCallback((offset) => {
    trackScrollbar.current?.(offset);
    // React drops a set to the value already held, so this re-renders only on
    // the two frames where the list reaches, or leaves, the top.
    setAtTop(offset <= 0);
  }, []);

  // Named, so the list can be told to scroll simultaneously with the pull.
  const pullRef = useRef(null);

  const rows = useMemo(() => folderTabRows(pothis, baniListData), [pothis, baniListData]);
  const bundled = useMemo(() => rows.filter((row) => row.system), [rows]);
  // A PINNED pothi is anchored: it is not in the draggable list at all.
  //
  // Withholding its drag handle was not enough. It still sat inside
  // DraggableFlatList's data, so another row could be dragged over or past it
  // and the pinned block visibly moved — then snapped back on the next render,
  // because `listPothis` re-anchors pinned to the top and only unpinned ids are
  // saved. Keeping them in a separate, non-draggable block means the drag
  // cannot reach them and there is nothing to snap back.
  //
  // Morning and Evening Nitnem are anchored the same way, and always: they
  // have a fixed place at the top and can be neither pinned nor dragged.
  const morningId = defaultPothiId(pothis, "morning");
  const eveningId = defaultPothiId(pothis, "evening");
  const isDefault = useCallback(
    (row) => row.id === morningId || row.id === eveningId,
    [morningId, eveningId]
  );
  const defaults = useMemo(
    () => rows.filter((row) => !row.system && isDefault(row)),
    [rows, isDefault]
  );
  const custom = useMemo(
    () => rows.filter((row) => !row.system && !isDefault(row)),
    [rows, isDefault]
  );
  const pinned = useMemo(() => custom.filter((row) => row.pinned), [custom]);
  const mine = useMemo(() => custom.filter((row) => !row.pinned), [custom]);
  // A single draggable pothi has nowhere to go, so its grip would be a control
  // that does nothing. Offered only once there are two to swap.
  const canReorder = mine.length >= 2;
  // The pin count, read through a ref so the handler below does not depend on
  // the store.
  //
  // It did, and that made `renderItem` a NEW function after every reorder —
  // the store changes, so the callback changes, so the list re-renders every
  // cell at the exact moment the drag has ended and the cells are settling
  // back. Keeping the identity stable leaves that moment alone.
  const pinnedCountRef = useRef(pinned.length);
  pinnedCountRef.current = pinned.length;
  // Morning and Evening Nitnem can be neither renamed nor deleted, so their
  // actions sheet would open with nothing in it. `isDefault` closes over the two
  // id STRINGS rather than the slice, so `renderPothi` keeps its identity across
  // reorders for the same reason the pin count above is a ref.

  // A pothi's banis open on their own screen, in the ordinary All Banis list,
  // so a bani inside a pothi behaves exactly as it does anywhere else — the
  // same rows, the same press, the same reader. The title is resolved here
  // because only this side knows whether the name is a bundled folder's ASCII
  // or something the user typed; see usePothiTitle.
  const openPothi = useCallback(
    (row) => {
      trackPothiEvent("opened", { size: row.count, system: row.system });
      onOpenPothi({
        data: resolveBanis(row.baniIds, baniListData),
        title: titleFor(row),
        titleVariant: variantFor(row),
        // Only a user pothi is editable; a bundled folder sends none.
        pothiId: row.system ? null : row.id,
      });
    },
    [baniListData, onOpenPothi, titleFor, variantFor]
  );

  const togglePin = useCallback(
    (row) => {
      // The model refuses a fourth pin by returning the same state, so the
      // ceiling is checked here to say WHY nothing happened.
      if (!row.pinned && pinnedCountRef.current >= MAX_PINNED) {
        onPinLimit();
        return;
      }
      trackPothiEvent(row.pinned ? "unpinned" : "pinned", { pothi_size: row.count });
      dispatch(actions.togglePothiPin(row.id));
    },
    [dispatch, onPinLimit]
  );

  const renderPothi = useCallback(
    (row, { drag = null } = {}) => (
      <PothiRow
        pothi={row}
        onOpen={() => openPothi(row)}
        onTogglePin={row.system || isDefault(row) ? null : () => togglePin(row)}
        onLongPress={row.system || isDefault(row) ? null : () => openActions(row)}
        dragHandle={
          drag && !row.pinned && !isDefault(row) ? (
            <Pressable
              onLongPress={drag}
              delayLongPress={150}
              accessibilityRole="button"
              accessibilityLabel={STRINGS.POTHI_REORDER}
              hitSlop={layout.hitSlop}
            >
              <DragHandleIcon size={20} color={c.textSecondary} />
            </Pressable>
          ) : null
        }
      />
    ),
    [openPothi, openActions, togglePin, isDefault, layout, c]
  );

  // No standing notice above the list. The sign-in hint is a toast instead (see
  // useSignedOutPothiHint): a banner is read once and then becomes noise the
  // user scrolls past forever.
  const header = (
    // No paddingBottom: the New Pothi row carries a list row's own vertical
    // padding, so any here doubles the gap before the first pothi.
    <View style={{ paddingTop: space.md_12 }}>
      <NewPothiRow onPress={onCreatePress} />

      {/* The fixed block — the defaults, then the pinned — above the draggable
          list and outside it. Rendered with the same row and the same
          separators, so it reads as one list; it simply cannot be dragged. */}
      {[...defaults, ...pinned].map((row, index) => (
        <View key={row.id}>
          {index > 0 && <ListSeparator />}
          {renderPothi(row)}
        </View>
      ))}
      {defaults.length + pinned.length > 0 && mine.length > 0 && <ListSeparator />}
    </View>
  );

  /** A quiet section label — the only thing dividing the two lanes. */
  const sectionLabel = (text) => (
    <Text
      variant="label"
      color="textSecondary"
      style={{
        paddingHorizontal: layout.screenGutter,
        paddingTop: space.xl,
        // The row below brings its own `space.lg`; more than a hair here reads
        // as a gap between the heading and the section it labels.
        paddingBottom: space.xs,
      }}
    >
      {text}
    </Text>
  );

  const footer =
    bundled.length === 0 ? null : (
      <View>
        {sectionLabel(STRINGS.POTHI_DEFAULT_FOLDERS)}
        {bundled.map((row, index) => (
          <View key={row.id}>
            {index > 0 && <ListSeparator />}
            {renderPothi(row)}
          </View>
        ))}
      </View>
    );

  // No action button here: the header's "+ New Pothi" row is already visible
  // above this (ListHeaderComponent renders before ListEmptyComponent), so a
  // second create button here was the same action offered twice at once.
  const empty = (
    <View style={{ alignItems: "center", gap: space.md, paddingVertical: space.xxl }}>
      <Text variant="subheading" align="center">
        {STRINGS.POTHI_EMPTY_TITLE}
      </Text>
      <Text
        variant="bodySmall"
        color="textSecondary"
        align="center"
        style={{ paddingHorizontal: layout.screenGutter }}
      >
        {STRINGS.POTHI_EMPTY_BODY}
      </Text>
    </View>
  );

  return (
    // DraggableFlatList needs a gesture root with a real height. Without one the
    // list renders but neither scrolls nor drags — exactly how this behaved.
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: ground }}>
      <PullToRefresh
        atTop={atTop}
        enabled={signedIn && !dragging}
        gestureRef={pullRef}
        onRefresh={onRefresh}
        surface={ground}
      >
        <DraggableFlatList
          data={mine}
          keyExtractor={(row) => row.id}
          // `data` is the unpinned lane only, so the result needs no filtering:
          // a pinned pothi is never in this list to be moved in the first place.
          onDragBegin={() => setDragging(true)}
          onDragEnd={({ data }) => {
            setDragging(false);
            const next = data.map((row) => row.id);
            trackPothiEvent("reordered", { count: next.length });
            dispatch(actions.setPothiOrder(next));
          }}
          activationDistance={12}
          // The scroll view runs alongside the pull rather than cancelling it.
          // It costs the list nothing: the pull only ever claims a downward
          // drag at the very top, where there is nothing left to scroll to.
          simultaneousHandlers={pullRef}
          renderItem={({ item, drag }) => (
            <ScaleDecorator>{renderPothi(item, { drag: canReorder ? drag : null })}</ScaleDecorator>
          )}
          ItemSeparatorComponent={ListSeparator}
          ListHeaderComponent={header}
          // Measured against EVERY user pothi, not against this list's data.
          // Its data is the unpinned lane alone — a pinned pothi is lifted out
          // into the header so the drag cannot reach it — so pinning the last
          // one emptied the lane and the list announced "no pothis yet" over a
          // header still showing them.
          ListEmptyComponent={defaults.length || pinned.length ? null : empty}
          ListFooterComponent={footer}
          // No `style` prop: DraggableFlatList forwards it to an inner animated
          // wrapper, and a flex there fights the gesture root above, collapsing
          // the list to zero height — which rendered a blank page. The root
          // carries the flex, exactly as EditBaniOrder does.
          contentContainerStyle={{ paddingBottom: layout.screenPaddingBottom }}
          // The app's own themed scrollbar, the same one the bani list and
          // Settings draw. DraggableFlatList keeps its own `onScroll`, so this is
          // the offset-reporting form of the shared hook — see useCustomScrollbar.
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...ownedScrollProps}
          onScrollOffsetChange={onScrollOffsetChange}
        />
      </PullToRefresh>
      {Indicator}
      {/* Adding banis is NOT offered here. A pothi's contents are edited from
          its own screen's overflow, where the list you are changing is in front
          of you — see FolderScreen. */}
      <PothiActionsSheet
        pothi={acting}
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
      />
    </GestureHandlerRootView>
  );
};

PothiList.propTypes = {
  /** Rows from `useBaniList()` — the source for both bundled folders and id lookup. */
  baniListData: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  /** Opens a pothi's banis on their own screen. */
  onOpenPothi: PropTypes.func.isRequired,
  onCreatePress: PropTypes.func.isRequired,
  /** Called instead of pinning when the user is already at the ceiling. */
  onPinLimit: PropTypes.func.isRequired,
  /** False while this list is mounted beside the bani list but not on screen. */
  active: PropTypes.bool,
};

export default PothiList;
