import { colors } from "@common";

const createStyles = (theme) => ({
  gurmukhiText: {
    margin: theme.spacing.sm,
  },
  translit: {
    fontFamily: theme.typography.fonts.arial,
    padding: theme.spacing.xs,
    fontSize: theme.typography.sizes.md,
  },
  englishTranslations: {
    padding: theme.spacing.xs,
    fontFamily: theme.typography.fonts.arial,
    fontSize: theme.typography.sizes.md,
  },
  spanishTranslations: {
    padding: theme.spacing.xs,
    fontFamily: theme.typography.fonts.arial,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 0,
    padding: theme.spacing.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.primary,
  },
  sliderText: {
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.md,
  },
  headerViewWrapper: {
    backgroundColor: theme.colors.primary,
    height: theme.components.header.height + theme.spacing.xxl + theme.spacing.sm,
  },
  headerWrapper: {
    flex: 1,
    flexDirection: "row",
    margin: theme.spacing.md,
    justifyContent: "space-between",
  },
  animatedView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    zIndex: 1000,
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
    color: theme.staticColors.WHITE_COLOR,
    fontWeight: theme.typography.weights.normal,
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: theme.typography.sizes.xxl,
  },
  footerTitleStyle: {
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: theme.typography.sizes.lg,
  },
  headerStyle: {
    backgroundColor: theme.colors.primary,
    height: theme.components.header.height + theme.spacing.xxl + theme.spacing.sm,
    paddingTop: theme.spacing.xxl + theme.spacing.md,
    paddingHorizontal: theme.components.header.paddingHorizontal,
  },
});
export default createStyles;
