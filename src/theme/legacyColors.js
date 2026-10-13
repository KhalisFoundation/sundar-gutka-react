// LEGACY colour maps, kept only for screens not yet moved onto the token layer.
//
// These are dev's `theme.colors` maps, verbatim. The design system replaced them
// with `theme.c` (semantic roles), and every migrated screen reads that instead.
// A few screens are migrated later, together with the feature they belong to:
// the audio player, the folder screen and the reminders screen. Until then they
// read these maps, so they look exactly as they did. Delete this file, and the
// `colors` / `staticColors` entries in lightTheme.js and darkTheme.js, in the PR
// that migrates the last of them.
import staticColors from "./staticColors";

export const legacyLight = {
  primary: "#113979",
  surface: "rgba(255, 255, 255, 1)",
  primaryText: "#121212",
  primaryVariant: "#DEBB0A",
  surfaceGrey: "#faf9f6",
  textDisabled: "#a3a3a3",
  underlayColor: "#009bff",
  headerVariant: "#003436",
  baniDB: "#eaa040",
  shadow: "#000",
  highlightTuk: "#0066ff",
  activeView: "#C7C7D7",
  inactiveView: "#e9e9ee",
  componentColor: "#232323",
  enabledText: "#0066ff",
  disabledText: "#a3a3a3",
  primaryHeader: "#113979",
  primaryHeaderVariant: "#113979",
  actionButton: "#D3E1F7",
  audioPlayer: "rgba(17, 57, 121, 0.5)",
  overlay: staticColors.SEMI_TRANSPARENT,
  audioTitleText: "#113979",
  trackBorderColor: staticColors.TRACK_COLOR,
  trackBackgroundColor: staticColors.TRACK_COLOR,
  controlBarBackgroundColor: "#ffffff",
  separator: "#eeeeee",
  transparentOverlay: "rgba(255, 255, 255, 0.95)",
  audioSettingsModalText: "#666666",
};

export const legacyDark = {
  primary: "#113979",
  surface: "rgba(18, 18, 18, 1)",
  primaryText: "#faf9f6",
  primaryVariant: "#99852c",
  surfaceGrey: "#464646",
  textDisabled: "#faf9f6",
  underlayColor: "#009bff",
  headerVariant: "#003436",
  baniDB: "#eaa040",
  shadow: "#fff",
  highlightTuk: "#77baff",
  activeView: "#2d2d2d",
  inactiveView: "#232323",
  componentColor: "#fefefe",
  enabledText: "#2581df",
  disabledText: "#a3a3a3",
  primaryHeader: "#121212",
  primaryHeaderVariant: "#faf9f6",
  actionButton: "#121F35",
  audioPlayer: "#BED2F2",
  overlay: staticColors.NIGHT_BLACK,
  audioTitleText: "#BED2F2",
  trackBorderColor: "#464646",
  trackBackgroundColor: "rgba(37, 105, 214, 0.2)",
  controlBarBackgroundColor: "#000000",
  separator: "rgba(190, 210, 242, 0.23)",
  transparentOverlay: "rgba(18, 18, 18, 0.95)",
  audioSettingsModalText: "#faf9f6",
};

export { staticColors };
