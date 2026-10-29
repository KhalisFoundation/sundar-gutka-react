import { StyleSheet } from "react-native";
import { themeForScreen } from "@theme/screenPalettes";

const createStyles = (theme) => {
  // The Dashboard draws with its own colours through the shared role names, so
  // every c.x below is unchanged and only the values differ.
  const { c } = themeForScreen(theme, "dashboard");

  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      backgroundColor: c.surface,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 20,
    },
    sectionSpacer: {
      height: 8,
      backgroundColor: c.surface,
    },
    floatingHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    floatingStrip: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 9,
    },
  });
};

export default createStyles;
