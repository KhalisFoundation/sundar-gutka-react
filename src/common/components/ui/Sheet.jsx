import React, { useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "@react-native-community/blur";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import useKeyboardHeight from "../../hooks/useKeyboardHeight";
import useTokens from "../../hooks/useTokens";
import { useCustomScrollbar } from "../ScrollIndicator";
import Overlay from "./Overlay";
import { SheetGestureRoot, SheetHandle, useSheetMotion } from "./sheetDrag";
import SheetKeyboardSpace from "./sheetKeyboardSpace";
import Text from "./Text";

// One bottom sheet. Replaces six near-identical implementations:
// `DayDetailModal`, `EditBanisModal`, `MonthYearPickerModal`, `SheetModal`,
// `AudioSettingsModal`, `bottomSheetComponent` and `LabelModal`.
//
// Height is content-driven and capped at a ratio of the screen rather than set
// to a number, so the sheet is as short as its content allows and never taller
// than it should be. Past the cap the body scrolls — which is what keeps a
// sheet usable when a translated list runs long or the user has raised their
// font size, the case where a fixed height silently clips the last option.

const SheetContent = ({
  visible,
  onClose,
  onDismiss = undefined,
  title = undefined,
  children = null,
  closeAccessibilityLabel = undefined,
  scrollable = true,
  testID = undefined,
  variant = "floating",
  actions = null,
  header = null,
  footer = null,
  keyboard = null,
}) => {
  // Two presentations, both driven entirely by tokens.
  //
  //   floating — the app's sheet: it slides up over an instant scrim, and has
  //              inset content. Everything but Settings.
  //   flush    — the Settings chooser: it slides up over a dark BLUR of the
  //              screen behind, the title is centred over a rule, and the rows
  //              run edge to edge.
  //
  // Both slide up to open and back down to close, however they are closed,
  // carry the grab bar, and close when dragged down — see sheetDrag.
  //
  // Kept as a NAMED variant rather than a pile of props at the call site, so
  // the difference is one decision in one place.
  const flush = variant === "flush";
  const { c, space, layout, radii } = useTokens();
  // Colours come from the roles, which the provider has already scoped to
  // this sheet's own palette when it is flush — so nothing here is a literal.
  const sheetC = {
    surface: c.surfaceElevated,
    scrim: c.scrim,
    divider: c.border,
  };
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Opening, closing and dragging down to close — one motion, see sheetDrag.
  // Only a SCROLLING body may start a drag: a fixed one can hold a control that
  // moves vertically itself (the time picker's wheels).
  const motion = useSheetMotion({ visible, onClose, bodyScrolls: scrollable });
  // Whether the iOS window is up — from `onShow` until `onDismiss`. See the
  // unmount below.
  const [presented, setPresented] = useState(false);
  const handleShow = () => {
    if (Platform.OS === "ios") setPresented(true);
    motion.onShow();
  };
  const handleDismiss = () => {
    setPresented(false);
    if (onDismiss) onDismiss();
  };
  // A Modal's window ignores the Activity's `adjustResize` on Android, so the
  // sheet has to get itself out of the keyboard's way. See the hook.
  const keyboardHeight = useKeyboardHeight();
  // The space actually left for the sheet once the keyboard is up. Both the
  // lift AND the cap use it, so a tall sheet scrolls inside what remains
  // instead of growing off the top of the screen.
  const availableHeight = height - keyboardHeight;
  const maxHeight = availableHeight * layout.sheet.maxHeightRatio;
  // The bottom safe-area inset: the home indicator on iOS, the navigation bar
  // on Android. Whether it still applies with the keyboard up differs:
  //
  //   iOS      the reported keyboard height covers the home indicator, so the
  //            inset is dropped — keeping it would leave a dead band above the
  //            keys.
  //   Android  React Native reports the keyboard height LESS the system bars
  //            (ReactRootView.checkForKeyboardEvents: ime.bottom -
  //            systemBars.bottom), while this window is drawn under the
  //            navigation bar (Overlay: navigationBarTranslucent). Dropping the
  //            inset there sank the sheet by the bar's height, and Cancel and
  //            Save sat behind the keyboard. So it stays.
  const coveredByKeyboard = keyboardHeight > 0 && Platform.OS === "ios";
  const paddingBottom = layout.sheet.paddingBottom + (coveredByKeyboard ? 0 : insets.bottom);

  // ── Room for a pinned `keyboard` ──────────────────────────────────────────
  // Everything but the body is fixed height, so on a small display, or at a
  // large display or text size, the title, the field, the buttons and a
  // keyboard sized to the WINDOW added up to more than the sheet can be. The
  // body shrank to nothing — the list vanished — and the rest ran out of the
  // sheet's bottom, putting the keyboard's last row behind the navigation bar.
  //
  // So the keyboard is sized to what is actually left: the parts above it are
  // measured, and it gets the max height less those and a list's worth of room
  // for the body. The body's share is the most its content has ever needed, up
  // to `listMinHeight` — a sheet with no list keeps no empty band for one, and
  // a search that narrows to one result does not resize the keys mid-word.
  const [parts, setParts] = useState({});
  const [bodyRoom, setBodyRoom] = useState(0);
  const measure = (part) => (event) => {
    const { height: partHeight } = event.nativeEvent.layout;
    setParts((known) => (known[part] === partHeight ? known : { ...known, [part]: partHeight }));
  };
  const keepBodyRoom = (contentHeight) =>
    setBodyRoom((room) => Math.max(room, Math.min(layout.sheet.listMinHeight, contentHeight)));

  // The app's one scrollbar, the same one every list screen draws. A sheet's
  // body is where its content scrolls — the pothi pickers have no scroller of
  // their own — so without this every sheet showed the plain native bar while
  // the screens behind it followed the theme.
  const { scrollViewProps, Indicator } = useCustomScrollbar(null, {
    onOffset: motion.onBodyScroll,
  });
  // Whether the hook draws its own thumb here: always on iOS, and on Android
  // under a designed theme. Everywhere else it hands back nothing and the
  // native bar stays, so the body is left exactly as it was.
  const drawsThumb = scrollable && Boolean(scrollViewProps.onScroll);
  // Animated, because the thumb follows a native-driven scroll event.
  const Body = scrollable ? Animated.ScrollView : View;
  // Flush rows carry their own dividers and butt up against each other, so the
  // body neither gaps them nor pads the last one away from the edge.
  const bodyGap = flush ? 0 : space.sm;
  // `flexShrink: 1` is what lets a pinned `footer` win the space it needs: the
  // sheet is capped at a ratio of the window, so without it the body keeps its
  // full content height and pushes the footer straight off the bottom of the
  // screen. That is exactly what put the Punjabi keyboard half off-display once
  // a bani list opened above it.
  // …but `flexShrink: 1` with nothing to stop it shrinks the body to ZERO when
  // the footer is tall enough, which is the other half of the same problem: the
  // Punjabi keyboard is seven rows, and at a raised OS text size it claimed the
  // whole sheet, leaving the title above a clipped field and no buttons at all.
  // A floor keeps the body on screen and scrolling; the keyboard caps its own
  // height so the two meet in the middle rather than fighting.
  //
  // Not with a `header`, though. There the controls are all fixed — the header
  // above, the footer below — and the body is only what they frame, a list.
  // Holding a floor under it would push the footer's buttons or keys past the
  // bottom of a short screen; letting the list give way keeps every control
  // reachable, and the list comes back as soon as the keys close.
  const bodyFloor = footer && !header ? layout.sheet.listMinHeight : undefined;
  const bodyProps = scrollable
    ? {
        contentContainerStyle: { gap: bodyGap, paddingBottom: bodyGap },
        bounces: false,
        // A row inside a sheet that has a keyboard up must take the tap on the
        // FIRST press. The default swallows it to dismiss the keyboard, so
        // ticking a bani while searching took two taps and looked broken.
        keyboardShouldPersistTaps: "handled",
        // The drag needs the offset to know the list is at its top. Where the
        // scrollbar hook draws its own thumb it passes the offset on from its
        // own scroll event; where it leaves the native bar alone, the body
        // reports it here.
        ...(drawsThumb
          ? {}
          : {
              onScroll: (event) => motion.onBodyScroll(event.nativeEvent.contentOffset.y),
              scrollEventThrottle: 16,
            }),
        ...scrollViewProps,
        onContentSizeChange: (width, contentHeight) => {
          scrollViewProps.onContentSizeChange?.(width, contentHeight);
          keepBodyRoom(contentHeight);
        },
        // Inside the wrapper below, which carries the shrink and the floor.
        style: { flexShrink: 1 },
      }
    : { style: { gap: bodyGap, flexShrink: 1 } };

  const titleMargin = flush ? 0 : space.sm;
  const keyboardSpace =
    maxHeight -
    (flush ? 0 : layout.sheet.paddingTop) -
    paddingBottom -
    (parts.handle ?? 0) -
    (title ? (parts.title ?? 0) + titleMargin : 0) -
    (header ? (parts.header ?? 0) + bodyGap : 0) -
    (footer ? parts.footer ?? 0 : 0) -
    bodyRoom;

  // Unmount only once the closing slide has finished — and, on iOS, only once
  // the window has actually gone. There `onDismiss` reaches JS through a
  // listener the Modal removes as it unmounts, while the native dismissal (and
  // its event) lands after that. Dropped straight from the tree, the sheet's
  // `onDismiss` never fired, so a follow-up hung on it — the delete pothi
  // confirm, the folder screen's menu actions — silently never ran. So the
  // Modal is kept, hidden through `visible`, until it reports itself gone.
  const holdForDismiss = Platform.OS === "ios" && presented;
  if (!motion.mounted && !holdForDismiss) return null;

  return (
    // `animationType="none"` because the slide is driven below — the Modal's
    // own "slide" moves the WHOLE modal, scrim included, so the black overlay
    // wiped up the screen with the sheet instead of being there on tap. `onShow`
    // is when the sheet's native view exists to animate.
    <Overlay
      visible={motion.mounted}
      animationType="none"
      onRequestClose={onClose}
      onShow={handleShow}
      // iOS only, and the only reliable "this window is gone" signal there —
      // see Overlay. A caller that has to open something else once this sheet
      // is out of the way hangs its follow-up here.
      onDismiss={handleDismiss}
      testID={testID}
    >
      {/* Android gives a Modal its own window, outside the app's gesture root,
          so the drag needs a root of its own. See sheetDrag. */}
      <SheetGestureRoot>
        {/* Tapping the scrim dismisses. Marked as a button so a screen reader
          user has the same escape a sighted user does. The scrim is drawn at
          full strength immediately — it is the feedback that the tap landed,
          so delaying it behind an animation only makes the app feel slower. */}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeAccessibilityLabel}
          // Absolutely filled, NOT `flex: 1` and NOT a measured height.
          //
          // `flex: 1` alone is wrong on the first layout pass: a Modal is a
          // freshly-created window, so there is nothing to fill yet, the container
          // measures 0 and `flex-end` puts the sheet at y=0 for a frame.
          //
          // Pinning `minHeight` to the window height was worse. `statusBarTranslucent`
          // is a no-op from API 35, where Android enforces edge-to-edge, so the
          // Modal's window is inset by the status bar while `useWindowDimensions`
          // still reports the FULL display. The container then overflowed its own
          // window by exactly the status bar height and `flex-end` pushed the sheet
          // that far below the screen, where its lower rows were unreachable.
          //
          // Filling absolutely takes the size from the window itself, so it is
          // correct on the first frame without having to agree with a measurement.
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: "flex-end",
            // Lifts the sheet clear of the keyboard. Padding rather than a
            // transform so the sheet's own max height is measured against what is
            // left, not against the full screen.
            paddingBottom: keyboardHeight,
          }}
        >
          {/* The flush sheet dims the screen with a real blur, as it always did.
            A plain View child does not consume touches, so a tap still reaches
            the Pressable above and dismisses. The fallback colour is what
            Android/iOS use when the OS "reduce transparency" setting is on. */}
          {/* The dimming, on a layer of its own so it can thin as the sheet is
            dragged away without fading the sheet with it. Flush dims through
            the blur instead, so a flat scrim over it would just mute the blur. */}
          <Reanimated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, motion.scrimStyle]}
          >
            {flush ? (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                reducedTransparencyFallbackColor={sheetC.scrim}
                enabled
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: sheetC.scrim }]} />
            )}
          </Reanimated.View>
          {/* Carries every move: opening, the drag, and closing. Pressable is not
            an animated component, so it lives on this wrapper. See sheetDrag. */}
          <GestureDetector gesture={motion.gesture}>
            <Reanimated.View style={motion.panelStyle} onLayout={motion.onPanelLayout}>
              {/* Swallows taps so a press inside the sheet does not close it. */}
              <Pressable
                onPress={() => {}}
                accessibilityViewIsModal
                style={{
                  backgroundColor: sheetC.surface,
                  borderTopLeftRadius: radii.xl,
                  borderTopRightRadius: radii.xl,
                  paddingHorizontal: flush ? 0 : layout.sheet.paddingHorizontal,
                  paddingTop: flush ? 0 : layout.sheet.paddingTop,
                  paddingBottom,
                  maxHeight,
                }}
              >
                {/* The grab bar: pull the sheet down to close it. */}
                <SheetHandle
                  onClose={onClose}
                  accessibilityLabel={closeAccessibilityLabel}
                  onLayout={measure("handle")}
                />
                {title ? (
                  // The title shares its row with any `actions`, the same three-column
                  // arrangement ScreenHeader uses. The actions are fixed-size tap
                  // targets that do not shrink, and the title takes everything they
                  // leave and WRAPS into it — so a long pothi name grows the row
                  // rather than running under an icon or pushing one off the edge.
                  <View
                    onLayout={measure("title")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space.sm,
                      marginBottom: titleMargin,
                    }}
                  >
                    <Text
                      // Flush titles sit at body size, centred — the same treatment
                      // the old sheet's title carried.
                      variant={flush ? "body" : "subheading"}
                      color="textPrimary"
                      style={[
                        { flexShrink: 1, flexGrow: 1 },
                        flush && {
                          textAlign: "center",
                          // Padding rather than a height, so a translated title
                          // that wraps to two lines grows the block instead of
                          // being clipped by it.
                          padding: layout.sheet.titlePadding,
                        },
                      ]}
                    >
                      {title}
                    </Text>
                    {actions}
                  </View>
                ) : null}

                {/* The rule under a flush title. StyleSheet.hairlineWidth rounds to
              zero on some non-integer densities, so this is a solid 1dp. */}
                {flush && title ? (
                  <View style={{ height: 1, backgroundColor: sheetC.divider }} />
                ) : null}

                {/* Fixed between the title and the body: what the body serves and
              must never scroll away from it, like the search over a list. */}
                {header ? (
                  <View onLayout={measure("header")} style={{ marginBottom: bodyGap }}>
                    {header}
                  </View>
                ) : null}

                {/* Body is a ScrollView or a plain View depending on `scrollable`,
              so its props differ by type. Its wrapper carries the shrink and
              the floor, gives the thumb a parent the size of what scrolls,
              and reports the body's frame to the drag — everything above it
              is the grab zone. */}
                <View
                  style={{ flexShrink: 1, minHeight: bodyFloor }}
                  onLayout={motion.onBodyLayout}
                >
                  {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                  <Body {...bodyProps}>{children}</Body>
                  {drawsThumb ? Indicator : null}
                </View>

                {/* Pinned: OUTSIDE the body, so it never scrolls away and never
              gets pushed past the bottom edge. This is the standard bottom
              sheet footer arrangement (gorhom's BottomSheetFooter does the
              same) and it is what an on-screen keyboard needs — the keys stay
              put at the bottom while the content above them scrolls. */}
                {footer ? <View onLayout={measure("footer")}>{footer}</View> : null}

                {/* Pinned under the footer, and sized to the room the sheet has
              left — see "Room for a pinned keyboard" above. */}
                {keyboard ? (
                  <SheetKeyboardSpace.Provider value={keyboardSpace}>
                    {keyboard}
                  </SheetKeyboardSpace.Provider>
                ) : null}
              </Pressable>
            </Reanimated.View>
          </GestureDetector>
        </Pressable>
      </SheetGestureRoot>
    </Overlay>
  );
};

const sheetPropTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /**
   * Fires once the sheet's window is actually GONE — iOS only, see Overlay.
   * Hang anything that must not race the closing sheet here: on iOS a Modal is
   * presented by a controller that can only present one thing at a time, so a
   * row that closes this sheet and opens another in the same breath opens
   * nothing at all.
   */
  onDismiss: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  /** Localised label for the dismiss affordance. */
  closeAccessibilityLabel: PropTypes.string,
  /** Set false when the content manages its own scrolling (e.g. a FlatList). */
  scrollable: PropTypes.bool,
  /**
   * Controls for the title's row, at its trailing edge. A sheet whose actions
   * live here rather than under its body keeps them reachable with a keyboard
   * up and without scrolling a long list to the end.
   */
  actions: PropTypes.node,
  /**
   * Fixed between the title and the scrolling body — a search field over the
   * list it filters. With one, the body gives way to the footer on a short
   * screen rather than holding a floor that would push the footer off it.
   */
  header: PropTypes.node,
  /** Pinned below the scrolling body — an on-screen keyboard, a sticky action. */
  footer: PropTypes.node,
  /**
   * An on-screen keyboard, pinned under the footer. Its keys are sized to the
   * room the rest of the sheet leaves, so it can never push the list to nothing
   * or its own last row off the bottom of the sheet.
   */
  keyboard: PropTypes.node,
  testID: PropTypes.string,
  /** "floating" everywhere; "flush" only for the Settings chooser. */
  variant: PropTypes.oneOf(["floating", "flush"]),
};

SheetContent.propTypes = sheetPropTypes;

// The scope has to sit OUTSIDE the component that reads the tokens: a provider
// only affects what renders beneath it, so wrapping the returned element would
// colour the rows and leave the panel, the rule and the blur fallback resolving
// against the semantic layer.
//
// Inside it, the `Row`s, the title and the checkmark all resolve the SAME role
// names to the Settings palette's values — so none of them takes a colour prop,
// and none of these colours can reach another sheet.
const Sheet = ({ variant = "floating", ...rest }) => {
  // eslint-disable-next-line react/jsx-props-no-spreading
  const content = <SheetContent variant={variant} {...rest} />;
  return variant === "flush" ? (
    <ScreenRolesProvider screen="settingsSheet">{content}</ScreenRolesProvider>
  ) : (
    content
  );
};

Sheet.propTypes = sheetPropTypes;

export default Sheet;
