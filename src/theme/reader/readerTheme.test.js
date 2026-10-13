import { withAlpha } from "@theme/colorUtils";
import { navy } from "@theme/palette";
import { light as lightColors, dark as darkColors } from "@theme/semanticColors";
import { remoteThemeRows } from "./__fixtures__/remoteThemes";
import { AUDIO_ROLES } from "./bases/appBase";
import darkBase from "./bases/darkBase";
import lightBase from "./bases/lightBase";
import { AA_CONTRAST, contrastRatio, flattenColor } from "./contrast";
import { mergeThemeRegistry } from "./registry";
import defineReaderTheme, { merge } from "./schema";
import { READER_THEMES, READER_THEMES_BY_ID } from "./themes";

// The designed themes are database rows now, not bundled files. They reach the
// app through mergeThemeRegistry, so that is where this suite gets them — the
// records are the same ones that used to be imported, and each was verified to
// derive to exactly the theme it replaced.
const DESIGNED_BY_ID = mergeThemeRegistry({ themes: remoteThemeRows }).byId;

// The four text roles every theme paints on its own background.
const TEXT_ROLES = ["gurbani", "gurbaniHeading", "translation", "transliteration"];

describe("reading-theme registry", () => {
  it("bundles ONLY light and dark — every other theme is served", () => {
    // The five designed themes moved to `reader_themes` in the backend. These
    // two stay because they are the offline fallback, and mergeThemeRegistry
    // refuses to let a remote row remove either of them.
    expect(READER_THEMES.map((t) => t.id)).toEqual(["light", "dark"]);
  });

  it("still offers all seven once the served themes are merged in", () => {
    expect(Object.keys(DESIGNED_BY_ID).sort()).toEqual(
      ["blue", "dark", "kesari", "light", "puratan", "sanjh", "white"].sort()
    );
  });

  it("gives every theme a unique id and a localisation key", () => {
    const ids = READER_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    READER_THEMES.forEach((theme) => {
      expect(theme.nameKey).toBe(`reader_theme_${theme.id}`);
      expect(["light", "dark"]).toContain(theme.base);
    });
  });

  it("lists themes in ascending `order`", () => {
    const orders = READER_THEMES.map((t) => t.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it("indexes every theme by id", () => {
    expect(Object.keys(READER_THEMES_BY_ID).sort()).toEqual(READER_THEMES.map((t) => t.id).sort());
  });

  it("freezes each record, so no consumer can mutate a shared theme", () => {
    READER_THEMES.forEach((theme) => expect(Object.isFrozen(theme)).toBe(true));
  });
});

// This is the automated enforcement of "text is readable on every theme". It is
// what stops a future theme shipping STTM Desktop's Khalsa Gold problem: white
// on saturated saffron, 1.4:1, legible only because of a drop shadow.
describe("contrast guard", () => {
  READER_THEMES.forEach((theme) => {
    TEXT_ROLES.forEach((role) => {
      it(`${theme.id}: ${role} clears WCAG AA on its own background`, () => {
        const ratio = contrastRatio(theme.text[role].color, theme.background.color);
        expect(ratio).not.toBeNull();
        expect(ratio).toBeGreaterThanOrEqual(AA_CONTRAST);
      });
    });

    it(`${theme.id}: the sync-scroll highlight leaves the Gurbani readable`, () => {
      // The highlight is translucent, so the ink is actually read against the
      // COMPOSITE of highlight over ground — measuring against the raw ground
      // would pass a wash that in practice swallows the text.
      const composited = flattenColor(theme.highlight.color, theme.background.color);
      const ratio = contrastRatio(theme.text.gurbani.color, composited);
      expect(ratio).toBeGreaterThanOrEqual(AA_CONTRAST);
    });

    it(`${theme.id}: the header foreground is readable on the header bar`, () => {
      const ratio = contrastRatio(theme.chrome.headerForeground, theme.chrome.headerBackground);
      expect(ratio).toBeGreaterThanOrEqual(AA_CONTRAST);
    });

    it(`${theme.id}: audio text is readable on the player surface`, () => {
      expect(contrastRatio(theme.audio.textPrimary, theme.audio.surface)).toBeGreaterThanOrEqual(
        AA_CONTRAST
      );
      expect(contrastRatio(theme.audio.onPrimary, theme.audio.primary)).toBeGreaterThanOrEqual(
        AA_CONTRAST
      );
    });

    it(`${theme.id}: a dialog or toast raised over the Reader is readable`, () => {
      // The confirm dialog ("Remove downloaded audio?") and the toast are
      // mounted at the app root but appear ON the reading page, so they wear
      // this group too. Both the message and the confirm label are checked.
      //
      // The DESIGNED themes only. Light and Dark take this group straight from
      // the app palette, whose own pairs are governed by theme/contrast.test.js
      // — and the app's dark `accent` on `surfaceElevated` measures 4.01, which
      // this would fail for a value this feature does not own.
      if (theme.id === "light" || theme.id === "dark") return;
      const { surfaceElevated, textPrimary, accent, textBrand } = theme.audio;
      expect(contrastRatio(textPrimary, surfaceElevated)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(accent, surfaceElevated)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(textBrand, surfaceElevated)).toBeGreaterThanOrEqual(AA_CONTRAST);
    });

    it(`${theme.id}: the audio toggles are readable in both states`, () => {
      // The ON track carries a surface-coloured thumb; the OFF track has to
      // clear 3:1 against BOTH the panel behind it and that same thumb.
      const { controlAccent, controlTrackOff, surface } = theme.audio;
      expect(contrastRatio(surface, controlAccent)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(surface, controlTrackOff)).toBeGreaterThanOrEqual(3);
    });

    it(`${theme.id}: bottom-nav icons are readable on the bar`, () => {
      expect(contrastRatio(theme.nav.onPrimary, theme.nav.primary)).toBeGreaterThanOrEqual(
        AA_CONTRAST
      );
    });
  });
});

describe("defineReaderTheme", () => {
  it("inherits the whole base when a record overrides nothing", () => {
    const bare = READER_THEMES_BY_ID.light;
    expect(bare.background.color).toBe(lightBase.background.color);
    expect(bare.audio).toEqual(lightBase.audio);
    expect(bare.border.width).toBe(0);
  });

  it("merges nested namespaces rather than replacing them", () => {
    // Blue states only `text.gurbani`-and-friends colours; the `shadow` key it
    // never mentions has to survive from the base, or every optional treatment
    // would silently vanish the moment a theme touched its parent object.
    expect(DESIGNED_BY_ID.blue.text.gurbani.shadow).toBeNull();
    expect(DESIGNED_BY_ID.blue.typography.fontScale).toBe(1);
  });

  it("rejects an unregistered property", () => {
    expect(() =>
      defineReaderTheme({
        id: "typo",
        nameKey: "reader_theme_typo",
        base: "light",
        backgroundColour: "#fff",
      })
    ).toThrow(/Unknown property "backgroundColour"/);
  });

  it("rejects an unregistered NESTED property", () => {
    expect(() =>
      defineReaderTheme({
        id: "typo",
        nameKey: "reader_theme_typo",
        base: "light",
        text: { gurbani: { colour: "#fff" } },
      })
    ).toThrow(/Unknown property "text.gurbani.colour"/);
  });

  it("rejects a missing required field", () => {
    expect(() => defineReaderTheme({ nameKey: "x", base: "light" })).toThrow(
      /Missing required field "id"/
    );
  });

  it("rejects an unknown base", () => {
    expect(() => defineReaderTheme({ id: "x", nameKey: "x", base: "sepia" })).toThrow(
      /expected "light" or "dark"/
    );
  });

  it("treats non-plain values as replaceable leaves", () => {
    expect(merge({ a: { b: 1 } }, { a: { b: 2 } })).toEqual({ a: { b: 2 } });
    expect(merge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
  });
});

// Resolution — which record a stored setting renders with, and the appearance
// it pairs to — lives in resolve.test.js.

// The load-bearing guarantee of the whole feature: an existing user who never
// opens the new screen must see NO change. Not "looks the same" — the same
// values, checked against the roles the Reader reads today.
describe("Follow app theme is byte-identical to today's Reader", () => {
  const cases = [
    ["light", lightBase, lightColors],
    ["dark", darkBase, darkColors],
  ];

  cases.forEach(([mode, base, c]) => {
    describe(mode, () => {
      it("takes the page and header background from c.backgroundAlt", () => {
        expect(base.background.color).toBe(c.backgroundAlt);
        expect(base.chrome.headerBackground).toBe(c.backgroundAlt);
      });

      it("reproduces fontColorForReader's role mapping", () => {
        expect(base.text.gurbani.color).toBe(c.textPrimary);
        expect(base.text.translation.color).toBe(c.textPrimary);
        expect(base.text.gurbaniHeading.color).toBe(c.textBrand);
        expect(base.text.transliteration.color).toBe(c.textBrand);
      });

      it("marks the sung line visibly, in whichever mode", () => {
        // Dark keeps the role as-is. Light cannot: `accentSubtle` is navy[50]
        // and the light ground is neutral[100], two near-whites 1.01:1 apart —
        // the wash was there in the DOM and invisible on the page. It is a
        // translucent accent instead, tuned to the same strength dark gets.
        expect(base.highlight.color).toBe(
          mode === "dark" ? c.accentSubtle : withAlpha(navy[400], 0.45)
        );
        // The point of the wash is that you can see it, so that is the
        // assertion — not the value it happens to be written as.
        const onGround = contrastRatio(
          flattenColor(base.highlight.color, base.background.color),
          base.background.color
        );
        expect(onGround).toBeGreaterThan(1.4);
      });

      it("keeps the header foreground and progress bar on their roles", () => {
        expect(base.chrome.headerForeground).toBe(c.headerFg);
        expect(base.chrome.progressTrack).toBe(withAlpha(c.accent, 0.2));
        expect(base.chrome.progressFill).toBe(withAlpha(c.accent, 0.5));
      });

      it("makes the audio and nav role overrides the identity", () => {
        AUDIO_ROLES.forEach((role) => expect(base.audio[role]).toBe(c[role]));
        expect(base.nav).toEqual({ primary: c.primary, onPrimary: c.onPrimary });
      });

      it("draws no frame, no texture and no type treatment", () => {
        expect(base.border.width).toBe(0);
        expect(base.background.image).toBeNull();
        expect(base.typography).toEqual({
          fontScale: 1,
          lineHeightRatio: null,
          letterSpacing: null,
          preferredFontFace: null,
          // The Reader's long-standing Larivaar Assist dimming, unchanged.
          larivaarAssistOpacity: 0.65,
        });
      });

      it("never seeds a user's translation or transliteration settings", () => {
        expect(base.defaults).toEqual({});
      });
    });
  });

  it("gives light and dark identical key sets, at every depth", () => {
    // Mismatched keys mean one appearance silently resolves `undefined` — the
    // same class of bug themeShape.test.js guards for the app themes.
    const keyPaths = (node, path = "") =>
      Object.entries(node).flatMap(([key, value]) => {
        const here = path ? `${path}.${key}` : key;
        return value && typeof value === "object" && !Array.isArray(value)
          ? keyPaths(value, here)
          : [here];
      });
    expect(keyPaths(lightBase).sort()).toEqual(keyPaths(darkBase).sort());
  });
});

// The layer that makes a new theme five colours instead of forty values.
describe("deriveFromPalette", () => {
  const PALETTE = {
    ground: "#0B1E3A",
    ink: "#E6F0FF",
    accent: "#6FB1FF",
    muted: "#93B4DC",
    rule: "#1C3A66",
  };
  const build = (extra = {}) =>
    defineReaderTheme({
      id: "sapphire",
      nameKey: "reader_theme_sapphire",
      base: "dark",
      order: 99,
      palette: PALETTE,
      ...extra,
    });

  it("turns five colours into a complete, usable theme", () => {
    const t = build();
    expect(t.background.color).toBe(PALETTE.ground);
    expect(t.text.gurbani.color).toBe(PALETTE.ink);
    expect(t.text.gurbaniHeading.color).toBe(PALETTE.accent);
    expect(t.text.transliteration.color).toBe(PALETTE.muted);
    expect(t.chrome.headerBackground).toBe(PALETTE.ground);
    expect(t.chrome.headerForeground).toBe(PALETTE.accent);
    expect(t.border.color).toBe(PALETTE.rule);
    AUDIO_ROLES.forEach((role) => expect(typeof t.audio[role]).toBe("string"));
  });

  it("builds the nav bar from the GROUND, never the accent", () => {
    // Deriving it from the accent puts the brightest colour on screen along the
    // bottom edge of a theme chosen for reading at night. The bar never scrolls
    // away, so it has to sit quietly against the page.
    const { nav } = build();
    expect(nav.primary).not.toBe(PALETTE.accent);
    expect(nav.onPrimary).toBe(PALETTE.ink);
  });

  it("lifts the bar off a dark page and sinks it into a light one", () => {
    // Opposite directions, same goal: read as a bar without shouting. On dark
    // the page is already the darkest thing available, so the bar lifts; on
    // light a barely-tinted bar would vanish, so it goes deep instead.
    const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16);
    const onDark = build().nav.primary;
    expect(lum(onDark)).toBeGreaterThan(lum(PALETTE.ground));

    const onLight = defineReaderTheme({
      id: "pale",
      nameKey: "reader_theme_pale",
      base: "light",
      palette: { ground: "#FFFFFF", ink: "#101010", accent: "#8A2B00" },
    }).nav;
    expect(lum(onLight.primary)).toBeLessThan(lum("#FFFFFF"));
    expect(onLight.onPrimary).toBe("#FFFFFF");
  });

  it("puts the translation between the Gurbani and the transliteration", () => {
    // The reading hierarchy. An OPAQUE mix, not an alpha of the ink — a
    // translucent step would shift over a background texture or a highlighted
    // line and stop being the step it was designed to be.
    const { color } = build().text.translation;
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(color).not.toBe(PALETTE.ink);
    expect(color).not.toBe(PALETTE.muted);
  });

  it("fills in muted and rule when a theme omits them", () => {
    const t = defineReaderTheme({
      id: "bare",
      nameKey: "reader_theme_bare",
      base: "light",
      palette: { ground: "#FFFFFF", ink: "#101010", accent: "#101010" },
    });
    expect(t.text.transliteration.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(t.border.color).toContain("rgba(");
    expect(contrastRatio(t.text.transliteration.color, t.background.color)).toBeGreaterThanOrEqual(
      AA_CONTRAST
    );
  });

  it("draws no frame until a theme asks for a width", () => {
    // A frame is a design decision, not a colour: a theme gets the frame's
    // colour and geometry for free but nothing is painted until it opts in.
    expect(build().border.width).toBe(0);
  });

  it("makes a usable frame out of a bare width", () => {
    // The whole ergonomic point. A bare `{ width }` used to inherit inset 0 and
    // radius 0 from the base, drawing a squared-off rule hard against the
    // viewport edge — window chrome, not a ruled page. Colour, inset and radius
    // now come from the palette, so one value is a real frame.
    const { border } = build({ border: { width: 1 } });
    expect(border.color).toBe(PALETTE.rule);
    expect(border.inset).toBeGreaterThan(0);
    expect(border.radius).toBeGreaterThan(0);
    expect(border.style).toBe("solid");
    // No second rule unless asked for.
    expect(border.gap).toBe(0);
  });

  it("lets a frame override any part of itself, each rule separately", () => {
    const { border } = build({
      border: {
        width: 1,
        outerWidth: 3,
        radius: 0,
        inset: 20,
        gap: 4,
        color: "#ABCDEF",
        outerColor: "#123456",
        gapColor: "#FEDCBA",
        marginColor: "#0F0F0F",
        style: "dashed",
      },
    });
    expect(border).toEqual({
      width: 1,
      outerWidth: 3,
      radius: 0,
      inset: 20,
      gap: 4,
      color: "#ABCDEF",
      outerColor: "#123456",
      gapColor: "#FEDCBA",
      marginColor: "#0F0F0F",
      style: "dashed",
    });
  });

  it("lets a theme override any derived slot", () => {
    const t = build({
      text: { translation: { color: "#ABCDEF" } },
      chrome: { headerForeground: "#123456" },
      audio: { surface: "#654321" },
    });
    expect(t.text.translation.color).toBe("#ABCDEF");
    expect(t.chrome.headerForeground).toBe("#123456");
    expect(t.audio.surface).toBe("#654321");
    // Siblings of an overridden key survive.
    expect(t.chrome.headerBackground).toBe(PALETTE.ground);
    expect(t.audio.textPrimary).toBe(PALETTE.ink);
  });

  it("leaves the reading marks alone, because their meaning is not thematic", () => {
    expect(build().vishraam).toEqual(darkBase.vishraam);
  });

  it("never derives over light or dark", () => {
    // The bases carry a `palette` of their own. Testing the MERGED record rather
    // than the raw one would derive over those two and quietly repaint the
    // default Reader — the one thing this feature must not do.
    expect(READER_THEMES_BY_ID.light).toEqual(
      expect.objectContaining({ audio: lightBase.audio, chrome: lightBase.chrome })
    );
    expect(READER_THEMES_BY_ID.dark).toEqual(
      expect.objectContaining({ audio: darkBase.audio, chrome: darkBase.chrome })
    );
  });
});

describe("designed themes", () => {
  const designed = Object.values(DESIGNED_BY_ID).filter((t) => t.id !== "light" && t.id !== "dark");

  it("declare a primitive palette, so no colour is spelled twice", () => {
    designed.forEach((theme) => {
      expect(theme.palette.ground).toBe(theme.background.color);
      expect(theme.palette.ink).toBe(theme.text.gurbani.color);
      expect(theme.palette.accent).toBe(theme.text.gurbaniHeading.color);
    });
  });

  it("stay small, because everything else is derived", () => {
    // Guards the property the whole derivation layer exists for. If a theme
    // starts restating what its primitives already imply, this catches it.
    designed.forEach((theme) => {
      expect(Object.keys(theme.palette).length).toBeLessThanOrEqual(5);
    });
  });

  it("supply every audio role, so no player colour falls back to the app", () => {
    designed.forEach((theme) => {
      AUDIO_ROLES.forEach((role) => expect(typeof theme.audio[role]).toBe("string"));
    });
  });

  it("lets a theme override EVERY audio role it is given", () => {
    // Every role the bases fill has to be registered in ALLOWED_SHAPE too, or a
    // theme trying to state it throws "Unknown property" — which is exactly what
    // happened to the two switch-track roles: derived and consumed, but not
    // registered, so they were the only audio colours a theme could not set.
    AUDIO_ROLES.forEach((role) => {
      expect(() =>
        defineReaderTheme({
          id: "probe",
          nameKey: "reader_theme_probe",
          base: "light",
          audio: { [role]: "#123456" },
        })
      ).not.toThrow();
    });
  });

  it("lifts the audio player off the page, like both app themes do", () => {
    // The first cut set the player's surface to the page ground itself — 1.00,
    // i.e. invisible. The player, track dialog, settings sheet and mini pill all
    // stopped reading as boxes. Both app themes lift a card by 1.10, so every
    // theme has to clear that, and a dialog has to clear the player.
    designed.forEach((theme) => {
      const page = theme.background.color;
      const card = contrastRatio(theme.audio.surface, page);
      expect(card).toBeGreaterThanOrEqual(1.09);
      expect(contrastRatio(theme.audio.surfaceElevated, page)).toBeGreaterThan(card);
    });
  });

  it("keeps text readable on the lifted card, not just on the page", () => {
    designed.forEach((theme) => {
      expect(contrastRatio(theme.audio.textPrimary, theme.audio.surface)).toBeGreaterThanOrEqual(
        AA_CONTRAST
      );
    });
  });

  it("makes the vishraam gradient follow the solid marks by default", () => {
    // The fade should end on the same colour the solid glyph is. Left unset in
    // the base, so a theme that recolours `main` gets a matching gradient
    // without stating it twice — and Blue was previously fading to the stock
    // orange while its solid marks were amber.
    READER_THEMES.forEach((theme) => {
      const { main, yamki, mainGradient, yamkiGradient } = theme.vishraam;
      expect(mainGradient ?? main).toBe(main);
      expect(yamkiGradient ?? yamki).toBe(yamki);
    });
  });

  it("moves the vishraam marks off the fixed pair", () => {
    // The fixed orange/teal is tuned for the app's own light and dark grounds.
    // On a navy, an ivory or a parchment it either disappears or collides with
    // the theme's accent, so every designed theme states its own.
    designed.forEach((theme) => {
      expect(theme.vishraam.main).not.toBe(lightBase.vishraam.main);
      expect(theme.vishraam.yamki).not.toBe(lightBase.vishraam.yamki);
    });
  });

  it("keeps Blue's nav bar identical to the app's own dark bar", () => {
    // Asked for explicitly: Blue reads at night, and a bar derived from its
    // ground comes out a lighter navy than every other screen's.
    expect(DESIGNED_BY_ID.blue.nav).toEqual(darkBase.nav);
    expect(DESIGNED_BY_ID.blue.nav.primary).toBe(darkColors.primary);
  });

  it("seeds no settings at all — a theme suggests a look, not a preference", () => {
    // Puratan used to turn transliteration on with it. Reading along with the
    // Gurmukhi is the reader's decision, not the page's, so no theme makes it
    // for them. A Bani font is different and IS suggested: see the typography
    // block, and applyTheme, which re-applies a face on every selection.
    const seeding = designed.filter((t) => Object.keys(t.defaults).length > 0);
    expect(seeding.map((t) => t.id)).toEqual([]);
  });

  it("ships puratan's texture as an inline SVG data URI, not a bundled asset", () => {
    // A require()d image resolves differently in an Android release build than
    // in debug, and would need an @1x/@2x/@3x matrix. A data URI has neither
    // problem — see textures.js.
    expect(DESIGNED_BY_ID.puratan.background.image).toMatch(/^data:image\/svg\+xml,/);
  });
});
