import borderRadius from "./borderRadius";
import components from "./components";
import { dark as darkElevation } from "./elevation";
import layout from "./layout";
import palette from "./palette";
import radii from "./radii";
import { dark as darkColors } from "./semanticColors";
import space from "./space";
import spacing from "./spacing";
import type from "./type";
import typography from "./typography";

const darkTheme = {
  mode: "dark",
  // ── The design system ──────────────────────────────────────────────────
  // `c` is the semantic colour layer — the only colour surface components read.
  c: darkColors,
  palette,
  space,
  radii,
  type,
  layout,
  elevation: darkElevation,

  // ── Native chrome ──────────────────────────────────────────────────────
  // Theme values that are not colours: platform enums whose correct setting is
  // decided by the theme. They live here so a component reads a token instead of
  // branching on the mode itself — the same rule as `c`, applied to the handful
  // of native props that take a keyword rather than a colour.
  chrome: {
    /** Status bar glyphs. Light glyphs on the dark ground. */
    statusBarStyle: "light-content",
    /** Native scroll indicator. */
    scrollIndicator: "white",
    /** BlurView tint, where a native blur is still used. */
    blurType: "dark",
  },
  // ── Opacity ────────────────────────────────────────────────────────────
  // Theme-dependent opacities. A decorative image needs to sit back further on a
  // dark ground, where the same value reads brighter against less light behind
  // it.
  opacity: {
    /** Decorative photograph behind a card. */
    backdropImage: 0.12,
  },
  typography,
  spacing,
  components,
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  images: {
    khalisLogo: require("../../images/khalislogo150white.png"),
    baniDBLogo: require("../../images/banidblogo.png"),
  },
  borderRadius,
};

export default darkTheme;
