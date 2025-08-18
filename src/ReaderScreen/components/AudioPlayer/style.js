import { StyleSheet } from "react-native";
import { colors } from "@common";

const fontFamily = "Baloo Paaji 2";
// Common values
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const BORDER_RADIUS = {
  sm: 15,
  md: 20,
  lg: 30,
  xl: 40,
};

const SHADOW = {
  light: {
    shadowColor: colors.BLACK_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: colors.SHADOW_COLOR || colors.BLACK_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

const BACKGROUND_COLORS = {
  primary: colors.READER_HEADER_COLOR,
  secondary: "#E0E8F5",
  light: "#e5e5e4",
  white: colors.WHITE_COLOR,
  semiTransparent: "rgba(255, 255, 255, 0.6)",
  semiTransparentStrong: "rgba(255, 255, 255, 0.9)",
};

const TEXT_COLORS = {
  primary: colors.READER_HEADER_COLOR,
  secondary: "#808FAD",
  white: colors.WHITE_COLOR,
  dark: "#113979",
};

const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

const FONT_WEIGHTS = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "bold",
};

const styles = StyleSheet.create({
  blurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: BORDER_RADIUS.xl,
  },
  mainContainer: {
    backgroundColor: BACKGROUND_COLORS.semiTransparent,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: BORDER_RADIUS.xl,
    margin: SPACING.md,
    ...SHADOW.light,
  },
});

export const audioControlBarStyles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xl,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  mainContainer: {
    backgroundColor: BACKGROUND_COLORS.semiTransparentStrong,
    borderRadius: BORDER_RADIUS.xl,
  },
  topControlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 2,
    padding: 5,
  },
  leftControls: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  rightControls: {
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLORS.secondary,
    padding: 7,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
  },
  actionButtonText: {
    color: TEXT_COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily,
  },
  controlIcon: {
    padding: SPACING.sm,
  },
  separator: {
    height: 1,
    backgroundColor: BACKGROUND_COLORS.light,
  },
  mainSection: {
    flexDirection: "column",
    padding: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  trackInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  trackName: {
    fontSize: FONT_SIZES.xl,
    color: TEXT_COLORS.primary,
    fontFamily,
  },
  infoTag: {
    fontSize: FONT_SIZES.xs,
    color: TEXT_COLORS.secondary,
    fontStyle: "italic",
    fontFamily,
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  playButton: {},
  progressContainer: {
    width: "80%",
  },
  progressBar: {},
  slider: {
    width: "100%",
  },
  timestamp: {
    fontSize: FONT_SIZES.sm,
    color: TEXT_COLORS.primary,
    fontFamily,
    alignSelf: "flex-end",
  },
});

export const audioTrackDialogStyles = StyleSheet.create({
  container: {
    zIndex: 100,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  welcomeText: {
    fontFamily,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: TEXT_COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitleText: {
    fontFamily,
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.primary,
    textAlign: "center",
    opacity: 0.8,
  },
  trackList: {
    maxHeight: 200,
    marginBottom: SPACING.xxl,
  },
  trackItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLORS.light,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedTrackItem: {
    backgroundColor: BACKGROUND_COLORS.primary,
    borderColor: BACKGROUND_COLORS.primary,
  },
  trackName: {
    fontFamily,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: TEXT_COLORS.primary,
    flex: 1,
  },
  selectedTrackName: {
    color: TEXT_COLORS.white,
  },
  playButton: {
    backgroundColor: BACKGROUND_COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    minWidth: 120,
  },
  playButtonDisabled: {
    backgroundColor: colors.LIGHT_GRAY,
  },
  playButtonText: {
    color: TEXT_COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    marginRight: SPACING.sm,
    fontFamily,
  },
});

export const downloadBadgeStyles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BACKGROUND_COLORS.light,
    width: "35%",
    alignSelf: "flex-end",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  downloadedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  downloadButtonText: {
    fontFamily,
    fontSize: FONT_SIZES.xl,
    color: TEXT_COLORS.primary,
  },
});

export const minimizePlayerStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: SPACING.xl,
    width: "50%",
    height: 60,
    backgroundColor: BACKGROUND_COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOW.medium,
  },
  progressContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseButton: {
    position: "absolute",
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
  },
  timestamp: {
    fontFamily,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: TEXT_COLORS.dark,
    marginBottom: SPACING.xs,
  },
  artistName: {
    fontFamily,
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.dark,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default styles;
