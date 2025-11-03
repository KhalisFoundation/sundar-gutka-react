const createStyles = (theme) => ({
  container: {
    width: "100%",
    backgroundColor: theme.colors.primary,
    height: 80,
    justifyContent: "center",
    paddingBottom: 10,
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "80%",
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
