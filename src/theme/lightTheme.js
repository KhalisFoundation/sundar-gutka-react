import borderRadius from "./borderRadius";
import components from "./components";
import { light as lightElevation } from "./elevation";
import layout from "./layout";
import palette from "./palette";
import radii from "./radii";
import { light as lightColors } from "./semanticColors";
import space from "./space";
import spacing from "./spacing";
import type from "./type";
import typography from "./typography";

const lightTheme = {
  mode: "light",
  // ── The design system ──────────────────────────────────────────────────
  // `c` is the semantic colour layer — the only colour surface components read.
  c: lightColors,
  palette,
  space,
  radii,
  type,
  layout,
  elevation: lightElevation,

  // ── Native chrome ──────────────────────────────────────────────────────
  // Theme values that are not colours: platform enums whose correct setting is
  // decided by the theme. They live here so a component reads a token instead of
  // branching on the mode itself — the same rule as `c`, applied to the handful
  // of native props that take a keyword rather than a colour.
  chrome: {
    /** Status bar glyphs. Dark glyphs on the light ground. */
    statusBarStyle: "dark-content",
    /** Native scroll indicator. */
    scrollIndicator: "black",
    /** BlurView tint, where a native blur is still used. */
    blurType: "light",
  },
  // ── Opacity ────────────────────────────────────────────────────────────
  // Theme-dependent opacities. A decorative image needs to sit back further on a
  // dark ground, where the same value reads brighter against less light behind
  // it.
  opacity: {
    /** Decorative photograph behind a card. */
    backdropImage: 0.16,
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
    khalisLogo: require("../../images/khalislogo150.png"),
    baniDBLogo: require("../../images/banidblogo.png"),
  },
  borderRadius,
};

export default lightTheme;
