import darkTheme from "../../theme/darkTheme";
import lightTheme from "../../theme/lightTheme";

// The dashboard calendars draw their month/year arrows on the card surface.
// Those arrows are controls, so WCAG 1.4.11 asks for 3:1 against their
// background — they were previously drawn in a muted *text* colour that only
// reached 2.4:1 on the light card and read as broken rather than tappable.

const AA_NON_TEXT = 3;

const toRgb = (color) => {
  if (color.startsWith("rgb")) {
    const parts = color.match(/[\d.]+/g);
    return parts.slice(0, 3).map(Number);
  }
  const s = color.replace("#", "");
  const expand = (c) => c + c;
  const full = s.length === 3 ? s.split("").map(expand).join("") : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (fg, bg) => {
  const a = luminance(toRgb(fg));
  const b = luminance(toRgb(bg));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// Mirrors useDashboardTheme's cardBg: the surface the arrows are drawn on.
const cardBg = { light: lightTheme.c.surface, dark: darkTheme.c.surfaceSelected };

describe("dashboard calendar controls", () => {
  it("draws light-mode arrows with enough contrast on the card", () => {
    expect(contrastRatio(lightTheme.c.textPrimary, cardBg.light)).toBeGreaterThanOrEqual(
      AA_NON_TEXT
    );
  });

  it("draws dark-mode arrows with enough contrast on the card", () => {
    expect(contrastRatio(darkTheme.c.textPrimary, cardBg.dark)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it("keeps the muted text colour out of the arrows in light mode", () => {
    // Guard against reverting to mutedText: it does NOT clear the bar, which is
    // the whole reason the arrows moved to primaryText.
    const mutedLight = "#97a9c7";
    expect(contrastRatio(mutedLight, cardBg.light)).toBeLessThan(AA_NON_TEXT);
  });

  it("sanity-checks the contrast helper against known pairs", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
});
