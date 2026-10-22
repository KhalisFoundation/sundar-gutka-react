const createStyles = (theme) => ({
  baniDBLogoImage: { alignSelf: "center" },
  // The SCREEN ground, not a card fill. On `surface` the whole page was one
  // step lighter than every other screen in dark mode, so Database Update read
  // as a different app.
  mainWrapper: { flex: 1, backgroundColor: theme.c.background },
  container: {
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.components.card.borderRadius,
    // shadow / elevation...
    shadowColor: theme.c.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: theme.c.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: theme.typography.sizes.lg,
    marginRight: theme.spacing.md,
    color: theme.c.textPrimary,
  },
  button: {
    backgroundColor: theme.c.background,
    paddingHorizontal: theme.components.button.paddingHorizontal,
    paddingVertical: theme.components.button.paddingVertical,
    borderRadius: theme.components.button.borderRadius,
    minHeight: theme.components.button.minHeight,
  },
  buttonDisabled: {
    backgroundColor: theme.c.textSecondary,
  },
  buttonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  percentText: {
    position: "absolute",
    top: "40%",
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.c.textPrimary,
  },
  headerTitleStyle: {
    color: theme.c.textPrimary,
    fontWeight: theme.typography.weights.normal,
    fontSize: theme.typography.sizes.xl,
  },
  headerStyle: {
    // Was `colors.baniDB` (#eaa040) — an orange bar unlike every other screen's
    // header, and one that fought the theme in dark mode. Headers all share the
    // screen ground now.
    backgroundColor: theme.c.background,
    height: theme.components.header.height,
    paddingHorizontal: theme.components.header.paddingHorizontal,
  },
  baniDBContainer: { flexDirection: "row", justifyContent: "center" },
  baniDBImage: {
    width: theme.spacing.huge + theme.spacing.xxl + theme.spacing.sm,
    height: theme.spacing.huge + theme.spacing.xxl + theme.spacing.sm,
    margin: theme.spacing.md,
  },
  baniDBText: {
    fontSize: theme.typography.sizes.massive + theme.typography.sizes.xl,
    marginTop: theme.spacing.md,
    color: theme.c.textPrimary,
    fontWeight: theme.typography.weights.light,
  },
});

export default createStyles;
