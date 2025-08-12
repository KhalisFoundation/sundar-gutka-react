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
};

const typography = {
  heading: 20,
  subheading: 18,
  body: 16,
  caption: 12,
  // Expose common font families used in the app for convenience
  fonts: {
    gurbaniPrimary: constant.GURBANI_AKHAR_TRUE,
    gurbaniThick: constant.GURBANI_AKHAR_THICK_TRUE,
    arial: constant.Arial,
  },
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
  },
  typography,
  spacing,
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
  },
  typography,
  spacing,
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
