import { StyleSheet } from "react-native";
import { themeForScreen } from "@theme/screenPalettes";
import createStyles from "./styles";

// Monthly / One Time, in every theme the app can be in.
//
// The control draws with FIVE role lookups — the panel, its hairline, the
// chosen accent, the muted ink for the one not chosen, and the shadow. Every
// one is a role Seva already maps, so a designed theme re-derives all of them;
// none is a literal that would keep the app's navy on a parchment page.
//
// What is actually asserted is the thing that was wrong: both radios were drawn
// in `c.accent`, so the chosen frequency looked exactly like the other one.

const themeFor = (mode, designedTheme = false) => ({
  mode,
  designedTheme,
  typography: { fonts: { balooPaaji: "BalooPaaji2-Regular", balooPaajiSemiBold: "SemiBold" } },
  // Only present on a designed theme; `themeForScreen` reads it in that branch.
  c: designedTheme
    ? {
        background: "#F3E9D2",
        // Seva's page ground. A designed theme derives it like any other role;
        // the fake needs it because the screen reads `backgroundAlt`, not
        // `background`.
        backgroundAlt: "#F3E9D2",
        surface: "#EADFC4",
        surfaceElevated: "#EADFC4",
        textPrimary: "#2B2116",
        textSecondary: "#6B5B45",
        border: "#C9B892",
        borderStrong: "#A89468",
        accent: "#8A5A2B",
        onAccent: "#FFF8EC",
        shadow: "#000000",
        fillSubtle: "#E1D4B4",
        accentSubtle: "#DCC9A4",
        primary: "#8A5A2B",
        link: "#8A5A2B",
      }
    : undefined,
});

/** StyleSheet.create returns ids in RN; resolve one back to its object. */
const flatten = (style) => StyleSheet.flatten(style);

/** The resolved role map the stylesheet itself draws from. */
const rolesFor = (theme) => themeForScreen(theme, "seva").c;

const THEMES = [
  ["light", themeFor("light")],
  ["dark", themeFor("dark")],
  ["a designed theme, light-based", themeFor("light", true)],
  ["a designed theme, dark-based", themeFor("dark", true)],
];

describe.each(THEMES)("the frequency control on %s", (_name, theme) => {
  const c = rolesFor(theme);
  const styles = createStyles(theme);
  const flat = (id) => flatten(styles[id]);

  it("tells the chosen frequency apart from the other one", () => {
    // The bug: one accent for both rings. Colour AND weight now separate them,
    // so it does not rest on colour alone either.
    expect(flat("radioRingOn").borderColor).not.toBe(flat("radioRingOff").borderColor);
    expect(flat("frequencyTextOn").color).not.toBe(flat("frequencyText").color);
    expect(flat("frequencyTextOn").fontFamily).not.toBe(flat("frequencyText").fontFamily);
  });

  it("takes every colour from a role, so the theme reaches it", () => {
    expect(flat("frequencyContainer").borderColor).toBe(c.border);
    expect(flat("frequencyDivider").backgroundColor).toBe(c.border);
    expect(flat("radioRingOn").borderColor).toBe(c.accent);
    expect(flat("radioDot").backgroundColor).toBe(c.accent);
    expect(flat("radioRingOff").borderColor).toBe(c.textSecondary);
    expect(flat("frequencyTextOn").color).toBe(c.accent);
  });

  it("is carried entirely by its edge, with nothing else drawing it", () => {
    // No fill, no shadow, no elevation. The hairline is the ONLY thing that
    // draws the control, which makes it load-bearing rather than decoration —
    // and it has to hold in every theme, since there is no second cue.
    const box = flat("frequencyContainer");
    expect(box.borderWidth).toBeGreaterThan(0);
    expect(box.borderColor).toBeTruthy();
    expect(box.backgroundColor).toBeUndefined();
    expect(box.shadowOpacity).toBeUndefined();
    expect(box.shadowRadius).toBeUndefined();
    expect(box.elevation).toBeUndefined();
  });

  it("draws the amount box the same way, flat and bordered", () => {
    // The two sit one above the other; one filled or shadowed and the other not
    // would read as a mistake rather than a pair.
    const box = flat("amountCard");
    expect(box.borderWidth).toBeGreaterThan(0);
    expect(box.borderColor).toBe(c.border);
    expect(box.backgroundColor).toBeUndefined();
    expect(box.shadowOpacity).toBeUndefined();
    expect(box.elevation).toBeUndefined();
  });

  it("keeps the amount box a FIXED width, unlike the frequency one", () => {
    // Deliberately not content-sized: the box grew and shrank on every
    // keystroke, so the figure being typed moved as it was typed. The two boxes
    // differ here on purpose — the frequency labels never change while you look
    // at them, and an amount does.
    expect(flat("amountCard").width).toBe("100%");
    expect(flat("amountCard").alignSelf).toBeUndefined();
    expect(flat("frequencyContainer").width).toBeUndefined();
  });

  it("is drawn to fit its labels, not the screen", () => {
    // A box the width of the page around two short words is a slab, not a
    // control. `maxWidth` is the only cap, for the long translations.
    const box = flat("frequencyContainer");
    expect(box.width).toBeUndefined();
    expect(box.alignSelf).toBe("center");
    expect(box.maxWidth).toBe("100%");
    // Halves size to their own label rather than claiming an equal share.
    expect(flat("frequencyOption").flex).toBeUndefined();
  });

  it("is a circle, and sized to its content", () => {
    const ring = flat("radioRing");
    expect(ring.borderRadius).toBe(ring.width / 2);
    expect(ring.width).toBe(ring.height);
    // No fixed height anywhere: a long translation or a raised OS text size
    // grows the row instead of being clipped.
    expect(flat("frequencyOption").height).toBeUndefined();
    expect(flat("frequencyContainer").height).toBeUndefined();
    expect(flat("frequencyOption").minHeight).toBeGreaterThanOrEqual(44);
  });
});
