const createStyles = (theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    textAlign: "center",
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    textAlign: "center",
    color: theme.colors.primaryText,
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: theme.typography.sizes.xxxl + theme.typography.sizes.xl,
    color: theme.colors.primaryText,
    marginBottom: theme.spacing.lg,
  },
  text: {
    marginVertical: theme.spacing.lg,
    textAlign: "center",
    width: 300,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.primaryText,
  },
  btnWrap: {
    flexDirection: "row",
    marginTop: theme.spacing.xl,
  },
});
export default createStyles;
