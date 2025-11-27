const createStyles = (theme) => ({
  container: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    height: 65,
    justifyContent: "center",
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "85%",
    marginLeft: "auto",
    marginRight: "auto",
    gap: 25,
  },
  iconContainer: {
    flexBasis: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: theme.staticColors.WHITE_COLOR,
    borderRadius: 15,
    padding: theme.spacing.lg,
  },
  iconText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: theme.typography.fonts.balooPaaji,
  },
});

export default createStyles;
