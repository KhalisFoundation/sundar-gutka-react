// Centralized theme definitions for light and dark modes
// This module is additive and does not change existing color usage.
// Consumers can gradually adopt these themes alongside current styles.
import constant from "./constant";

// Shared design tokens that are mode-agnostic
const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

const typography = {
  // Font sizes
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
    massive: 32,
    // Legacy sizes for backward compatibility
    heading: 20,
    subheading: 18,
    body: 16,
    caption: 12,
  },
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  // Font weights
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  // Font families
  fonts: {
    gurbaniPrimary: constant.GURBANI_AKHAR_TRUE,
    gurbaniThick: constant.GURBANI_AKHAR_THICK_TRUE,
    arial: constant.Arial,
    // Additional fonts can be added as constants are defined
  },
};

// Component-specific spacing and sizing
const components = {
  header: {
    height: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
  card: {
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  list: {
    itemPadding: spacing.lg,
    itemMargin: spacing.sm,
    sectionHeaderPadding: spacing.md,
  },
  modal: {
    padding: spacing.xl,
    borderRadius: 16,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
};

const staticColors = {
  WHITE_COLOR: "#faf9f6", // used on Home Screen Header Ik ongkar and title
  NIGHT_BLACK: "#121212",
  NIGHT_OPACITY_BLACK: "rgba(0, 0, 0, 0.5)",
};

// Light and dark theme color palettes are derived from existing colors.
export const lightTheme = {
  mode: "light",
  colors: {
    primary: "#2a3381",
    surface: "#faf9f6",
    primaryText: "#121212",
    primaryVariant: "#DEBB0A",
    surfaceGrey: "#faf9f6",
    textDisabled: "#a3a3a3",
    underlayColor: "#009bff",
    headerVariant: "#003436",
    baniDB: "#eaa040",
    shadow: "#000",
    highlightTuk: "#0066ff",
    activeView: "#C7C7D7",
    inactiveView: "#e9e9ee",
    componentColor: "#232323",
    enabledText: "#0066ff",
    disabledText: "#a3a3a3",
  },
  staticColors,
  typography,
  spacing,
  components,
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  images: {
    khalisLogo: require("../../images/khalislogo150.png"),
    baniDBLogo: require("../../images/banidblogo.png"),
  },
};

export const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#141a3c",
    surface: "#121212",
    primaryText: "#faf9f6",
    primaryVariant: "#99852c",
    surfaceGrey: "#464646",
    textDisabled: "#faf9f6",
    underlayColor: "#009bff",
    headerVariant: "#003436",
    baniDB: "#eaa040",
    shadow: "#fff",
    highlightTuk: "#77baff",
    activeView: "#2d2d2d",
    inactiveView: "#232323",
    componentColor: "#fefefe",
    enabledText: "#2581df",
    disabledText: "#a3a3a3",
  },
  typography,
  spacing,
  components,
  staticColors,
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  images: {
    khalisLogo: require("../../images/khalislogo150white.png"),
    baniDBLogo: require("../../images/banidblogo.png"),
  },
};
