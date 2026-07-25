import { StyleSheet } from "react-native";

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    header: {
      backgroundColor: theme.colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.staticColors.WHITE_COLOR,
      flex: 1,
      textAlign: "center",
    },
    headerSpacer: {
      width: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.textSecondary,
    },
  });

export default createStyles;
