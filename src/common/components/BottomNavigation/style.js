const createStyles = (theme) => ({
  container: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    height: 80,
    justifyContent: "center",
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 25,
  },
  iconContainer: {
    flexBasis: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: theme.staticColors.WHITE_COLOR,
    borderRadius: 15,
    padding: theme.spacing.lg,
  },
});

export default createStyles;
