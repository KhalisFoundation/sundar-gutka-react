export default function createStyles(theme) {
  return {
    // Container styles
    container: {
      backgroundColor: theme.colors.surface,
    },

    mainWrapper: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },

    wrapper: {
      margin: theme.spacing.md,
    },

    // Text styles
    titleText: {
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.xxxl,
      fontWeight: theme.typography.weights.bold,
      marginBottom: theme.spacing.xl,
    },

    createByText: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.lg,
    },

    welcomeText: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.lg,
    },

    helpText: {
      color: theme.colors.primaryText,
      marginVertical: theme.spacing.md,
      fontSize: theme.typography.sizes.lg,
    },

    respectText: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.lg,
    },

    sgText: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.lg,
    },

    pardonText: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.lg,
    },

    // Link styles
    linkText: {
      color: theme.colors.underlayColor,
      textDecorationLine: "underline",
      fontSize: theme.typography.sizes.lg,
    },

    // Image styles
    logo: {
      marginVertical: theme.spacing.lg,
    },

    // Layout styles
    margin: {
      color: theme.colors.underlayColor,
      marginBottom: theme.spacing.md,
    },

    singleLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    leftContainer: {
      flex: 1,
    },

    // Footer styles
    footerText: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      color: theme.colors.primaryText,
      fontSize: theme.typography.sizes.lg,
    },

    underlayColor: {
      color: theme.colors.primary,
    },
    headerTitleStyle: {
      color: "#fff",
      fontWeight: theme.typography.weights.normal,
      fontSize: theme.typography.sizes.xl,
    },
    headerStyle: {
      backgroundColor: theme.colors.headerVariant,
      height: theme.components.header.height,
      paddingHorizontal: theme.components.header.paddingHorizontal,
    },
  };
}
