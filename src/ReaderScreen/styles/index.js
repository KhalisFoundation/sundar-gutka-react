import { colors } from "@common";

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
    color: colors.VISHRAM_SHORT,
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
    backgroundColor: theme.colors.primary,
    elevation: 12,
  },
  progressBarContainer: {
    height: 5,
    width: "100%",
    backgroundColor: theme.colors.disabled || "#E0E0E0",
    zIndex: 100,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  sliderText: {
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.md,
  },

  headerWrapper: {
    flexDirection: "row",
    height: 80,
    width: "100%",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  headerLeft: {
    paddingLeft: theme.spacing.lg,
    alignItems: "flex-start",
    justifyContent: "center",
    width: "10%",
  },

  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
  },

  headerRight: {
    marginRight: theme.spacing.lg,
    width: "10%",
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
    color: theme.colors.primaryHeaderVariant,
    fontSize: theme.typography.sizes.xxl,
    zIndex: 1,
  },
  footerTitleStyle: {
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: theme.typography.sizes.lg,
  },
  headerStyle: {
    backgroundColor: theme.mode === "dark" ? "rgba(18, 18, 18, 1)" : "#F0F4F8",
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
    zIndex: 10,
    elevation: 10,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bottomChrome: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollProgressBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    overflow: "hidden",
    backgroundColor: theme.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
  },
  scrollProgressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
});
export default createStyles;
