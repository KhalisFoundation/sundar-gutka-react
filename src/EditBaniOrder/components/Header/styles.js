const createStyles = (theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 45,
    padding: 5,
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
    fontSize: 20,
    fontWeight: "300",
    textAlign: "center",
    color: theme.colors.primaryText,
  },
});

export default createStyles;
