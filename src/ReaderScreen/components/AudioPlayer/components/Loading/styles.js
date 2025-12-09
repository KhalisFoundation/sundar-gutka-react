const createStyles = (theme) => ({
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md_12,
    margin: theme.spacing.md_12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
});

export default createStyles;
