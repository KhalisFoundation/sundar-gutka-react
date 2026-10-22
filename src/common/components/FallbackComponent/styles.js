const createStyles = (theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.c.surface,
    padding: theme.spacing.md,
    textAlign: "center",
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    textAlign: "center",
    color: theme.c.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: theme.typography.sizes.xxxl + theme.typography.sizes.xl,
    color: theme.c.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  text: {
    marginVertical: theme.spacing.lg,
    textAlign: "center",
    maxWidth: 300,
    alignSelf: "center",
    fontSize: theme.typography.sizes.lg,
    color: theme.c.textPrimary,
  },
  btnWrap: {
    flexDirection: "row",
    marginTop: theme.spacing.xl,
  },
});
export default createStyles;
