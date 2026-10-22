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
  // The Seva tab's badge. A plain dot has no digits to hold, so it is a small
  // 10px circle; only the numbered badge needs the larger 16px box, and it sits
  // slightly further out to clear the icon. borderColor is set per item.
  badgeDot: {
    position: "absolute",
    top: -4,
    right: -5,
    backgroundColor: theme.c.error,
    borderRadius: 5,
    minWidth: 10,
    height: 10,
    borderWidth: 1.2,
  },
  badgeNumbered: {
    position: "absolute",
    top: -7,
    right: -9,
    backgroundColor: theme.c.error,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderWidth: 1.2,
  },
  badgeText: {
    color: theme.c.onError,
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
    textAlign: "center",
    lineHeight: 13,
  },
});

export default createStyles;
