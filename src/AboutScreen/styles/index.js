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
      margin: 10,
    },

    // Text styles
    titleText: {
      color: theme.colors.primaryText,
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
    },

    createByText: {
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },

    welcomeText: {
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },

    helpText: {
      color: theme.colors.primaryText,
      marginVertical: 8,
      lineHeight: 20,
    },

    respectText: {
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },

    sgText: {
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },

    pardonText: {
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },

    // Link styles
    linkText: {
      color: theme.colors.underlayColor,
      textDecorationLine: "underline",
    },

    // Image styles
    logo: {
      marginVertical: 15,
    },

    // Layout styles
    margin: {
      color: theme.colors.underlayColor,
      marginBottom: 10,
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
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },

    underlayColor: {
      color: theme.colors.primary,
    },
    headerTitleStyle: { color: "#fff", fontWeight: "normal", fontSize: 18 },
    headerStyle: { backgroundColor: theme.colors.headerVariant },
  };
}
