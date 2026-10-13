// Turns the static design tokens into the values actually used at render time,
// given the device's screen width and the user's OS text-size setting.
//
// This is why the token files hold plain numbers: those numbers are the design
// INTENT at a reference device (a regular-width phone at system font scale 1).
// Nothing renders them directly. `useTokens()` runs them through here first, so
// a component never contains a hardcoded measurement and never needs to know
// what device it is on.
//
// ── What scales, and why it differs ────────────────────────────────────────
//
// TYPE does not scale here. React Native scales `fontSize` AND `lineHeight`
// itself when `allowFontScaling` is on, which is the platform-native path and
// the one screen readers and OS accessibility settings expect. Pre-scaling here
// as well would apply the user's setting twice. The `Text` primitive caps it
// with `maxFontSizeMultiplier` instead.
//
// SPACING scales at a damped rate. Padding that grows in full lockstep with
// text produces cavernous gaps at large font settings — the text gets bigger
// and the room to put it shrinks. Half the delta keeps the rhythm proportional
// without eating the screen.
//
// CONTAINER MINIMUMS scale at the full rate, because their whole job is to
// still contain the text after it grows.

/** The font scale range the layout is designed to absorb. */
export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.5;

/** Spacing moves at half the rate of text. */
const SPACE_DAMPING = 0.5;

/**
 * Width breakpoints in dp. `compact` is a small/old phone (the 320dp floor the
 * app supports), `expanded` is a tablet or an unfolded foldable.
 */
export const BREAKPOINTS = { compact: 0, regular: 360, expanded: 600 };

/** Gutters and spacing tighten on small screens and relax on large ones. */
const WIDTH_FACTOR = { compact: 0.875, regular: 1, expanded: 1.25 };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const breakpointFor = (width) => {
  if (width >= BREAKPOINTS.expanded) return "expanded";
  if (width >= BREAKPOINTS.regular) return "regular";
  return "compact";
};

/**
 * The multipliers for a given device state. Pure, so it is testable without
 * mounting anything.
 */
export const resolveScale = ({ width, fontScale }) => {
  const font = clamp(fontScale || 1, FONT_SCALE_MIN, FONT_SCALE_MAX);
  const breakpoint = breakpointFor(width || BREAKPOINTS.regular);
  return {
    breakpoint,
    /** Clamped OS text scale. Passed to Text as `maxFontSizeMultiplier`. */
    fontScale: font,
    /** Damped, width-adjusted multiplier for padding, margin and gaps. */
    space: (1 + (font - 1) * SPACE_DAMPING) * WIDTH_FACTOR[breakpoint],
    /** Full-rate multiplier for anything that must contain text. */
    container: font,
  };
};

/** Rounds to a whole pixel; RN accepts fractions but they blur borders. */
const px = (n) => Math.round(n);

/** Applies a multiplier across a flat map of numbers, leaving 0 alone. */
const scaleMap = (map, factor) =>
  Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, typeof v === "number" && v !== 0 ? px(v * factor) : v])
  );

/**
 * Recursively scales the layout tokens. Keys naming a text container grow at
 * the full container rate; everything else (paddings, gaps) at the damped
 * spacing rate. Radii and border widths never scale — a 1px hairline is 1px at
 * every font size, and a corner radius is a shape, not a measurement.
 *
 * `actionSize` never scales, for the same reason as `topClearance` below: it is
 * a fact about fingers, not about type. It wraps an ICON — a back arrow, a
 * delete bin — and an icon does not grow with the font, so there is nothing for
 * it to contain. Scaled at the container rate it turned a 48pt header button
 * into 72pt, and two of those took 144dp of a 320dp screen (a small phone at a
 * raised display size), starving the title column until "Manage Downloads"
 * clipped to "Manage Downlo…". Damping it instead is no good either: the width
 * factor then pulled it to 42pt on a compact screen, under the 44pt touch floor
 * `scale.test.js` rightly guards. A constant 48 satisfies both.
 *
 * `topClearance` never scales either, and for a different reason: it describes a
 * region of the DEVICE — the camera cutout and status bar strip — not a piece of
 * layout. Raising the text size must not push a header further down the screen,
 * and scaling it also made the same token resolve to two different numbers, as
 * the shared header reads it through `useTokens` (scaled) while the Reader's own
 * header reads the raw theme. That is exactly how the two drifted apart.
 */
const CONTAINER_KEYS = /^(minHeight|minHeightTwoLine|height|touchTarget|checkbox)$/;
const UNSCALED_KEYS =
  /^(maxHeightRatio|durationMs|borderWidth|hairline|thick|focus|topClearance|actionSize)$/;

export const scaleLayout = (layout, scale) => {
  const walk = (node) =>
    Object.fromEntries(
      Object.entries(node).map(([key, value]) => {
        if (UNSCALED_KEYS.test(key)) return [key, value];
        if (typeof value === "object" && value !== null) return [key, walk(value)];
        if (typeof value !== "number" || value === 0) return [key, value];
        const factor = CONTAINER_KEYS.test(key) ? scale.container : scale.space;
        return [key, px(value * factor)];
      })
    );
  return walk(layout);
};

/** The full resolved token set for a device state. */
export const resolveTokens = ({ space, layout, width, fontScale }) => {
  const scale = resolveScale({ width, fontScale });
  return {
    scale,
    space: scaleMap(space, scale.space),
    layout: scaleLayout(layout, scale),
  };
};

export default resolveTokens;
