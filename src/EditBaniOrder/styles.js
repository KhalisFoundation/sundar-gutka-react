export const createStyles = (theme) => ({
  rowItem: {
    height: theme.components.header.height + theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    marginTop: 1,
    backgroundColor: theme.colors.surface,
  },
  text: {
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    fontSize: theme.typography.sizes.xxxl,
    textAlign: "center",
    color: theme.colors.primaryText,
  },
  gestureHandlerRootView: {
    backgroundColor: theme.colors.primaryText,
    flex: 1,
  },
});

export const activeColor = (isActive, backColor, theme) => ({
  backgroundColor: isActive ? theme.staticColors.WHITE_COLOR : backColor,
});
