const createStyles = (theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: theme.components.header.height - theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.headerVariant,
  },
  leftContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  rightContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.light,
    textAlign: "center",
    color: theme.staticColors.WHITE_COLOR,
  },
});

export default createStyles;
