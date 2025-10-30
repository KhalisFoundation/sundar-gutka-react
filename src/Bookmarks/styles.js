const createStyles = (theme) => ({
  headerTitleStyle: {
    color: theme.colors.primaryText,
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fonts.balooPaajiSemiBold,
  },
  headerStyle: {
    backgroundColor: theme.colors.surface,
    height: theme.components.header.height,
    paddingHorizontal: theme.components.header.paddingHorizontal,
  },
  nightBackColor: {
    backgroundColor: theme.colors.surface,
  },
});

export default createStyles;
