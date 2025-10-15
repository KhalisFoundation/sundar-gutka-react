const createStyles = (theme) => ({
  container: {
    width: "100%",
    height: 60,
  },
  navigationBar: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 70,
    paddingHorizontal: 20,
    gap: 25,
    backgroundColor: theme.colors.primary,
  },
  iconContainer: {
    flexBasis: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: theme.staticColors.WHITE_COLOR,
    borderRadius: 15,
    padding: 15,
  },
});

export default createStyles;
