// Small colour helpers, so no call site has to hand-write a colour that a token
// already defines.
//
// These exist because of one specific failure: the Dashboard's activity heat
// map carried its own `isDark ? "85,141,231" : "17,57,121"` rgb pair, hand-typed
// beside the blue every other element on the same screen took from the theme.
// The two then drifted, and the heat cells ended up a visibly different blue to
// the ring around today. Deriving the ramp from the token makes that impossible.

/**
 * `"#113979"` -> `"17,57,121"`, ready to drop into an `rgba(...)` string.
 * Accepts 3- or 6-digit hex, with or without the leading `#`.
 *
 * Returns null for anything it cannot parse, so a caller can fall back rather
 * than render `rgba(NaN,NaN,NaN,0.5)` — which paints nothing and is invisible
 * to look at but very visible as a missing element.
 */
export const hexToRgb = (hex) => {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  /* eslint-disable no-bitwise */
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  /* eslint-enable no-bitwise */
};

/**
 * A token colour at partial strength, as an `rgba()` string.
 *
 * Prefer a real semantic role where one exists — this is for genuine ramps
 * (a heat map, a fading gradient) where a discrete token per step would be
 * inventing a dozen roles nobody names.
 */
export const withAlpha = (hex, alpha) => {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb},${alpha})` : "transparent";
};

/**
 * An OPAQUE blend of two hex colours: `t` of 0 returns `from`, 1 returns `to`.
 *
 * Different from `withAlpha`, and the difference matters. `withAlpha` produces a
 * translucent colour whose final appearance depends on whatever it lands on;
 * this produces a fixed colour that looks the same everywhere. Use it to derive
 * a step BETWEEN two tokens — a translation colour one notch down from the body
 * ink — where a translucent value would shift against a background image or a
 * highlight and stop being the step you designed.
 *
 * Returns `from` unchanged if either colour cannot be parsed, so a caller gets a
 * real colour rather than `rgba(NaN,…)`, which paints nothing.
 */
export const mix = (from, to, t) => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  if (!a || !b) return from;
  const ca = a.split(",").map(Number);
  const cb = b.split(",").map(Number);
  const channel = (i) => Math.round(ca[i] + (cb[i] - ca[i]) * t);
  const hex = [0, 1, 2].map((i) => channel(i).toString(16).padStart(2, "0")).join("");
  return `#${hex}`;
};

export default { hexToRgb, withAlpha, mix };

/**
 * Picks the variant of a value that belongs to the active theme.
 *
 * For things that legitimately differ by mode but are NOT colours the token
 * layer can hold — a screenshot shot against a dark UI, another company's icon
 * ground. Keeping them keyed by mode means the call site reads a lookup instead
 * of repeating `mode === "dark" ? … : …`, and a third theme later is a new key
 * rather than a new branch at every site.
 *
 * @param {{mode: string}} theme The active theme.
 * @param {Object} byMode `{ light, dark }`.
 * @param {*} [fallback] Used when the active mode has no entry.
 */
export const pickByMode = (theme, byMode, fallback = undefined) =>
  (byMode && byMode[theme.mode]) ?? fallback;
