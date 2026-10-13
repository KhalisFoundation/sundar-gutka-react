// Elevation presets. Theme-dependent, because the two modes express depth
// differently and a single shadow cannot do both.
//
// Light mode uses a real shadow. Dark mode does not: a black shadow on a
// near-black ground is invisible, so depth is carried by the surface lightness
// ladder in `semanticColors.js` (surface -> surfaceElevated) instead. The dark
// presets therefore zero the shadow out rather than drawing a shadow nobody can
// see and paying for the render.
//
// `elevation` (Android) and `shadow*` (iOS) are both set so the result matches
// on the two platforms. Android's elevation also draws its own ambient shadow,
// so the values are kept modest to stop cards looking heavier there.

const shadow = (opacity, radius, offsetY, androidElevation) => ({
  shadowColor: "#000000",
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: offsetY },
  elevation: androidElevation,
});

const none = {
  shadowColor: "transparent",
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
  elevation: 0,
};

const light = {
  none,
  /** Resting card on a screen ground. */
  card: shadow(0.06, 6, 2, 2),
  /** Raised control — floating button, pressed tile. */
  raised: shadow(0.1, 10, 4, 4),
  /** Bottom sheet or dialog above a scrim. */
  overlay: shadow(0.16, 20, 8, 12),
};

// Dark mode expresses all three through surface colour, not shadow.
const dark = { none, card: none, raised: none, overlay: none };

export { light, dark };
export default { light, dark };
