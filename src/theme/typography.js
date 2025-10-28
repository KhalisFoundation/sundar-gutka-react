import { constant } from "@common";

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
    balooPaaji: constant.BALOO_PAAJI,
    balooPaajiSemiBold: constant.BALOO_PAAJI_SEMI_BOLD,
    // Additional fonts can be added as constants are defined
  },
};

export default typography;
