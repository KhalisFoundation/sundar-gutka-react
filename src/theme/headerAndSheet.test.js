import darkTheme from "@theme/darkTheme";
import lightTheme from "@theme/lightTheme";
import { navy, neutral } from "@theme/palette";

// Pins the two colour rules that kept drifting back, plus the contrast that
// makes them safe. Both are invisible to a rendering test — a wrong value still
// renders, it just renders wrong in one theme — so they are asserted directly.

/** WCAG relative luminance. */
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const ch = parseInt(hex.slice(i, i + 2), 16) / 255;
    return ch <= 0.03928 ? ch / 12.92 : ((ch + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("header foreground is one token, not a per-screen ternary", () => {
  it("is the nav bar's navy in light mode", () => {
    // The user-facing rule: a header label or icon matches the bottom nav.
    expect(lightTheme.c.headerFg).toBe(navy[800]);
    expect(lightTheme.c.headerFg).toBe(lightTheme.c.primary);
  });

  it("is white in dark mode, not a blue tint", () => {
    // A tinted blue on a near-black bar reads as a coloured state, not chrome.
    expect(darkTheme.c.headerFg).toBe(neutral[50]);
    expect(darkTheme.c.headerFg).not.toBe(darkTheme.c.textBrand);
  });

  it("clears 4.5:1 against the surfaces a header actually sits on", () => {
    // Header bars use `background` or `backgroundAlt` depending on the screen.
    [
      [lightTheme, "background"],
      [lightTheme, "backgroundAlt"],
      [darkTheme, "background"],
      [darkTheme, "backgroundAlt"],
    ].forEach(([t, ground]) => {
      expect(contrast(t.c.headerFg, t.c[ground])).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe("the Dashboard has exactly one blue", () => {
  it("light mode uses the nav bar's navy", () => {
    expect(lightTheme.c.textBrand).toBe(navy[800]);
  });

  it("dark mode does NOT fall back to navy on a near-black ground", () => {
    // navy[800] on the dark ground measures about 1.3:1 — the bug that made the
    // retry links and stat figures effectively invisible in dark mode.
    expect(darkTheme.c.textBrand).toBe("#3B82F6");
    expect(contrast(navy[800], darkTheme.c.backgroundAlt)).toBeLessThan(3);
  });

  it("reads as text and works as a fill in both themes", () => {
    [lightTheme, darkTheme].forEach((t) => {
      // As text on the page.
      expect(contrast(t.c.textBrand, t.c.surface)).toBeGreaterThanOrEqual(4.5);
    });
    // As a fill with `onAccent` on top — selected calendar days, chart bars.
    // Light carries white on navy comfortably; dark carries white on the
    // client-chosen blue at 3.7:1, which clears the 3:1 non-text floor and is
    // the documented exception in contrast.test.js.
    expect(contrast(lightTheme.c.onAccent, lightTheme.c.textBrand)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkTheme.c.onAccent, darkTheme.c.textBrand)).toBeGreaterThanOrEqual(3);
  });
});

describe("new fill roles are safe in both themes", () => {
  it("onGold reads on the gold fill (white measured ~2:1 and shipped that way)", () => {
    [lightTheme, darkTheme].forEach((t) => {
      expect(contrast(t.c.onGold, t.c.goldFill)).toBeGreaterThanOrEqual(4.5);
    });
    // The value that was there before, pinned as the counter-example.
    expect(contrast("#ffffff", lightTheme.c.goldFill)).toBeLessThan(3);
  });

  it("body text reads on both subtle fills", () => {
    [lightTheme, darkTheme].forEach((t) => {
      expect(contrast(t.c.textPrimary, t.c.fillSubtle)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.c.textPrimary, t.c.accentSubtle)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe("no theme is missing a role", () => {
  it("light and dark define exactly the same keys", () => {
    expect(Object.keys(lightTheme.c).sort()).toEqual(Object.keys(darkTheme.c).sort());
  });
});

describe("dark mode has ONE blue, and light mode is untouched", () => {
  const BLUE = "#3B82F6";

  it("every interactive and emphasis role in dark resolves to it", () => {
    // Four near-identical blues used to appear on one dark screen. Naming them
    // all here is what stops a fifth being introduced.
    ["controlAccent", "textBrand", "accent", "link", "focusRing"].forEach((role) => {
      expect(darkTheme.c[role]).toBe(BLUE);
    });
  });

  it("leaves the bottom navigation navy — it is chrome, not a control", () => {
    expect(darkTheme.c.primary).toBe(navy[800]);
    expect(darkTheme.c.primary).not.toBe(BLUE);
  });

  it("changes NOTHING in light mode", () => {
    // The brief was dark-only. A control there is the same navy it always was.
    expect(lightTheme.c.controlAccent).toBe(navy[800]);
    expect(lightTheme.c.controlAccent).toBe(lightTheme.c.primary);
    expect(lightTheme.c.onControlAccent).toBe(neutral[0]);
    [lightTheme.c.accent, lightTheme.c.link, lightTheme.c.textBrand].forEach((v) => {
      expect(v).not.toBe(BLUE);
    });
  });

  it("the blue reads as text on both dark grounds", () => {
    expect(contrast(BLUE, darkTheme.c.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(BLUE, darkTheme.c.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("puts WHITE on the blue, not black, and holds the 3:1 floor", () => {
    // A filled blue button with black content reads as a rendering fault, and
    // light mode has always been white on navy. White here measures 3.7:1 —
    // over the non-text floor, under AA for small text. Pinned so the pairing
    // cannot be flipped back by accident, and so the shortfall stays visible.
    expect(darkTheme.c.onControlAccent).toBe(neutral[0]);
    expect(darkTheme.c.onAccent).toBe(neutral[0]);
    expect(contrast(darkTheme.c.onControlAccent, BLUE)).toBeGreaterThanOrEqual(3);
    expect(contrast(darkTheme.c.onAccent, BLUE)).toBeGreaterThanOrEqual(3);
  });

  it("a filled control still separates from the page it sits on", () => {
    // The whole complaint: navy on near-black is 1.3:1, so a switch that was
    // ON barely differed from one that was off.
    expect(contrast(navy[800], darkTheme.c.background)).toBeLessThan(2);
    expect(contrast(BLUE, darkTheme.c.background)).toBeGreaterThan(4);
  });
});

// Gurmukhi titles must not carry a fixed lineHeight.
//
// This one cost a long chase. The Reader header showed "ਗੁਰ" for "ਗੁਰ ਮੰਤ੍ਰ" and
// "ਜਪੁਜੀ" for "ਜਪੁਜੀ ਸਾਹਿਬ". The string reaching the component was verified
// complete and correct on device — logged code point by code point — and the
// container measured 329dp wide with the text on a single 28dp line, so it was
// neither the data, the route, the field, nor the width.
//
// It was `lineHeight`. Rendering the identical string in a Text WITHOUT one drew
// it in full, side by side with the styled copy that truncated. Gurmukhi
// clusters carry marks above and below the baseline, and pinning the line box
// makes Android drop the clusters that do not fit rather than overflow them.
//
// The face's own line height is what it needs, so titles in Gurmukhi leave it
// unset. This is why `adjustsFontSizeToFit` is banned in this codebase too: both
// are attempts to force text into a box it does not fit.
describe("Gurmukhi title metrics", () => {
  const readerStyles = require("../ReaderScreen/styles").default;

  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("[%s] the Reader header title sets no lineHeight", (_name, theme) => {
    expect(readerStyles(theme).headerTitleStyle.lineHeight).toBeUndefined();
  });

  it("still sets a size, so the title is not left to a default", () => {
    expect(readerStyles(lightTheme).headerTitleStyle.fontSize).toBe(
      lightTheme.type.heading.fontSize
    );
  });
});

// A settings row is as thick as a bani row on the home list.
//
// The bani list pads by space.lg around a 24pt title (about 66pt tall at the
// default font); a settings row wraps a 16/24 body line and stopped at 56, so
// two otherwise-identical list screens sat at visibly different heights.
describe("list row thickness", () => {
  it("gives a single-line row room for the bani list's own height", () => {
    expect(lightTheme.layout.row.minHeight).toBeGreaterThanOrEqual(64);
  });

  it("keeps the two-line row a step above it", () => {
    expect(lightTheme.layout.row.minHeightTwoLine).toBeGreaterThan(
      lightTheme.layout.row.minHeight
    );
  });

  it("pads both row types by the same step the bani list uses", () => {
    expect(lightTheme.layout.row.paddingVertical).toBe(lightTheme.space.lg);
  });
});

// The header's trailing control needs a real gutter. At space.xs the Seva close
// cross sat almost against the right edge of the display.
describe("header gutter", () => {
  it("uses the screen gutter, not a hairline inset", () => {
    expect(lightTheme.layout.header.paddingHorizontal).toBe(lightTheme.space.lg);
  });
});
