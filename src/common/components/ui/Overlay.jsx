import React from "react";
import { Modal, Platform } from "react-native";
import PropTypes from "prop-types";

/**
 * Whether an overlay opened FROM a sheet has to be a CHILD of that sheet.
 *
 * iOS: yes. A Modal is a UIViewController, presented by whichever controller
 * React resolves for its host view. A sibling resolves to the root, which is
 * already presenting the sheet, and UIKit refuses to present twice from one
 * controller — the picker, the label prompt and the confirm never appeared and
 * the screen sat frozen.
 *
 * Android: no, and it must not. Every Modal is a Dialog with its own React
 * root, so nesting means closing the sheet tears the inner roots down while
 * their commits are still in flight; the shadow tree then fails with
 * "Trying to add unknown view tag", which kills the app. Android stacks
 * sibling Dialogs happily and always did — the nesting was added for the iOS
 * fix alone, and this is what keeps it there.
 */
export const NEST_OVERLAYS_IN_SHEET = Platform.OS === "ios";

// The ONE place the app configures a modal window.
//
// Every overlay — sheets, dialogs, the day detail, the label prompt — renders
// through this. A lint rule forbids `<Modal>` anywhere else, because the window
// configuration is not a per-screen decision and getting it wrong is invisible
// until it is on a device:
//
// **Both translucency flags, always.** Under Android's edge-to-edge enforcement
// a Modal only spans the whole display when `statusBarTranslucent` AND
// `navigationBarTranslucent` are set. With the status-bar flag alone the window
// stops above the navigation bar and the scrim leaves an undimmed strip; worse,
// the window is inset while `useWindowDimensions` still reports the full
// display, so anything measured against the screen overflows its own window.
// Six of the app's eight modals were missing the navigation flag.
//
// **`onShow` and `onDismiss` are forwarded.** `onShow` so an entrance animation
// can start when the window actually exists. A Modal is a separate native window and its children are not
// attached during the commit that renders it, so a native-driven animation
// started in an effect targets a view that is not there yet and is silently
// dropped — the sheet then never leaves its off-screen start position and all
// the user sees is the scrim.
//
// `transparent` is not a prop: an overlay that is not transparent cannot show a
// scrim, and every overlay in this app has one.
const Overlay = ({
  visible = true,
  onRequestClose = undefined,
  onShow = undefined,
  onDismiss = undefined,
  animationType = "none",
  children = null,
  testID = undefined,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType={animationType}
    onRequestClose={onRequestClose}
    onShow={onShow}
    onDismiss={onDismiss}
    statusBarTranslucent
    navigationBarTranslucent
    testID={testID}
  >
    {children}
  </Modal>
);

Overlay.propTypes = {
  visible: PropTypes.bool,
  /** Android back / system dismiss. */
  onRequestClose: PropTypes.func,
  /** Fires once the window is on screen — start entrance animations here. */
  onShow: PropTypes.func,
  /**
   * Fires once the window is GONE. iOS only — React Native routes it from the
   * dismissal completion (Modal.js, `modalDismissed`) and never calls it on
   * Android, where it is not needed: a Dialog is not a presenting controller
   * and nothing has to wait for it.
   *
   * On iOS something does. A Modal is presented BY a UIViewController, and one
   * controller cannot present two things at once — so anything a closing sheet
   * opens on its way out (another sheet, a confirm) has to be held until this
   * fires, or it is refused and the screen looks frozen.
   */
  onDismiss: PropTypes.func,
  /** "none" when the content drives its own animation, "fade" otherwise. */
  animationType: PropTypes.oneOf(["none", "fade", "slide"]),
  children: PropTypes.node,
  testID: PropTypes.string,
};

export default Overlay;
