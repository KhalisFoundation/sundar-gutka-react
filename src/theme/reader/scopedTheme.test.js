import { light as lightColors, dark as darkColors } from "@theme/semanticColors";
import { ALL_THEMES_BY_ID as READER_THEMES_BY_ID } from "./__fixtures__/allThemes";
import { AUDIO_ROLES } from "./bases/appBase";
import { buildScopedTheme } from "./useReaderScopedTheme";

// The seam that lets the audio player and the bottom navigation follow the
// reading theme WITHOUT any of their style rules changing. It is a role-name
// override merged over `theme.c` — the same mechanism screenPalettes.js uses to
// give the Dashboard and Seva their own values behind shared role names.
//
// setupTests replaces this module for component suites, which is right there and
// wrong here — this is the one suite that has to see the real implementation.
jest.unmock("@theme/reader/useReaderScopedTheme");

const appTheme = (mode) => ({
  mode,
  c: mode === "dark" ? darkColors : lightColors,
  space: { md: 12 },
});

describe("buildScopedTheme", () => {
  it("is the identity when the reading theme agrees with the app appearance", () => {
    // The load-bearing guarantee: "Follow app theme" is the default, so an
    // existing user must see the audio player and nav bar exactly as before.
    // Provable rather than hand-matched, because the light and dark reading
    // records take these values FROM the app palette in the first place.
    ["light", "dark"].forEach((mode) => {
      const app = appTheme(mode);
      const record = READER_THEMES_BY_ID[mode];
      ["audio", "nav"].forEach((group) => {
        const scoped = buildScopedTheme(app, record[group], record.base);
        expect(scoped.c).toEqual(app.c);
        expect(scoped.mode).toBe(mode);
      });
    });
  });

  it("hands a pinned Light theme the app's LIGHT values even in a dark app", () => {
    const scoped = buildScopedTheme(
      appTheme("dark"),
      READER_THEMES_BY_ID.light.audio,
      READER_THEMES_BY_ID.light.base
    );
    expect(scoped.c.surface).toBe(lightColors.surface);
    // `mode` follows the READING theme, so the handful of places that branch on
    // it — blur type, iOS indicator style — follow the page rather than the app.
    expect(scoped.mode).toBe("light");
  });

  it("overrides exactly the roles a designed theme declares, and nothing else", () => {
    const record = READER_THEMES_BY_ID.puratan;
    const app = appTheme("light");
    const scoped = buildScopedTheme(app, record.audio, record.base);

    AUDIO_ROLES.forEach((role) => expect(scoped.c[role]).toBe(record.audio[role]));
    // A failed download stays red on every theme.
    expect(scoped.c.error).toBe(app.c.error);
    // Untouched roles fall through to the app palette rather than vanishing.
    expect(scoped.c.onError).toBe(app.c.onError);
  });

  it("carries everything that is not a colour through unchanged", () => {
    // The brief was appearance only. Spacing, type and layout must be identical,
    // or this stops being a colour override and becomes a behaviour change.
    const record = READER_THEMES_BY_ID.blue;
    const app = appTheme("light");
    const scoped = buildScopedTheme(app, record.audio, record.base);
    expect(scoped.space).toBe(app.space);
  });

  it("gives the nav bar the theme's own pair, and inverts it for the active pill", () => {
    // The component already draws the active item as bar-colour-on-onPrimary, so
    // two roles cover both states. The bar comes from the theme's ground rather
    // than its accent — see the note in derive.js.
    const record = READER_THEMES_BY_ID.kesari;
    const app = appTheme("light");
    const scoped = buildScopedTheme(app, record.nav, record.base);
    expect(scoped.c.primary).toBe(record.nav.primary);
    expect(scoped.c.primary).not.toBe(app.c.primary);
    expect(scoped.c.onPrimary).toBe(record.palette.ground);
  });
});
