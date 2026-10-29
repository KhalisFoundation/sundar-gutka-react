const createStyles = (theme) => ({
  viewColumn: { flexDirection: "column" },
  viewRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: {
    fontSize: theme.typography.sizes.xxxl,
    color: theme.c.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  flexView: { flex: 1, backgroundColor: theme.c.background },
  timeFont: {
    fontSize: theme.typography.sizes.huge + theme.spacing.lg,
    color: theme.c.textPrimary,
    fontWeight: theme.typography.weights.light,
  },
  accContentText: {
    fontSize: theme.typography.sizes.md,
    color: theme.c.textSecondary,
  },
  accContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    margin: theme.spacing.sm,
  },
  modalSelectText: {
    fontSize: theme.typography.sizes.huge,
    fontWeight: theme.typography.weights.medium,
    color: theme.c.textPrimary,
  },
  textInput: {
    height: theme.components.input.minHeight - theme.spacing.sm,
    borderRadius: theme.components.input.borderRadius,
    borderColor: theme.c.accent,
    borderWidth: 1,
    padding: theme.components.input.paddingHorizontal,
    color: theme.c.textPrimary,
    fontSize: theme.typography.sizes.lg,
  },
  labelModalWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  labelViewWrapper: {
    backgroundColor: theme.c.surfaceElevated,
    padding: theme.spacing.xl,
    width: "90%",
    maxWidth: 300,
    borderRadius: theme.radius.lg,
  },
  labelText: {
    paddingBottom: theme.spacing.sm,
    color: theme.c.accent,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium,
  },
  labelButtonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  modalBackColor: { backgroundColor: theme.c.surfaceElevated },
});

export default createStyles;
