import { StyleSheet, Platform } from "react-native";
import { colors, constant } from "@common";

const fontFamily = Platform.select({
  ios: "Baloo Paaji 2",
  android: "BalooPaaji2-Regular",
});
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

const BACKGROUND_COLORS = {
  primary: colors.READER_HEADER_COLOR,
  secondary: "#E0E8F5",
  tertiary: "#EEEEEE",
  light: colors.READER_HEADER_COLOR_10,
  white: colors.WHITE_COLOR,
  semiTransparent: "rgba(255, 255, 255, 0.6)",
  semiTransparentStrong: "rgba(255, 255, 255, 0.8)",
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
  mainContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: BORDER_RADIUS.sm,
    margin: SPACING.md,
    ...SHADOW.light,
  },
});

export const audioControlBarStyles = StyleSheet.create({
  blurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: BORDER_RADIUS.md,
  },
  container: {
    borderRadius: BORDER_RADIUS.md,
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 0,
    paddingBottom: 10,
    width: "95%",
  },
  mainContainer: {
    borderRadius: BORDER_RADIUS.md,
    ...SHADOW.light,
  },
  topControlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    width: "98%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  leftControls: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  rightControls: {
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "center",
  },
  actionButton: {
    borderRadius: BORDER_RADIUS.xl,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.normal,
    fontFamily,
    marginBottom: 4,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  separator: {
    height: 1,
  },
  mainSection: {
    paddingHorizontal: SPACING.md,
    // borderWidth: 1,
    // borderColor: "#eee",
  },
  trackInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  trackInfoLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  trackName: {
    fontSize: FONT_SIZES.xl,
    fontFamily,
    fontWeight: FONT_WEIGHTS.medium,
  },
  trackInfoText: {
    fontSize: FONT_SIZES.sm,
    fontFamily,
    marginBottom: 2,
  },
  playbackControls: {
    flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  playButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
    marginTop: 2,
    justifyContent: "center",
    // alignItems: "center",
  },
  timestamp: {
    fontSize: FONT_SIZES.sm,
    fontFamily,
    right: 0,
    position: "absolute",
    bottom: 25,
    fontWeight: FONT_WEIGHTS.normal,
  },
});

export const audioTrackDialogStyles = StyleSheet.create({
  blurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  container: {
    zIndex: 10,
    padding: SPACING.xxl,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.READER_HEADER_COLOR_10,
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  header: {
    alignItems: "center",
  },
  welcomeText: {
    fontFamily: "BalooPaaji2-SemiBold",
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: "center",
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.xl * 1.3, // Better line height for Android
  },
  subtitleText: {
    fontFamily,
    fontSize: FONT_SIZES.md,
    textAlign: "center",
    lineHeight: FONT_SIZES.md * 1.4, // Better line height for Android
  },
  trackList: {
    maxHeight: 200,
    zIndex: 10,
  },
  trackItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    // borderWidth: 2,
    borderColor: "transparent",
    minHeight: 60, // Consistent height for Android
  },
  selectedTrackItem: {
    backgroundColor: BACKGROUND_COLORS.primary,
    color: colors.WHITE_COLOR,
    borderColor: BACKGROUND_COLORS.primary,
  },
  trackName: {
    fontFamily,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.normal,
    flex: 1,
  },
  selectedTrackName: {
    color: TEXT_COLORS.white,
  },
  playButton: {
    backgroundColor: BACKGROUND_COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    minWidth: 120,
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
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginRight: SPACING.xl,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: BACKGROUND_COLORS.tertiary,
    width: "35%",
    alignSelf: "flex-end",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: 2,
  },
  downloadedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  downloadButtonText: {
    fontFamily,
    fontSize: FONT_SIZES.xs,
    fontWeight: 300,
  },
});

export const minimizePlayerStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 10,
    right: SPACING.xl,
    width: "50%",
    maxHeight: 60,
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
    marginBottom: SPACING.xs,
  },
  artistName: {
    fontFamily,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export const audioSettingModalStyles = StyleSheet.create({
  settingItemTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily,
    fontWeight: FONT_WEIGHTS.normal,
    color: "#666",
  },
  baniTitle: { fontFamily: constant.GURBANI_AKHAR_TRUE },
  defaultTrackTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily,
    fontWeight: FONT_WEIGHTS.normal,
    color: colors.READER_HEADER_COLOR,
    textDecorationLine: "underline",
  },
  switchStyle: { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }], marginLeft: 10 },
  switchContainer: { flexDirection: "row", flexWrap: "wrap" },
  modalContainer: { flexDirection: "row", margin: 5, alignItems: "center" },
  defaultTrackContainer: { flexDirection: "row", alignItems: "center", gap: 0 },
});

export default styles;
