import { constant } from "@common";

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

const createStyles = (theme) => ({
  mainContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: BORDER_RADIUS.sm,
    margin: theme.spacing.md_12,
    ...SHADOW.light,
  },
});

export const audioControlBarStyles = (theme) => ({
  blurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: BORDER_RADIUS.md,
    borderColor: theme.colors.separator,
    borderWidth: 1,
    overflow: "hidden",
  },
  container: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    marginBottom: theme.spacing.md_12,
  },
  mainContainer: {
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    borderRadius: BORDER_RADIUS.md,
    borderColor: theme.colors.separator,
    borderWidth: 1,
    ...SHADOW.light,
    backgroundColor: theme.colors.transparentOverlay,
  },

  minimizePlayerAnimation: {
    opacity: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  minimizePlayerAnimationActive: {
    zIndex: 1,
  },
  modalAnimation: {
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    justifyContent: "center",
    zIndex: 1,
  },
  moreTracksModalContainer: {
    width: "90%",
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: theme.spacing.lg,
    zIndex: 20,
  },

  timestampWithColor: {
    color: theme.colors.audioPlayer,
  },
  topControlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 40,
    padding: 5,
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
    zIndex: 1,
  },
  leftControls: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  rightControls: {
    flexDirection: "row",
    gap: theme.spacing.md_12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    borderRadius: BORDER_RADIUS.xl,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.balooPaaji,
  },
  actionButtonContent: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    height: "100%",
  },
  actionButtonIconContainer: {
    height: "100%",
    justifyContent: "center",
  },
  separator: {
    height: 2,
    backgroundColor: theme.colors.separator,
    zIndex: 1,
  },
  mainSection: {
    paddingHorizontal: theme.spacing.md_12,
    zIndex: 1,
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
    gap: theme.spacing.md,
  },
  trackName: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fonts.balooPaaji,
    color: theme.colors.audioTitleText,
  },
  trackInfoText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.balooPaaji,
    marginBottom: 2,
  },
  playbackControls: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md_12,
    gap: theme.spacing.md_12,
  },
  playButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
    marginTop: 2,
    justifyContent: "center",
  },
  timestamp: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.balooPaaji,
    right: 0,
    position: "absolute",
    bottom: 25,
    fontWeight: theme.typography.weights.normal,
  },
});

export const audioTrackDialogStyles = (theme) => ({
  modalWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    zIndex: 1000,
  },
  blurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: BORDER_RADIUS.md,
  },
  container: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.staticColors.TRACK_COLOR,
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing.md_12,
  },
  containerIOS: {
    backgroundColor: "transparent",
  },
  containerAndroid: {
    backgroundColor: theme.colors.transparentOverlay,
  },
  header: {
    alignItems: "center",
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  welcomeText: {
    fontFamily: constant.BALOO_PAAJI_SEMI_BOLD,
    fontSize: theme.typography.sizes.xxl,
    textAlign: "center",
    color: theme.colors.audioTitleText,
  },
  subtitleText: {
    fontFamily: constant.BALOO_PAAJI,
    fontSize: theme.typography.sizes.lg,
    textAlign: "center",
    color: theme.colors.audioTitleText,
  },
  trackList: {
    maxHeight: 200,
    zIndex: 1,
  },
  trackItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.xl,
    padding: theme.spacing.md_12,
    paddingHorizontal: theme.spacing.xl_20,
    marginBottom: theme.spacing.md_12,
    // borderWidth: 2,
    borderColor: "transparent",
    minHeight: 40, // Consistent height for Android
  },
  selectedTrackItem: {
    backgroundColor: theme.colors.primary,
    color: theme.staticColors.WHITE_COLOR,
    borderColor: theme.colors.primary,
  },
  trackName: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.normal,
    flex: 1,
  },
  selectedTrackName: {
    color: theme.staticColors.WHITE_COLOR,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: theme.spacing.md_12,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    minWidth: 120,
    zIndex: 1,
  },
  playButtonText: {
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    marginRight: theme.spacing.md,
    fontFamily: theme.typography.fonts.balooPaaji,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  noTracksContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  noTracksText: {
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.audioTitleText,
  },
  noTracksSubtext: {
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.audioTitleText,
    textAlign: "center",
  },
  joinMailingListButton: {
    padding: theme.spacing.md_12,
    paddingHorizontal: theme.spacing.xl,
  },
  joinMailingListText: {
    color: theme.colors.audioTitleText,
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fonts.balooPaaji,
  },
});

export const downloadBadgeStyles = (theme) => ({
  container: {
    position: "relative",
    zIndex: 10,
    bottom: 0,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginRight: theme.spacing.xl_20,
    backgroundColor: theme.colors.separator,
    width: "35%",
    alignSelf: "flex-end",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    padding: 2,
  },
  downloadedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  downloadButtonText: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.light,
    color: theme.colors.primaryHeaderVariant,
  },
});

export const minimizePlayerStyles = (theme) => ({
  container: {
    position: "absolute",
    bottom: 10,
    right: theme.spacing.xl_20,
    width: "50%",
    maxHeight: 60,
    borderRadius: BORDER_RADIUS.xl,
    padding: theme.spacing.xl_20,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md_12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.surfaceGrey,
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
  svgContainer: {
    position: "absolute",
  },
  textContainer: {
    flex: 1,
  },
  timestamp: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.lg,
    justifyContent: "center",
    color: theme.colors.audioTitleText,
  },
  artistName: {
    fontFamily: theme.typography.fonts.balooPaaji,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.audioTitleText,
  },
});

export const audioSettingModalStyles = (theme) => ({
  settingsModalContainer: {
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  settingItemTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.balooPaaji,
    color: theme.colors.audioSettingsModalText,
  },
  switchStyle: { transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] },
  speedControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },

  modalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.separator,
  },
});

export default createStyles;
