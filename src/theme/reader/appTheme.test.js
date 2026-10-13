import { ROLES, light as lightColors, dark as darkColors } from "@theme/semanticColors";
import { APP_ROLES, APP_ROLES_FIXED } from "./bases/appBase";
import { contrastRatio, AA_CONTRAST } from "./contrast";
import { READER_THEMES, READER_THEMES_BY_ID } from "./themes";

// A designed theme recolours the WHOLE app, through an `app` group merged over
// `theme.c` in ThemeProvider. These are the invariants that keeps honest.

const designed = READER_THEMES.filter((t) => t.id !== "light" && t.id !== "dark");

describe("app role coverage", () => {
  it("accounts for every semantic role, as themed or as deliberately fixed", () => {
    // A role in neither list is one nobody decided about — it would silently
    // keep the app's own colour on a themed screen and look like a leak.
    const covered = new Set([...APP_ROLES, ...APP_ROLES_FIXED]);
    expect(ROLES.filter((role) => !covered.has(role))).toEqual([]);
  });

  it("never lists a role as both themed and fixed", () => {
    expect(APP_ROLES.filter((role) => APP_ROLES_FIXED.includes(role))).toEqual([]);
  });

  it("keeps the colours that carry meaning out of a theme's hands", () => {
    // Red means failed, green means done, gold means a streak, and the vishraam
    // mark means a pause. Recolour those per theme and the colour stops being
    // information. Checked explicitly rather than left to the list's contents.
    ["error", "success", "gold", "goldFill", "vishraamShort", "scrim", "shadow"].forEach((role) =>
      expect(APP_ROLES_FIXED).toContain(role)
    );
  });

  it("supplies every themed role on every designed theme", () => {
    designed.forEach((theme) => {
      APP_ROLES.forEach((role) => expect(typeof theme.app[role]).toBe("string"));
    });
  });

  it("leaves the fixed roles out of the group entirely", () => {
    // Present-but-equal would still overwrite, and would go stale the moment
    // the app palette retuned its red. Absent means the app's own value wins.
    READER_THEMES.forEach((theme) => {
      APP_ROLES_FIXED.forEach((role) => expect(theme.app[role]).toBeUndefined());
    });
  });
});

// The same guarantee the Reader has, extended app-wide: Light, Dark and Default
// must resolve a `c` map identical to the one the app already ships.
describe("Light and Dark are untouched app-wide", () => {
  [
    ["light", lightColors],
    ["dark", darkColors],
  ].forEach(([id, c]) => {
    it(`${id}: the app group is the palette handed straight back`, () => {
      APP_ROLES.forEach((role) => expect(READER_THEMES_BY_ID[id].app[role]).toBe(c[role]));
    });

    it(`${id}: merging it over c is a no-op`, () => {
      expect({ ...c, ...READER_THEMES_BY_ID[id].app }).toEqual(c);
    });
  });
});

describe("designed themes are readable app-wide", () => {
  designed.forEach((theme) => {
    const a = theme.app;

    it(`${theme.id}: body and secondary text on both grounds`, () => {
      [a.background, a.surface, a.surfaceElevated].forEach((ground) => {
        expect(contrastRatio(a.textPrimary, ground)).toBeGreaterThanOrEqual(AA_CONTRAST);
        expect(contrastRatio(a.textSecondary, ground)).toBeGreaterThanOrEqual(AA_CONTRAST);
      });
    });

    it(`${theme.id}: brand text and links on the page`, () => {
      expect(contrastRatio(a.textBrand, a.background)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(a.link, a.surface)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(a.headerFg, a.background)).toBeGreaterThanOrEqual(AA_CONTRAST);
    });

    it(`${theme.id}: text on every filled block`, () => {
      // The tab bar, filled buttons, selected chips.
      expect(contrastRatio(a.onPrimary, a.primary)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(a.textOnBrand, a.primary)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(a.onAccent, a.accent)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(a.onControlAccent, a.controlAccent)).toBeGreaterThanOrEqual(AA_CONTRAST);
    });

    it(`${theme.id}: controls and interactive outlines clear 3:1`, () => {
      expect(contrastRatio(a.controlAccent, a.surface)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(a.controlTrackOff, a.surface)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(a.borderStrong, a.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(a.focusRing, a.background)).toBeGreaterThanOrEqual(3);
    });

    it(`${theme.id}: cards separate from the page`, () => {
      expect(contrastRatio(a.surface, a.background)).toBeGreaterThanOrEqual(1.09);
      expect(contrastRatio(a.surfaceElevated, a.background)).toBeGreaterThan(
        contrastRatio(a.surface, a.background)
      );
    });

    it(`${theme.id}: the app and the Reader agree on the page and the ink`, () => {
      // Both come from the same primitives, so a screen next to the Reader can
      // never sit on a different ground.
      expect(a.background).toBe(theme.background.color);
      expect(a.textPrimary).toBe(theme.text.gurbani.color);
      expect(a.primary).toBe(theme.nav.primary);
    });
  });
});
