import { mix } from "@theme/colorUtils";
import { screenPalettes, paletteFor, rolesFor, themeForScreen } from "@theme/screenPalettes";
import { dark as darkColors, light as lightColors } from "@theme/semanticColors";
import {
  ALL_THEMES as READER_THEMES,
  ALL_THEMES_BY_ID as READER_THEMES_BY_ID,
} from "./__fixtures__/allThemes";
import { contrastRatio } from "./contrast";
import {
  ACCENT_WASH_ALPHA,
  alphaOf,
  designedRolesFor,
  groupFor,
  themedScreenPalette,
} from "./screenPalette";

// Dashboard and Seva do not colour themselves from semantic roles. They read
// ~80 one-off keys through paletteFor(), which is keyed by light/dark and
// cannot see a theme — so overriding theme.c reached neither screen and both
// stayed navy under Puratan. These hold the re-derivation honest.

const ALL_KEYS = Object.entries(screenPalettes).flatMap(([screen, byMode]) =>
  Object.keys(byMode.light).map((key) => [screen, key])
);

/** The user-selectable reading themes — everything except stock Light and Dark. */
const DESIGNED = READER_THEMES.filter((t) => t.id !== "light" && t.id !== "dark");

const translucent = (v) => (alphaOf(v) ?? 1) < 1;

describe("every screen-palette key is classified", () => {
  it("leaves none unmapped", () => {
    // The important one. A key nobody classified keeps the app's own colour,
    // which on a themed screen shows up as a stray navy card — exactly the
    // failure this whole file exists to prevent. Adding a key to
    // screenPalettes.js without classifying it fails here.
    const unmapped = ALL_KEYS.filter(([, key]) => groupFor(key) === null);
    expect(unmapped.map(([s, k]) => `${s}.${k}`)).toEqual([]);
  });

  it("covers all five screens", () => {
    expect(Object.keys(screenPalettes).sort()).toEqual([
      "baniList",
      "dashboard",
      "settings",
      "settingsSheet",
      "seva",
    ]);
  });
});

describe("themedScreenPalette", () => {
  const c = READER_THEMES_BY_ID.puratan.app;

  it("keeps the key set exactly — screens read by key", () => {
    Object.values(screenPalettes).forEach((byMode) => {
      expect(Object.keys(themedScreenPalette(byMode.light, c)).sort()).toEqual(
        Object.keys(byMode.light).sort()
      );
    });
  });

  it("maps grounds, ink, accents and rules onto the theme", () => {
    const d = themedScreenPalette(screenPalettes.dashboard.light, c);
    expect(d.screenBg).toBe(c.background);
    expect(d.cardBg).toBe(c.surface);
    expect(d.sectionBg).toBe(c.surface);
    expect(d.primaryText).toBe(c.textPrimary);
    expect(d.mutedText).toBe(c.textSecondary);
    expect(d.brandText).toBe(c.accent);
    expect(d.separator).toBe(c.border);
  });

  // Whether a value is see-through is part of what the key MEANS, and both of
  // the calendar's rendering bugs were this invariant broken in opposite
  // directions: `sectionBg` is an opaque ground (the day-detail sheet) mapped
  // to a translucent fill, so the sheet composited onto the scrim and its dark
  // ink went dark-on-dark; `todayFill` is a faint disc behind a solid-accent
  // date mapped to the solid accent, so the number vanished into its circle.
  it("keeps opaque grounds opaque and translucent washes translucent", () => {
    const broken = Object.entries(screenPalettes).flatMap(([screen, byMode]) => {
      const themed = themedScreenPalette(byMode.light, c);
      return Object.keys(byMode.light)
        .filter((key) => {
          const group = groupFor(key);
          // Only the keys that are a plain colour in BOTH stock modes carry an
          // opacity contract. `switchOffTrack` is null in light, `heatRgb` is a
          // bare triple, `meansTints` a map.
          if (group === "passthrough" || group === "rgbTriple" || group === "hueMap") return false;
          const [l, d] = [byMode.light[key], byMode.dark?.[key]];
          if (typeof l !== "string" || typeof d !== "string") return false;
          if (translucent(l) !== translucent(d)) return false;
          return translucent(themed[key]) !== translucent(l);
        })
        .map((key) => `${screen}.${key}`);
    });
    expect(broken).toEqual([]);
  });

  it("leaves today's date legible against its own disc", () => {
    // The disc behind today is a TINT of the accent; the number on it is the
    // solid accent. Mapped to the solid accent the disc became the number's own
    // colour and the date vanished, leaving just a filled circle.
    DESIGNED.forEach((theme) => {
      const { todayFill } = themedScreenPalette(screenPalettes.dashboard.light, theme.app);
      expect([theme.id, translucent(todayFill)]).toEqual([theme.id, true]);
      // The disc composites onto the calendar card, so measure what is actually
      // behind the numeral rather than the card alone.
      const disc = mix(theme.app.surface, theme.app.accent, ACCENT_WASH_ALPHA);
      const ratio = contrastRatio(theme.app.textBrand, disc);
      expect([theme.id, ratio >= 4.5]).toEqual([theme.id, true]);
    });
  });

  it("leaves the day-detail sheet opaque and its text readable", () => {
    // The sheet is `sectionBg` over a scrim. As a translucent fill it took the
    // scrim's darkness while its ink stayed dark, so the whole sheet came up
    // blank on every designed theme.
    DESIGNED.forEach((theme) => {
      const { sectionBg, dayIconBg } = themedScreenPalette(
        screenPalettes.dashboard.light,
        theme.app
      );
      expect([theme.id, translucent(sectionBg)]).toEqual([theme.id, false]);
      // The date, the activity titles, and the durations beneath them.
      [theme.app.textPrimary, theme.app.textSecondary].forEach((ink) =>
        expect([theme.id, contrastRatio(ink, sectionBg) >= 4.5]).toEqual([theme.id, true])
      );
      // The icon plate is a wash ON the sheet; its icon must still read.
      const plate = mix(sectionBg, theme.app.textPrimary, alphaOf(dayIconBg) ?? 0);
      expect([theme.id, contrastRatio(theme.app.textBrand, plate) >= 3]).toEqual([theme.id, true]);
    });
  });

  it("leaves the non-colour keys alone", () => {
    // A number and a shadow. Running these through a colour mapper would
    // produce a hex where the caller expects an opacity.
    const base = screenPalettes.dashboard.light;
    const d = themedScreenPalette(base, c);
    expect(d.backdropOpacity).toBe(base.backdropOpacity);
    expect(d.appTileShadow).toBe(base.appTileShadow);
  });

  it("gives Seva's category icons one style per theme", () => {
    // "Seva by other means" tints four categories — social, coding, QA, other —
    // colouring both the icon and the disc behind it. Under a designed theme
    // they share ONE accent, so a parchment page does not carry a violet, a
    // cyan, a green and an amber. The key set survives: the screen looks each
    // category up by name and falls back to `other`.
    const base = screenPalettes.seva.light.meansTints;
    const tints = themedScreenPalette(screenPalettes.seva.light, c).meansTints;

    expect(Object.keys(tints).sort()).toEqual(Object.keys(base).sort());
    Object.keys(base).forEach((k) => expect(tints[k]).not.toBe(base[k]));
    expect(new Set(Object.values(tints)).size).toBe(1);
  });

  it("keeps a hex for the category tint — the disc appends an alpha pair", () => {
    // SevaScreen builds the disc as `${meansTint}22`. An rgba() here would
    // concatenate into nonsense and the disc would render nothing.
    DESIGNED.forEach((theme) => {
      const { meansTints } = themedScreenPalette(screenPalettes.seva.light, theme.app);
      Object.entries(meansTints).forEach(([name, tint]) =>
        expect([theme.id, name, /^#[0-9a-f]{6}$/i.test(tint)]).toEqual([theme.id, name, true])
      );
    });
  });

  it("keeps every category hue legible on the card it sits on", () => {
    READER_THEMES.filter((t) => t.id !== "light" && t.id !== "dark").forEach((theme) => {
      const tints = themedScreenPalette(screenPalettes.seva.light, theme.app).meansTints;
      Object.entries(tints).forEach(([name, hue]) => {
        // 3:1 — WCAG's floor for a meaningful non-text mark.
        expect([name, contrastRatio(hue, theme.app.surface) >= 3]).toEqual([name, true]);
      });
    });
  });

  it("keeps the heat ramp an r,g,b triple, from the theme's accent", () => {
    // The calendar splices this into rgba(); a hex would render nothing.
    const { heatRgb } = themedScreenPalette(screenPalettes.dashboard.light, c);
    expect(heatRgb).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/);
    expect(heatRgb).not.toBe(screenPalettes.dashboard.light.heatRgb);
  });
});

describe("paletteFor", () => {
  it("takes a bare mode exactly as before", () => {
    expect(paletteFor("dashboard", "light")).toEqual(screenPalettes.dashboard.light);
    expect(paletteFor("seva", "dark")).toEqual(screenPalettes.seva.dark);
  });

  it("takes a theme, and leaves Light and Dark untouched", () => {
    // No designedTheme means no re-derivation, whichever form the caller used.
    const appTheme = { mode: "light", c: lightColors };
    expect(paletteFor("dashboard", appTheme)).toEqual(screenPalettes.dashboard.light);
    expect(paletteFor("baniList", appTheme)).toEqual(screenPalettes.baniList.light);
  });

  it("re-derives for a designed theme", () => {
    const { puratan } = READER_THEMES_BY_ID;
    const themed = paletteFor("dashboard", {
      mode: "light",
      c: puratan.app,
      designedTheme: "puratan",
    });
    expect(themed.screenBg).toBe(puratan.palette.ground);
    expect(themed.cardBg).not.toBe(screenPalettes.dashboard.light.cardBg);
  });

  it("flattens Seva's extra card rung under a designed theme only", () => {
    // Seva's cards sit on `surfaceElevated`, one rung above `surface`. A
    // designed theme derives the whole ladder from one ground, so the rungs
    // land within a few percent and the screen reads as stacked mud. Collapsed
    // to a single card colour + hairline, the way Settings does it.
    DESIGNED.forEach((theme) => {
      const t = { mode: theme.base, c: theme.app, designedTheme: theme.id };
      expect([theme.id, themeForScreen(t, "seva").c.surfaceElevated]).toEqual([
        theme.id,
        theme.app.surface,
      ]);
      // Scoped to Seva — no other screen is touched.
      expect([theme.id, themeForScreen(t, "dashboard")]).toEqual([theme.id, t]);
    });
  });

  it("leaves Light and Dark's screen roles exactly as they were", () => {
    // The flattening above must never reach the two stock themes. They still go
    // through rolesFor(), which is the only path they have ever taken.
    ["light", "dark"].forEach((mode) => {
      const t = { mode, c: mode === "dark" ? darkColors : lightColors };
      Object.keys(screenPalettes).forEach((screen) => {
        expect([mode, screen, themeForScreen(t, screen).c]).toEqual([
          mode,
          screen,
          { ...t.c, ...rolesFor(screen, mode) },
        ]);
      });
    });
  });

  it("gives every theme a call-to-action that is visible on the sheet it sits on", () => {
    // `primary` is the nav bar's colour, and a designed theme derives it from
    // the page ground — so as a button fill it measured 1.0-1.3:1 on the
    // dark-based themes and Create, Rename and the reminder OK button had no
    // visible background at all. The per-screen override must keep every theme
    // above the 3:1 a filled control needs, with a label above 4.5:1 on it.
    DESIGNED.forEach((theme) => {
      const r = designedRolesFor("settings", theme.app);
      const fill = contrastRatio(r.ctaFill, theme.app.surfaceElevated);
      const label = contrastRatio(r.onCtaFill, r.ctaFill);
      expect([theme.id, "fill", fill >= 3]).toEqual([theme.id, "fill", true]);
      expect([theme.id, "label", label >= 4.5]).toEqual([theme.id, "label", true]);
    });
  });

  it("re-derives the bani list's page ground", () => {
    // The Home screen reads exactly one key, and it is the page itself.
    const themed = paletteFor("baniList", {
      mode: "light",
      c: READER_THEMES_BY_ID.puratan.app,
      designedTheme: "puratan",
    });
    expect(themed.surface).toBe(READER_THEMES_BY_ID.puratan.palette.ground);
  });
});
