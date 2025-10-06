const createStyles = (theme) => ({
  baniDBLogoImage: { alignSelf: "center" },
  mainWrapper: { flex: 1, backgroundColor: theme.colors.surface },
  container: {
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.components.card.borderRadius,
    // shadow / elevation...
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: theme.typography.sizes.lg,
    marginRight: theme.spacing.md,
    color: theme.colors.primaryText,
  },
  button: {
    backgroundColor: theme.colors.baniDB,
    paddingHorizontal: theme.components.button.paddingHorizontal,
    paddingVertical: theme.components.button.paddingVertical,
    borderRadius: theme.components.button.borderRadius,
    minHeight: theme.components.button.minHeight,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.textDisabled,
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
    color: theme.colors.primaryText,
  },
  headerTitleStyle: {
    color: theme.colors.primaryText,
    fontWeight: theme.typography.weights.normal,
    fontSize: theme.typography.sizes.xl,
  },
  headerStyle: {
    backgroundColor: theme.colors.baniDB,
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
    color: theme.colors.primaryText,
    fontWeight: theme.typography.weights.light,
  },
});

export default createStyles;
