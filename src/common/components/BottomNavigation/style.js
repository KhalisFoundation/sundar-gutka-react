const createStyles = (theme) => ({
  container: {
    width: "100%",
    backgroundColor: theme.c.primary,
    minHeight: theme.components.bottomNavigation.height,
    justifyContent: "center",
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
    paddingHorizontal: 8,
  },
  iconContainer: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 80,
    paddingVertical: 4,
  },
  activeIconContainer: {
    backgroundColor: theme.c.onPrimary,
    borderRadius: 15,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.c.onPrimary,
    fontFamily: theme.typography.fonts.balooPaaji,
    marginTop: 2,
    textAlign: "center",
    width: "100%",
  },
});

export default createStyles;
