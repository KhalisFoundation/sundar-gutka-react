const createStyles = (theme) => ({
  viewColumn: { flexDirection: "column" },
  viewRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: {
    fontSize: theme.typography.sizes.xxxl,
    color: theme.colors.primaryText,
    fontWeight: theme.typography.weights.medium,
  },
  flexView: { flex: 1, backgroundColor: theme.colors.inactiveView },
  timeFont: {
    fontSize: theme.typography.sizes.huge + theme.spacing.lg,
    color: theme.colors.primaryText,
    fontWeight: theme.typography.weights.light,
  },
  accContentText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.componentColor,
  },
  accContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    margin: theme.spacing.sm,
  },
  modalSelectText: {
    fontSize: theme.typography.sizes.huge,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primaryText,
  },
  textInput: {
    height: theme.components.input.minHeight - theme.spacing.sm,
    borderRadius: theme.components.input.borderRadius,
    borderColor: theme.colors.underlayColor,
    borderWidth: 1,
    padding: theme.components.input.paddingHorizontal,
    color: theme.colors.primaryText,
    fontSize: theme.typography.sizes.lg,
  },
  labelModalWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  labelViewWrapper: {
    backgroundColor: theme.staticColors.WHITE_COLOR,
    padding: theme.spacing.xl,
    width: 300,
    borderRadius: theme.radius.lg,
  },
  labelText: {
    paddingBottom: theme.spacing.sm,
    color: theme.colors.underlayColor,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.medium,
  },
  labelButtonWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  modalBackColor: { backgroundColor: theme.colors.surfaceGrey },
});
export default createStyles;
