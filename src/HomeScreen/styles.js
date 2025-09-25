const createStyles = (theme) => ({
  container: {
    flex: 1,
    marginTop: 0,
  },
  header: {
    backgroundColor: theme.colors.primary,
  },
  fateh: {
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.xl,
    textAlign: "center",
    margin: theme.spacing.sm,
  },
  headerDesign: {
    fontSize: theme.typography.sizes.massive,
    color: theme.staticColors.WHITE_COLOR,
    fontFamily: theme.typography.fonts.gurbaniPrimary,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.huge,
    color: theme.staticColors.WHITE_COLOR,
    fontWeight: theme.typography.weights.medium,
  },
  titleContainer: {
    textAlign: "center",
    margin: theme.spacing.sm,
  },
  settingIcon: {
    position: "absolute",
    bottom: theme.spacing.md,
    right: theme.spacing.sm,
  },
  headerFatehStyle: {
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.xl,
  },
  fatehContainer: {
    marginTop: theme.spacing.lg,
    marginLeft: "auto",
    marginRight: "auto",
  },
  ikongkar: {
    fontFamily: theme.typography.fonts.gurbaniPrimary,
    color: theme.staticColors.WHITE_COLOR,
    fontSize: theme.typography.sizes.xxl,
  },
});

export default createStyles;
