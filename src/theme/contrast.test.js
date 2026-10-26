import { neutral } from "./palette";
import { dark, light, ROLES } from "./semanticColors";

// Guards the contrast promises the token layer makes. If a colour is edited
// into non-compliance this fails, which is the whole point: the app previously
// shipped `colors.primary` (#113979) as text on a #121212 dark surface at
// 1.68:1 — a control the user literally could not see — and nothing caught it.
//
// Thresholds are WCAG 2.2 AA:
//   1.4.3 Contrast (Minimum) — 4.5:1 for body text
//   1.4.11 Non-text Contrast — 3:1 for UI component boundaries
// Disabled text is exempt from 1.4.3 and decorative dividers from 1.4.11, so
// `textDisabled` and `border` are deliberately not asserted as text/controls.

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

/** Relative luminance per WCAG 2.x, sRGB. */
const luminance = (hex) => {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const v = parseInt(clean.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Every ground a role might be drawn on, per theme. */
const SURFACES = ["background", "backgroundAlt", "surface", "surfaceElevated", "surfaceSelected"];

/** Roles that render as text and must clear 4.5:1 on every surface. */
const TEXT_ROLES = [
  "textPrimary",
  "textSecondary",
  "textBrand",
  "link",
  "accent",
  "error",
  "success",
  "gold",
];

/**
 * A DELIBERATE, CLIENT-CHOSEN EXCEPTION — not a rule being quietly relaxed.
 *
 * Dark mode's blue is #3B82F6, specified by the client. As TEXT it measures:
 *
 *   background / backgroundAlt   5.01:1   passes
 *   surface                      4.54:1   passes
 *   surfaceElevated              4.01:1   UNDER the 4.5 floor
 *   surfaceSelected              3.39:1   UNDER the 4.5 floor
 *
 * So blue TEXT on a sheet or on a selected row falls short. It still clears
 * 3:1, so it is fine for icons, borders and other non-text marks, and it is
 * fine as a FILL — near-black on it is 5.01:1, which is how every filled
 * control here is drawn.
 *
 * Listing the pairs explicitly means the rule still runs everywhere else, and
 * changing either surface re-triggers this review instead of silently making
 * it worse. #60A5FA — the same hue one step lighter — clears every surface
 * (4.91:1 at worst) if strict AA is wanted for blue text later.
 */
const KNOWN_BELOW_AA = new Set([
  "dark:textBrand:surfaceElevated",
  "dark:textBrand:surfaceSelected",
  "dark:link:surfaceElevated",
  "dark:link:surfaceSelected",
  "dark:accent:surfaceElevated",
  "dark:accent:surfaceSelected",
]);

/** Roles that outline an interactive control and must clear 3:1. */
const CONTROL_ROLES = ["borderStrong", "focusRing"];

describe("contrast — the sanity check the old theme did not have", () => {
  it("computes a known ratio correctly", () => {
    // Black on white is the textbook maximum.
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    // The defect this layer exists to prevent, kept as a regression marker.
    expect(contrast("#113979", "#121212")).toBeLessThan(2);
  });
});

describe.each([
  ["light", light],
  ["dark", dark],
])("theme: %s", (mode, t) => {
  it("defines every role", () => {
    const missing = ROLES.filter((r) => !t[r]);
    expect(missing).toEqual([]);
  });

  it.each(TEXT_ROLES)("%s clears 4.5:1 on every surface", (role) => {
    SURFACES.forEach((surface) => {
      const ratio = contrast(t[role], t[surface]);
      if (KNOWN_BELOW_AA.has(`${mode}:${role}:${surface}`)) {
        // Still has to clear the non-text floor — the exception is bounded.
        expect(ratio).toBeGreaterThanOrEqual(3);
        return;
      }
      // Reported this way so a failure names the exact pair and its ratio.
      expect({ mode, role, surface, ratio: Number(ratio.toFixed(2)) }).toEqual({
        mode,
        role,
        surface,
        ratio: expect.any(Number),
      });
      expect(ratio).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  it.each(CONTROL_ROLES)("%s clears 3:1 on every surface", (role) => {
    SURFACES.forEach((surface) => {
      expect(contrast(t[role], t[surface])).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });
  });

  // The delete button in the pothi sheets is an error FILL with its label on
  // top — a red button, not red text. Both halves have to hold: the label
  // against the fill, and the fill against the surface it sits on, or the
  // button loses its shape.
  it("keeps the destructive fill and its label visible on every surface", () => {
    expect(contrast(t.onErrorFill, t.errorFill)).toBeGreaterThanOrEqual(AA_TEXT);
    SURFACES.forEach((surface) => {
      expect({
        mode,
        surface,
        ratio: Number(contrast(t.errorFill, t[surface]).toFixed(2)),
      }).toEqual({ mode, surface, ratio: expect.any(Number) });
      expect(contrast(t.errorFill, t[surface])).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });
  });

  it("keeps text on a brand fill legible", () => {
    expect(contrast(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(t.textOnBrand, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("keeps a switch's OFF state readable", () => {
    // The OFF track is neutral and must separate from both the page and the
    // thumb — WCAG 1.4.11.
    expect(contrast(t.surface, t.controlTrackOff)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(t.controlTrackOff, t.background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it("keeps the switch's ON track matched to the navigation bar", () => {
    // Product decision: a switch that is on shows the SAME brand navy as the
    // bottom navigation, so the app presents one blue rather than two similar
    // ones. `primary` is deliberately identical in both themes for that
    // reason, which is why this asserts the match rather than a contrast
    // ratio — on the dark ground the navy is low-contrast by construction,
    // exactly as the nav bar already is.
    expect(t.primary).toBe(light.primary);
  });

  it("keeps content on an accent fill legible", () => {
    // A checked checkbox's tick, a badge label.
    //
    // Dark mode is the documented exception (see KNOWN_BELOW_AA above): the
    // client-chosen #3B82F6 carries WHITE, which measures 3.7:1 — over the 3:1
    // floor for icons and large labels, under the 4.5:1 for small text. Content
    // on a fill is near-black on paper at 5.0:1, but a solid blue button with
    // black text on it reads as broken rather than as considered.
    const floor = mode === "dark" ? AA_NON_TEXT : AA_TEXT;
    expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(floor);
  });

  it("keeps a destructive button's label legible on its fill", () => {
    // The light/dark flip this role exists for: white on a dark red in light
    // mode, near-black on a light red in dark mode.
    expect(contrast(t.onError, t.error)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("keeps status text legible on its own tinted surface", () => {
    expect(contrast(t.error, t.errorSurface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(t.success, t.successSurface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(t.gold, t.goldSurface)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe("dark theme specifics", () => {
  it("never uses pure black as a surface", () => {
    // Near-white text on #000 hits 21:1 and causes halation — the text appears
    // to shimmer, especially on OLED. Scrims may be black; surfaces may not.
    SURFACES.forEach((surface) => {
      expect(dark[surface]).not.toBe(neutral[1000]);
    });
  });

  it("separates each elevation step enough to be visible", () => {
    // Luminance ratios compress at the dark end, so the numbers are small by
    // nature; these are the floor at which the step still reads on the low-end
    // screens the app supports.
    const ladder = ["background", "surface", "surfaceElevated", "surfaceSelected"];
    ladder.slice(0, -1).forEach((step, i) => {
      expect(contrast(dark[step], dark[ladder[i + 1]])).toBeGreaterThan(1.09);
    });
  });

  it("does not reuse the brand navy as body text", () => {
    // The specific bug: navy is a fill colour in dark mode, never a text one.
    expect(dark.textBrand).not.toBe(dark.primary);
  });
});
