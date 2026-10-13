import { Platform } from "react-native";
import spacing from "./spacing";

const components = {
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
  card: {
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  list: {
    itemPadding: spacing.lg,
    itemMargin: spacing.sm,
    sectionHeaderPadding: spacing.md,
  },
  modal: {
    padding: spacing.xl,
    borderRadius: 16,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
  bottomNavigation: {
    height: 65,
    // iOS ONLY. The most of the bottom safe-area inset the bar will pad on
    // iPhone; Android is not subject to it at all (see `bottomNavInset`).
    //
    // The 65pt box above already carries ~9pt of room below the row it holds,
    // and the home indicator supplies the rest of the clearance itself, so
    // padding the full 34pt inset on top of it stacked two gaps and left the
    // bar standing ~99pt. That is the band of nav colour below the icons.
    //
    // Sized against what the bar looks like rather than against the inset: the
    // row sits 8.5pt below the bar's top edge, so anything much over 10 here
    // reads as lopsided — 20 still left ~28pt under the labels against 8.5pt
    // over the icons. At 10 the gap below is ~18.5pt, which balances the bar and
    // still keeps the labels clear of the ~13pt the home indicator occupies.
    // Nothing tappable comes near its swipe zone either way.
    maxInsetIOS: 10,
  },
};

/**
 * How much of the bottom safe-area inset the bottom nav pads. Capped on iOS,
 * UNTOUCHED everywhere else.
 *
 * The two platforms' bottom insets are different kinds of thing. iOS's is the
 * home indicator: a thin overlay that content is allowed to sit under, which is
 * why Apple's own tab bar extends beneath it — the 34pt is a layout convention,
 * not an obstruction.
 *
 * Android's is the NAVIGATION BAR, and this app is edge-to-edge with that bar
 * left on screen (MainActivity.applyEdgeToEdge deliberately hides no system
 * bar), so the inset is 48dp of real back/home/recents keys on three-button
 * navigation and ~24dp of gesture pill otherwise. Trimming it there would slide
 * the tab row under the system buttons, so Android returns early and keeps the
 * whole inset it has always padded.
 *
 * Anything that MEASURES the bar — the Reader lifts its progress track, audio
 * player and autoscroll pill by the bar's footprint — must add this rather than
 * the raw inset, or on iPhone it drifts off the bar by whatever the cap trimmed.
 */
export const bottomNavInset = (insetBottom = 0) =>
  Platform.OS === "ios"
    ? Math.min(insetBottom, components.bottomNavigation.maxInsetIOS)
    : insetBottom;

export default components;
