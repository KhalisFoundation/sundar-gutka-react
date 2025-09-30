const createStyles = (theme) => ({
  headerTitleStyle: {
    color: theme.colors.primaryText,
    fontWeight: theme.typography.weights.normal,
    fontSize: theme.typography.sizes.xxl,
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
