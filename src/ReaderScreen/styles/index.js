import { Platform } from "react-native";
import { withAlpha } from "@theme/colorUtils";
import { brandMarks } from "@theme/palette";

// A NOTE ON `elevation` IN THIS FILE
//
// Some of these set `elevation` for STACKING, not for depth. On Android zIndex
// alone does not reliably order sibling views -- the platform sorts by
// elevation -- so both are set together. Android only casts a shadow from
// elevation when the view has a background, so a stacking-only layer with no
// background costs nothing and needs no iOS counterpart.
//
// Where a layer DOES have a background, the Android shadow is real and iOS must
// be given a matching one, or the same screen has depth on one platform and not
// the other. Those cases take the shared elevation preset and then restate
// `elevation` at the value the stacking order requires.
const createStyles = (theme) => ({
  gurmukhiText: {
    margin: theme.spacing.sm,
  },
  translit: {
    fontFamily: theme.typography.fonts.balooPaaji,
    padding: theme.spacing.xs,
    fontSize: theme.typography.sizes.md,
  },
  englishTranslations: {
    padding: theme.spacing.xs,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.md,
  },
  spanishTranslations: {
    padding: theme.spacing.xs,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.md,
  },
  punjabiTranslations: {
    padding: theme.spacing.xs,
    fontSize: theme.typography.sizes.md,
  },
  vishraamGradient: {
    borderRadius: theme.radius.sm,
  },

  vishraamShort: {
    color: theme.c.vishraamShort,
  },
  larivaarAssist: {
    opacity: 0.65,
  },
  webView: { flex: 1 },
  top50: { marginTop: theme.spacing.xxxl + theme.spacing.lg },
  paragraphStyle: { flex: 1, flexDirection: "row" },
  slider: {
    flex: 1,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 70,
  },
  container: {
    borderRadius: theme.radius.lg + theme.spacing.lg,
    width: "100%",
    zIndex: 100,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden",
    backgroundColor: theme.c.primary,
    // Has a background, so Android casts a real shadow here — iOS gets the
    // matching one from the shared preset.
    ...theme.elevation.raised,
    // Restated ABOVE the preset's value: this must stack over the bottom chrome
    // and the progress bar, which sit at 10 and 11.
    elevation: 12,
  },
  // The auto-scroll speed slider. Its two colours are fixed in both app themes
  // on purpose — it sits on the bani ground, not on a themed surface. A
  // DESIGNED theme is the one case where that reasoning inverts: the ground it
  // sits on is the theme's, so a navy fill on parchment is the odd one out.
  progressBarContainer: {
    height: 5,
    width: "100%",
    backgroundColor: theme.designedTheme
      ? withAlpha(theme.c.accent, 0.2)
      : brandMarks.readerProgress.track,
    zIndex: 100,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.designedTheme ? theme.c.accent : brandMarks.readerProgress.fill,
  },
  sliderText: {
    color: theme.c.onPrimary,
    fontSize: theme.typography.sizes.md,
  },

  headerWrapper: {
    flexDirection: "row",
    width: "100%",
    // The shared clearance, replacing a hand-tuned 80pt box whose content was
    // bottom aligned to fake the same effect. Every other header reads the same
    // token, so the Reader and the rest of the app now start at one height.
    // The row itself, matching the shared header's inner row. The clearance
    // above it lives on `headerStyle` — see the note there.
    minHeight: theme.layout.header.minHeight,
    // No marginBottom. The divider below is drawn immediately after the row, as
    // it is on every other screen — an extra gap here pushed the Reader's rule
    // lower than the one under the Settings header.
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Three columns sized to their CONTENT, not to percentages of the screen.
  //
  // The trailing slot carries two actions now, and a 10% box could not hold them
  // on a narrow device — at a raised OS font size or a small display the second
  // icon was pushed off the edge. The side slots take whatever their icons need
  // and the title takes the rest; `header.jsx` measures the trailing slot and
  // gives the leading one the same minimum, which is what keeps the title
  // centred on the screen rather than on the space between two unequal boxes.
  headerLeft: {
    paddingLeft: theme.spacing.lg,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerRight: {
    paddingRight: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.lg,
  },

  footerWrapper: {
    paddingLeft: theme.spacing.xl,
    paddingRight: theme.spacing.xl,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
    height: theme.components.header.height + theme.spacing.sm,
  },
  headerTitleStyle: {
    color: theme.c.headerFg,
    fontSize: theme.type.heading.fontSize,
    // NO lineHeight. Pinning one here truncated Gurmukhi titles mid-string on
    // Android — "ਗੁਰ ਮੰਤ੍ਰ" drew as "ਗੁਰ" — while the identical string in a
    // Text without it rendered in full. Gurmukhi clusters carry marks above and
    // below the baseline, and a fixed line box makes the platform drop the
    // clusters that do not fit rather than overflow them. The face's own line
    // height is what it needs.
    zIndex: 1,
  },
  footerTitleStyle: {
    color: theme.c.onPrimary,
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: theme.typography.sizes.lg,
  },
  headerStyle: {
    // Matches the page it sits on, and the page matches every other screen.
    backgroundColor: theme.c.backgroundAlt,
    // The clearance lives on the OUTER view and the row height on the inner one,
    // exactly as the shared ScreenHeader splits them. Both on one view does not
    // work: React Native measures minHeight against the border box, so the
    // padding is counted INSIDE it and a 48pt clearance simply swallows a 56pt
    // minimum, collapsing the row to its content.
    paddingTop: theme.layout.header.topClearance,
  },
  animatedView: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
  },
  autoScrollFixedView: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: theme.components.bottomNavigation.height + theme.spacing.sm + 5,
    // Stacking only — no background, so no shadow is cast on either platform.
    zIndex: 10,
    elevation: 10,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  // Bottom-nav overlay: pinned to the bottom edge and slid out of view via a
  // single native-driver transform, so showing/hiding the bars never resizes
  // the flex WebView underneath (that reflow was the low-end-Android jank).
  bottomChrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Stacking only — no background, so no shadow is cast on either platform.
    zIndex: 10,
    elevation: 10,
  },
  // Reading-progress bar — a separate bottom-pinned layer that never hides. It
  // lifts to sit on top of the nav when the bars show and drops to the bottom
  // edge when they hide, so progress stays visible either way.
  scrollProgressBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Explicit width so the percentage-width fill child always has a definite
    // base to resolve against. Without it, the fill's initial "0%" can fail to
    // resolve against the (left/right-sized) parent and render full-width — the
    // progress bar looked "complete" on first open.
    width: "100%",
    height: 5,
    overflow: "hidden",
    // `elevation` is restated at the stacking value it needs: the nav overlay
    // below it sits at 10, and on Android elevation is what orders siblings.
    ...theme.elevation.card,
    zIndex: 11,
    elevation: 11,
    // ...but ONLY for stacking. On Android elevation does two jobs, and an
    // elevation-11 view WITH a background casts a real material shadow — which
    // this one does. Resting just above the system bar with the app's own bars
    // hidden, that shadow fell straight onto the navigation buttons as a dark
    // gradient behind them.
    //
    // React Native maps `shadowColor` onto the outline ambient/spot shadow
    // colours on Android 9+, so a transparent one stops the shadow drawing while
    // leaving the elevation — and therefore the stacking — alone. This is
    // already what the bar does in dark mode, where `elevation.card` IS the
    // zeroed preset; it now does the same in light mode. iOS keeps the preset's
    // shadow, which is the half elevation never drew for it.
    ...(Platform.OS === "android" && { shadowColor: "transparent" }),
    // The unfilled remainder of the progress track.
    backgroundColor: withAlpha(theme.c.accent, 0.2),
  },
  // Width-driven, not transform: scaleX — scaleX stretches/squishes the
  // already-painted pixels non-uniformly along X. Animating width directly
  // keeps the fill true at every percentage.
  scrollProgressFill: {
    height: "100%",
    // Anchor to the left. Without this, the column container's default
    // alignItems:"stretch" makes the fill span the FULL width whenever its
    // animated width isn't resolved on a given frame — which made the bar look
    // 100% complete on a bani's first open.
    alignSelf: "flex-start",
    width: 0,
    // The filled portion, on the same accent as the track behind it.
    backgroundColor: withAlpha(theme.c.accent, 0.5),
  },
});
export default createStyles;
