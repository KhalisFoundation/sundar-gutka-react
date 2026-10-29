import { withAlpha } from "@theme/colorUtils";
import { androidLineHeight } from "@theme/lineHeight";

// Themed styles for the onboarding carousel. Colors come from the theme; only
// neutral spacing/sizes are hard-coded. Where a translucent fill is needed it
// goes through `withAlpha` on a role rather than a hand-written rgba, so the
// value tracks the theme.
const createStyles = (theme) => ({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.c.surface,
    // Android paints by elevation, not just tree order — sit above every screen
    // (the reader's bottom nav and player have elevation of their own).
    elevation: 9999,
    zIndex: 9999,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
  },
  globeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.c.headerFg,
  },
  globeLabel: {
    marginLeft: 6,
    color: theme.c.headerFg,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 13,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  imageWrap: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  imageBorder: {
    width: "88%",
    borderRadius: 15,
    borderWidth: 3.5,
    // The app's one blue, not a hardcoded literal that stayed the same in
    // both themes.
    borderColor: theme.c.controlAccent,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  // Shown until a real screenshot is dropped in for the slide.
  placeholder: {
    width: "80%",
    height: "100%",
    maxHeight: 460,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.c.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 10,
    color: theme.c.textPrimary,
    opacity: 0.45,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 13,
  },
  textBlock: {
    paddingBottom: 8,
  },
  title: {
    color: theme.c.textPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    color: theme.c.textPrimary,
    opacity: 0.7,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 16,
    lineHeight: androidLineHeight(24),
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: theme.c.textPrimary,
    opacity: 0.2,
  },
  dotActive: {
    width: 22,
    backgroundColor: theme.c.primary,
    opacity: 1,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 56,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  skipText: {
    color: theme.c.textPrimary,
    opacity: 0.6,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: theme.c.primary,
    borderRadius: 26,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: "center",
  },
  nextText: {
    color: theme.c.onPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 16,
  },
  langBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: withAlpha(theme.c.shadow, 0.35),
  },
  langCard: {
    position: "absolute",
    right: 16,
    backgroundColor: theme.c.surface,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 190,
    elevation: 8,
    shadowColor: theme.c.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  langItemText: {
    color: theme.c.textPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: 16,
  },
  langItemTextActive: {
    color: theme.c.primary,
  },
});

export default createStyles;
