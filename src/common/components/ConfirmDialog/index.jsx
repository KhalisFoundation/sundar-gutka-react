import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useReaderScopedTheme } from "@theme/reader";
import Overlay from "@common/components/ui/Overlay";
import constant from "@common/constant";
import { useReaderFocused } from "@common/readerFocus";
import CustomText from "../CustomText";

/**
 * App-themed replacement for the native `Alert.alert` confirmation dialog.
 *
 * Native Android alerts follow the *native* app theme (which is light), so they
 * render light even when the app's in-JS dark mode is on. This host renders a
 * themed Modal instead, driven by an imperative `showConfirm(...)` call — a 1:1
 * stand-in for Alert.alert for confirm/destructive flows.
 *
 * Usage:
 *   showConfirm({ title, message, confirmText, cancelText, destructive, onConfirm, onCancel });
 *
 * `onCancel` is optional and runs however the dialog is backed out of: its
 * cancel button, a tap on the backdrop or the Android back button.
 *
 * Mount <ConfirmDialogHost /> exactly once near the app root (inside ThemeProvider).
 */

// Mounted hosts, outermost first. Normally there is exactly one, at the app
// root — but a host inside a Modal has to be able to take over while that Modal
// is up, and that is not a nicety on iOS, it is the only way the dialog can
// appear at all.
//
// A React Native Modal is a UIViewController there, presented by whichever
// controller React resolves for the view hosting it:
//
//   [[modalHostView reactViewController] presentViewController:...]
//                                     (RCTModalHostViewManager.m)
//
// The root host resolves to the ROOT controller. Ask it to confirm something
// while a sheet is open and UIKit refuses — that controller is already
// presenting the sheet — so the tap does nothing and the screen reads as
// frozen. Android stacks Dialogs and never shows it.
//
// A host rendered INSIDE the sheet resolves to the sheet's own controller, so
// the sheet presents the dialog and it appears over itself, which is what it
// looks like on Android. Hosts register in mount order, so the innermost one is
// last and wins; when the sheet closes it deregisters and the root host takes
// over again. Nothing else changes: `showConfirm` is called the same way from
// everywhere and callers never learn which host answered.
const hostListeners = [];

export const showConfirm = (options) => {
  const innermost = hostListeners[hostListeners.length - 1];
  if (innermost) innermost(options);
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // Colour applied at the call site from `c.scrim`.
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 8,
    elevation: 8,
    // Shadow colour applied at the call site from `c.shadow`.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  // Explicit SemiBold face and NO numeric fontWeight beside it. Baloo ships as
  // separate named TTFs, so a fontWeight makes Android try to synthesize bold
  // and silently drop back to the SYSTEM font — which is why these headings
  // rendered in a different typeface to the rest of the app.
  title: {
    fontFamily: constant.BALOO_PAAJI_SEMI_BOLD,
    fontSize: 18,
    marginBottom: 8,
  },
  // No lineHeight, matching `title` above and the type scale. 21 at 15pt was
  // under Baloo's own 1.771em box (26.6), which squeezes the line and shifts the
  // glyphs off-centre in hi/pa — see the note in `theme/type.js`. This message
  // wraps to several lines, so it was the most visible instance left.
  message: {
    fontSize: 15,
    opacity: 0.85,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    // Wrap is the guaranteed no-clip fallback if measurement ever misses: a
    // button that can't fit moves to the next line instead of off the card.
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
    columnGap: 8,
    rowGap: 4,
  },
  // When the buttons don't fit on one row, stack them full-width with their
  // labels right-aligned (standard Material adaptive-dialog behaviour). Each
  // button gets the full card width, so a long label can never be clipped.
  actionsStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnStacked: {
    width: "100%",
    paddingHorizontal: 0,
    alignItems: "flex-end",
  },
  btnText: {
    fontFamily: constant.BALOO_PAAJI_SEMI_BOLD,
    fontSize: 15,
  },
});

const ConfirmDialogHost = () => {
  // Raised from the audio player ("Remove downloaded audio?") as often as from
  // anywhere else, and then it appears ON the reading page — so over the Reader
  // it wears the reading theme's surface instead of the app's. Off the Reader
  // this resolves to the app theme untouched.
  const { theme } = useReaderScopedTheme("audio", useReaderFocused());
  // Each request carries its own id, and the window below is keyed by it.
  //
  // A dialog can be taken off screen without this host ever hearing: Android 16
  // dispatches no back key to a Modal, so `onRequestClose` does not fire and the
  // options stay set while the window is gone. The next `showConfirm` then only
  // swaps the options of a Modal React still believes is showing, and nothing
  // appears — the control that raised it reads as dead. A new id remounts the
  // window, so every request gets a dialog whatever became of the last one.
  const [request, setRequest] = useState(null);
  const nextId = useRef(0);
  const setOptions = useCallback((next) => {
    nextId.current += 1;
    setRequest(next ? { id: nextId.current, options: next } : null);
  }, []);
  const options = request?.options ?? null;

  // A LAYOUT effect, so a host inside a sheet is gone from the stack within the
  // very commit that unmounts it. A passive cleanup runs after that commit —
  // too late for a confirm raised from the sheet's iOS `onDismiss`, which fires
  // inside it: the dead host was still innermost, took the request, and nothing
  // appeared. That was long-press → Delete on the Folders tab.
  useLayoutEffect(() => {
    // `setOptions` is stable, so it is its own registration token.
    hostListeners.push(setOptions);
    return () => {
      const at = hostListeners.indexOf(setOptions);
      if (at !== -1) hostListeners.splice(at, 1);
    };
  }, []);

  const close = useCallback(() => setOptions(null), []);

  // Lay the action buttons in a row when they fit; switch to a full-width
  // vertical stack when they don't. The decision is driven by the *measured*
  // widths of the actual rendered buttons vs. the available row width, so it
  // adapts to any system font scale, locale (German/Punjabi labels run long),
  // or screen size — instead of a hardcoded row that clips "Cancel" off the
  // card on narrow/large-font devices.
  const [stacked, setStacked] = useState(false);
  const rowWidthRef = useRef(0);
  const btnWidthsRef = useRef({});

  // Re-measure from scratch whenever a new dialog opens (its buttons differ).
  useEffect(() => {
    setStacked(false);
    rowWidthRef.current = 0;
    btnWidthsRef.current = {};
  }, [options]);

  const ACTION_GAP = 8;
  const evaluateLayout = useCallback(() => {
    if (stacked) return;
    const widths = Object.values(btnWidthsRef.current);
    if (!rowWidthRef.current || widths.length === 0) return;
    const total = widths.reduce((sum, w) => sum + w, 0) + ACTION_GAP * (widths.length - 1);
    // 1px slack avoids a spurious stack from sub-pixel rounding.
    if (total > rowWidthRef.current + 1) setStacked(true);
  }, [stacked]);

  const onRowLayout = useCallback(
    (e) => {
      rowWidthRef.current = e.nativeEvent.layout.width;
      evaluateLayout();
    },
    [evaluateLayout]
  );

  const onBtnLayout = useCallback(
    (key) => (e) => {
      // In row mode each button reports its natural (content) width.
      if (!stacked) {
        btnWidthsRef.current[key] = e.nativeEvent.layout.width;
        evaluateLayout();
      }
    },
    [stacked, evaluateLayout]
  );

  if (!options) return null;

  const {
    title,
    message,
    confirmText = "OK",
    cancelText,
    neutralText,
    destructive = false,
    onConfirm,
    onNeutral,
    onCancel,
  } = options;
  // Every way out that is not a choice is a cancel.
  const cancel = () => {
    close();
    onCancel?.();
  };
  const surface = theme.c.surfaceElevated;
  const textColor = theme.c.textPrimary;
  // `accent`, not `primary`: primary is the fixed brand navy in BOTH themes, so
  // the confirm label was drawing deep navy on a dark card while the cancel
  // button beside it used the theme-aware `textBrand`. One pairing for both.
  const confirmColor = destructive ? theme.c.error : theme.c.accent;

  return (
    <Overlay key={request.id} animationType="fade" onRequestClose={cancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.c.scrim }]} onPress={cancel}>
        {/* Inner Pressable swallows taps so they don't dismiss via the backdrop. */}
        <Pressable
          style={[styles.card, { backgroundColor: surface, shadowColor: theme.c.shadow }]}
          onPress={() => {}}
        >
          {!!title && <CustomText style={[styles.title, { color: textColor }]}>{title}</CustomText>}
          {!!message && (
            <CustomText style={[styles.message, { color: textColor }]}>{message}</CustomText>
          )}
          <View style={[styles.actions, stacked && styles.actionsStacked]} onLayout={onRowLayout}>
            {!!cancelText && (
              <Pressable
                style={[styles.btn, stacked && styles.btnStacked]}
                onPress={cancel}
                hitSlop={8}
                onLayout={onBtnLayout("cancel")}
              >
                <CustomText style={[styles.btnText, { color: theme.c.textBrand }]}>
                  {cancelText}
                </CustomText>
              </Pressable>
            )}
            {!!neutralText && (
              <Pressable
                style={[styles.btn, stacked && styles.btnStacked]}
                hitSlop={8}
                onLayout={onBtnLayout("neutral")}
                onPress={() => {
                  close();
                  onNeutral?.();
                }}
              >
                <CustomText
                  style={[
                    styles.btnText,
                    // Primary (navy) on a dark grey surface is hard to read, so
                    // use white in dark mode.
                    { color: theme.c.textBrand },
                  ]}
                >
                  {neutralText}
                </CustomText>
              </Pressable>
            )}
            <Pressable
              style={[styles.btn, stacked && styles.btnStacked]}
              hitSlop={8}
              onLayout={onBtnLayout("confirm")}
              onPress={() => {
                close();
                onConfirm?.();
              }}
            >
              <CustomText style={[styles.btnText, { color: confirmColor }]}>
                {confirmText}
              </CustomText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Overlay>
  );
};

export default ConfirmDialogHost;
