// WCAG 2.1 relative-luminance contrast, used by the reading-theme guard test to
// keep every theme legible.
//
// Separate from `@theme/colorUtils`, which converts hex to rgb for the app's
// alpha ramps and nothing more. This one has to read the `rgba(...)` strings a
// theme produces AND composite them, so it carries its own parser.
//
// Dependency-free on purpose: the guard test must be able to load every theme
// record without React Native present.

/**
 * Accepts `#rgb`, `#rrggbb`, `#rrggbbaa`, and `rgb()` / `rgba()`.
 * Returns `[r, g, b]` (0-255), or null for anything unparseable.
 */
export const parseColor = (input) => {
  if (typeof input !== "string") return null;
  const value = input.trim();

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => parseFloat(p.trim()));
    if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null;
    return parts.slice(0, 3);
  }

  let hex = value.replace("#", "");
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6 && hex.length !== 8) return null;
  if (!/^[0-9a-f]+$/i.test(hex)) return null;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
};

/** Alpha channel, 0-1. Fully opaque when the colour carries none. */
export const parseAlpha = (input) => {
  if (typeof input !== "string") return 1;
  const value = input.trim();
  const rgbMatch = value.match(/^rgba\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => parseFloat(p.trim()));
    return parts.length >= 4 && !Number.isNaN(parts[3]) ? parts[3] : 1;
  }
  const hex = value.replace("#", "");
  if (hex.length === 8) return parseInt(hex.slice(6, 8), 16) / 255;
  if (hex.length === 4) return parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
  return 1;
};

/**
 * Composites a translucent colour over an opaque backdrop, returning what the
 * eye actually sees. Contrast maths is only meaningful on composited colours —
 * measuring a 10%-alpha highlight directly against the ink compares two colours
 * that never appear as drawn.
 */
export const flattenColor = (color, backdrop) => {
  const fg = parseColor(color);
  const bg = parseColor(backdrop);
  if (!fg || !bg) return color;
  const a = parseAlpha(color);
  if (a >= 1) return color;
  const mix = fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
  return `rgb(${mix.join(", ")})`;
};

export const relativeLuminance = (color) => {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const channel = v / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio (1-21), or null if either colour is unparseable. */
export const contrastRatio = (foreground, background) => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === null || l2 === null) return null;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/**
 * WCAG AA for body text. Every text role in every shipped reading theme has to
 * clear this against its own background — see readerTheme.test.js. This is what
 * stops a future theme shipping the STTM Desktop "Khalsa Gold" problem: white
 * on saturated saffron, 1.4:1, legible only because of a drop shadow.
 */
export const AA_CONTRAST = 4.5;

export default contrastRatio;
