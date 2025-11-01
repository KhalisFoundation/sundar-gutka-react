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
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    // paddingTop: 0,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    overflow: "hidden",
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
    marginLeft: "auto",
    marginRight: "auto",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  headerLeft: {
    marginLeft: theme.spacing.lg,
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
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    width: "20%",
    backgroundColor: "green",
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
    backgroundColor: theme.colors.surface,
    width: "100%",
  },
  animatedView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
export default createStyles;
