import {
  ALL_THEMES as READER_THEMES,
  ALL_THEMES_BY_ID as READER_THEMES_BY_ID,
} from "@theme/reader/__fixtures__/allThemes";
import { APP_ROLES_FIXED } from "@theme/reader/bases/appBase";
import { appearanceFor } from "@theme/reader/resolve";
import { rolesFor } from "@theme/screenPalettes";
import { light as lightColors, dark as darkColors } from "@theme/semanticColors";
import constant from "../constant";

// What ThemeProvider hands the app, reproduced here as pure data.
//
// The provider itself is four lines of branching around this, and mounting it
// needs Appearance, redux and the whole context tree; the decision it makes is
// worth asserting on its own.

const resolveC = (themeMode, systemIsDark = false) => {
  const paired = appearanceFor(themeMode, READER_THEMES_BY_ID);
  if (paired) {
    const base = paired === "dark" ? darkColors : lightColors;
    return { ...base, ...READER_THEMES_BY_ID[themeMode].app };
  }
  if (themeMode === constant.Light) return lightColors;
  if (themeMode === constant.Dark) return darkColors;
  // Default, and anything the registry cannot resolve.
  return systemIsDark ? darkColors : lightColors;
};

describe("what the app resolves to", () => {
  it("leaves Default, Light and Dark exactly as they are", () => {
    // The whole feature rests on this. An installed user who never opens the
    // picker must get the same colour layer, object for object.
    expect(resolveC(constant.Default, false)).toEqual(lightColors);
    expect(resolveC(constant.Default, true)).toEqual(darkColors);
    expect(resolveC(constant.Light)).toEqual(lightColors);
    expect(resolveC(constant.Dark)).toEqual(darkColors);
  });

  it("follows the system for a theme the registry no longer knows", () => {
    // What a theme withdrawn by the backend leaves behind for the moment
    // before the setting is healed. Falling through to light instead would put
    // someone who was reading in a withdrawn dark theme into a white app.
    expect(resolveC("withdrawn-theme", true)).toEqual(darkColors);
    expect(resolveC("withdrawn-theme", false)).toEqual(lightColors);
  });

  it("recolours the app for a designed theme", () => {
    const c = resolveC("puratan");
    const p = READER_THEMES_BY_ID.puratan;
    expect(c.background).toBe(p.palette.ground);
    expect(c.textPrimary).toBe(p.palette.ink);
    expect(c.textBrand).toBe(p.palette.accent);
    expect(c.border).toBe(p.palette.rule);
    // Not the app's own values any more.
    expect(c.background).not.toBe(lightColors.background);
    expect(c.primary).not.toBe(lightColors.primary);
  });

  it("keeps the meaningful colours whatever the theme", () => {
    READER_THEMES.forEach((theme) => {
      const c = resolveC(theme.id);
      const base = theme.base === "dark" ? darkColors : lightColors;
      APP_ROLES_FIXED.forEach((role) => expect(c[role]).toBe(base[role]));
    });
  });

  it("pairs each designed theme with the right appearance underneath", () => {
    expect(appearanceFor("blue", READER_THEMES_BY_ID)).toBe("dark");
    expect(appearanceFor("puratan", READER_THEMES_BY_ID)).toBe("light");
    // The fixed roles a Blue user sees are the DARK ones, not the light ones.
    expect(resolveC("blue").scrim).toBe(darkColors.scrim);
    expect(resolveC("puratan").scrim).toBe(lightColors.scrim);
  });
});

// Dashboard, Seva and Settings each override a dozen roles. Applied on top of a
// designed theme they would paint the app's navy back over it — so the two
// screens people use most would be the only ones the theme never reached.
describe("per-screen palettes yield to a designed theme", () => {
  const SCREENS = ["dashboard", "seva", "settings", "settingsSheet"];

  it("still override under Light and Dark", () => {
    // Unchanged behaviour — the palettes exist for a reason and keep working.
    expect(Object.keys(rolesFor("dashboard", "light")).length).toBeGreaterThan(0);
    expect(Object.keys(rolesFor("seva", "dark")).length).toBeGreaterThan(0);
  });

  it("would otherwise overwrite the theme on every screen that has one", () => {
    // The failure this guards against, stated as the arithmetic: each screen
    // overrides roles the theme also sets, so last-write-wins would lose.
    const themed = resolveC("puratan");
    SCREENS.forEach((screen) => {
      const overrides = rolesFor(screen, "light");
      const clashes = Object.keys(overrides).filter(
        (role) => themed[role] !== undefined && overrides[role] !== themed[role]
      );
      if (Object.keys(overrides).length > 0) expect(clashes.length).toBeGreaterThan(0);
    });
  });
});
