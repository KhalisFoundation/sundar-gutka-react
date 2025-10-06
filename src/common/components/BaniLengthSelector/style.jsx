const createStyles = (theme) => ({
  heading: {
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: theme.typography.fonts.gurbaniThick,
    textAlign: "center",
    fontSize: theme.typography.sizes.massive + theme.spacing.xl,
  },
  viewWrapper: {
    margin: theme.spacing.md,
  },
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  baniLengthMessage: {
    marginTop: theme.spacing.lg,
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.md,
  },
  textPreferrence: {
    marginTop: theme.spacing.lg,
    color: theme.staticColors.WHITE_COLOR,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.xl,
  },
  button: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.primaryText,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    textAlign: "center",
    textTransform: "uppercase",
    borderRadius: theme.components.button.borderRadius,
    minHeight: theme.components.button.minHeight,
  },
  helpText: {
    color: theme.colors.primaryVariant,
    fontWeight: theme.typography.weights.bold,
    fontStyle: "italic",
    fontSize: theme.typography.sizes.sm,
  },
  moreInfo: {
    color: theme.colors.primaryText,
    fontWeight: theme.typography.weights.normal,
    fontSize: theme.typography.sizes.sm,
  },
  helpWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
});
export default createStyles;
