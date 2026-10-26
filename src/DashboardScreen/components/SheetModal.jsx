import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Reanimated from "react-native-reanimated";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import PropTypes from "prop-types";
import Overlay from "@common/components/ui/Overlay";
import { SheetGestureRoot, SheetHandle, useSheetMotion } from "@common/components/ui/sheetDrag";
import useDashboardTheme from "./dashboardTheme";

export const getSheetTop = (heightRatio) =>
  heightRatio == null ? undefined : `${(1 - heightRatio) * 100}%`;

const styles = StyleSheet.create({
  root: {
    // Filled absolutely rather than `flex: 1` or a measured height — the sheet
    // below is anchored to this root's `bottom: 0`, so the root has to be
    // exactly the Modal's own window. See the note in `ui/Sheet`: pinning it to
    // `useWindowDimensions().height` overflows that window by the status bar
    // height once Android enforces edge-to-edge, which pushes the sheet's lower
    // rows off the bottom of the screen.
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
  },
  // Where the sheet sits, and what opens, drags and closes. See sheetDrag.
  frame: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // The grab bar brings its own space above and below it.
    paddingTop: 4,
    overflow: "hidden",
  },
  // Fills a frame pinned by `heightRatio`; left to its content otherwise.
  fill: { flex: 1 },
});

/**
 * Body of the sheet. Split out so it renders INSIDE the SafeAreaProvider below
 * and can therefore read real insets — see the note on that provider.
 */
const SheetBody = ({ onClose, heightRatio = null, motion, children = null }) => {
  const { screenBg, c } = useDashboardTheme();
  const { bottom } = useSafeAreaInsets();

  // Opposing `top` and `bottom` edges form a hard layout constraint, so long
  // child content can only scroll instead of expanding the sheet.
  const sheetTop = getSheetTop(heightRatio);

  return (
    <View style={styles.root}>
      {/* The same plain scrim the Settings sheets use, at full strength from the
          first frame. This was a native blur faded in over 100ms, which made the
          Dashboard's sheets read as a different component to the rest of the app
          — and rendered differently on iOS and Android, since the two platforms
          do not blur alike. */}
      <Reanimated.View
        pointerEvents="none"
        style={[styles.dim, { backgroundColor: c.scrim }, motion.scrimStyle]}
      />
      <Pressable style={styles.dim} onPress={onClose} />
      <GestureDetector gesture={motion.gesture}>
        <Reanimated.View
          style={[styles.frame, { top: sheetTop }, motion.panelStyle]}
          onLayout={motion.onPanelLayout}
        >
          <View
            style={[
              styles.sheet,
              sheetTop === undefined ? null : styles.fill,
              { backgroundColor: screenBg, paddingBottom: bottom },
            ]}
          >
            <SheetHandle onClose={onClose} onLayout={motion.onGrabZoneLayout} />
            {children}
          </View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

SheetBody.propTypes = {
  onClose: PropTypes.func.isRequired,
  heightRatio: PropTypes.number,
  /** From `useSheetMotion`, owned by `SheetModal` — it decides when to unmount. */
  motion: PropTypes.shape({
    gesture: PropTypes.shape({}).isRequired,
    panelStyle: PropTypes.shape({}).isRequired,
    scrimStyle: PropTypes.shape({}).isRequired,
    onPanelLayout: PropTypes.func.isRequired,
    onGrabZoneLayout: PropTypes.func.isRequired,
  }).isRequired,
  children: PropTypes.node,
};

/**
 * The dashboard's one way of covering the screen: an instant scrim with a
 * rounded sheet sliding up from the bottom, carrying the grab bar that pulls it
 * down to close — the same one every sheet in the app has.
 *
 * Extracted so every dashboard overlay presents identically — the month/year
 * picker already looked like this while the layout and bani editors were plain
 * full-screen modals, which is what made them feel like a different app.
 *
 * Opening, dragging and closing come from `useSheetMotion`, shared with the
 * Settings `Sheet`, so the Dashboard's sheets and the rest of the app's move
 * the same way rather than merely looking similar.
 *
 * A caller can pin the sheet below a percentage-based top edge. This supplies a
 * definite height to the content tree, so long lists scroll within the sheet.
 */
const SheetModal = ({ visible, onClose, heightRatio = null, children = null }) => {
  // Dragged from the grab bar alone. These sheets hold lists the user reorders
  // by dragging, so a pull that starts inside the body is theirs, never a close.
  const motion = useSheetMotion({ visible, onClose });

  if (!motion.mounted) return null;

  return (
    // The slide up starts on `onShow` — see sheetDrag.
    <Overlay animationType="none" onRequestClose={onClose} onShow={motion.onShow}>
      {/* Modal content needs its own provider so the sheet can pad above the
          bottom system inset. */}
      {/* A Modal is its own window on Android, outside the app's gesture root.
          See sheetDrag. */}
      <SheetGestureRoot>
        <SafeAreaProvider>
          <SheetBody onClose={onClose} heightRatio={heightRatio} motion={motion}>
            {children}
          </SheetBody>
        </SafeAreaProvider>
      </SheetGestureRoot>
    </Overlay>
  );
};

SheetModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  heightRatio: PropTypes.number,
  children: PropTypes.node,
};

export default SheetModal;
