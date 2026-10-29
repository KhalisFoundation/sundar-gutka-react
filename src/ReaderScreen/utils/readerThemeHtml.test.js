import {
  ALL_THEMES as READER_THEMES,
  ALL_THEMES_BY_ID as READER_THEMES_BY_ID,
} from "@theme/reader/__fixtures__/allThemes";
import defineReaderTheme from "@theme/reader/schema";
import { createDiv, fontColorForReader, fontSizeForReader, loadHTML } from "./index";

// What the WebView is actually handed. The colours a reader sees are decided in
// a generated string, so these assert the string — a component test cannot see
// inside a WebView, and this is where a theme regression would actually land.

jest.mock("react-native", () => ({
  Platform: { OS: "android", select: (o) => o.android },
  Image: { resolveAssetSource: (n) => ({ uri: `asset://${n}` }) },
}));

// The REAL constants and size helper, not the shared @common stub: this suite
// asserts a generated string, so a stubbed `constant.GURMUKHI` would change the
// very markup under test. Only the loggers are stubs.
jest.mock("@common", () => ({
  constant: jest.requireActual("@common/constant").default,
  baseFontSize: jest.requireActual("@common/helpers").default,
  logError: jest.fn(),
  logMessage: jest.fn(),
}));

const { light, dark } = READER_THEMES_BY_ID;

const SHABAD = [
  {
    id: "1",
    sequence: 1,
    header: 1,
    gurmukhi: "<>",
    gurmukhiUni: "ੴ",
    translit: "ik oankaar",
    englishTranslations: "One Universal Creator",
    punjabiTranslations: "ਇੱਕ ਓਅੰਕਾਰ",
    spanishTranslations: "Un Creador Universal",
  },
  {
    id: "2",
    sequence: 2,
    header: 0,
    gurmukhi: "siq nwmu",
    gurmukhiUni: "ਸਤਿ ਨਾਮੁ",
    translit: "sat naam",
    englishTranslations: "Truth is the Name",
    punjabiTranslations: "ਸਤਿ ਨਾਮੁ",
    spanishTranslations: "La Verdad es el Nombre",
  },
];

const html = (theme, opts = {}) =>
  loadHTML(
    SHABAD,
    opts.isTransliteration ?? true,
    "SMALL",
    opts.fontFace ?? "GurbaniAkharTrue",
    opts.isEnglishTranslation ?? true,
    false,
    false,
    theme,
    false
  );

describe("loadHTML publishes the reading theme", () => {
  READER_THEMES.forEach((theme) => {
    describe(theme.id, () => {
      const out = html(theme);

      it("paints the page in the theme's ground", () => {
        expect(out).toContain(`background-color: ${theme.background.color}`);
        expect(out).toContain(`--bg: ${theme.background.color}`);
      });

      it("publishes every text role as a custom property", () => {
        // These exist so markup baked elsewhere — the vishraam spans, generated
        // at DB-query time — can reference the live theme by name.
        expect(out).toContain(`--gurbani: ${theme.text.gurbani.color}`);
        expect(out).toContain(`--gurbani-heading: ${theme.text.gurbaniHeading.color}`);
        expect(out).toContain(`--translation: ${theme.text.translation.color}`);
        expect(out).toContain(`--transliteration: ${theme.text.transliteration.color}`);
        expect(out).toContain(`--vishraam-main: ${theme.vishraam.main}`);
        expect(out).toContain(`--vishraam-yamki: ${theme.vishraam.yamki}`);
        // The gradient variant has its own pair, falling back to the solid one:
        // a colour that reads as a solid glyph can be too weak as the far end
        // of a fade.
        expect(out).toContain(
          `--vishraam-main-grad: ${theme.vishraam.mainGradient ?? theme.vishraam.main}`
        );
        expect(out).toContain(
          `--vishraam-yamki-grad: ${theme.vishraam.yamkiGradient ?? theme.vishraam.yamki}`
        );
      });

      it("colours the Gurbani, heading, translation and transliteration lines", () => {
        expect(out).toContain(`color: ${theme.text.gurbaniHeading.color}`);
        expect(out).toContain(`color: ${theme.text.gurbani.color}`);
        expect(out).toContain(`color: ${theme.text.translation.color}`);
        expect(out).toContain(`color: ${theme.text.transliteration.color}`);
      });

      it("tints the scrollbar rather than leaving it a fixed blue", () => {
        expect(out).toContain(`background: ${theme.scrollbar.thumb}`);
      });

      it("hands the injected script the theme's highlight and base", () => {
        expect(out).toContain(`element.style.backgroundColor = "${theme.highlight.color}"`);
        expect(out).toContain(`if (${theme.base === "dark"})`);
      });
    });
  });
});

describe("optional treatments are emitted only when a theme asks for them", () => {
  it("draws no frame, texture or line-height for light and dark", () => {
    [light, dark].forEach((theme) => {
      const out = html(theme);
      expect(out).not.toContain("body::before");
      expect(out).not.toContain("body::after");
      expect(out).not.toContain("line-height:");
    });
  });

  it("draws a single-rule frame for a theme with no gap", () => {
    const out = html(READER_THEMES_BY_ID.blue);
    const { border } = READER_THEMES_BY_ID.blue;
    expect(out).toContain("body::after");
    expect(out).toContain(`border: ${border.width}px ${border.style} ${border.color}`);
    // One matte ring only. The text is contained by the matte, not by z-index
    // alone — lines scrolling past the rule would otherwise stay visible in the
    // strip between the rule and the viewport edge.
    expect(out).toContain(`0 0 0 9999px ${READER_THEMES_BY_ID.blue.background.color}`);
  });

  it("draws two concentric rules for puratan, never a CSS double border", () => {
    const { border, background } = READER_THEMES_BY_ID.puratan;
    const out = html(READER_THEMES_BY_ID.puratan);
    // A `double` border renders line / TRANSPARENT gap / line, and scrolling
    // text showed through that gap on all four sides. The pair is built from
    // opaque concentric box-shadow rings instead.
    expect(out).not.toContain("double");
    expect(out).toContain(`0 0 0 ${border.gap}px ${background.color}`);
    expect(out).toContain(`0 0 0 ${border.gap + border.width}px ${border.color}`);
    // The element sits on the inner rule, pushed past the outer rule and band.
    const offset = border.inset + border.width + border.gap;
    expect(out).toContain(`top: ${offset}px`);
    // Text clears the inner edge of the innermost rule, plus room for Gurmukhi
    // descenders.
    expect(out).toContain(`padding-left: ${offset + border.width + 10}px`);
  });

  it("gives each part of a double frame its own colour", () => {
    // The four independently colourable parts. A theme states them and nothing
    // else about the frame has to change.
    const themed = defineReaderTheme({
      id: "framed",
      nameKey: "reader_theme_framed",
      base: "light",
      palette: { ground: "#FFFFFF", ink: "#101010", accent: "#101010" },
      border: {
        width: 1,
        outerWidth: 3,
        gap: 6,
        inset: 14,
        color: "#AA0000",
        outerColor: "#00AA00",
        gapColor: "#0000AA",
        marginColor: "#AAAA00",
      },
    });
    const out = html(themed);
    // Inner rule: a real CSS border on the element.
    expect(out).toContain("border: 1px solid #AA0000");
    // Band, then outer rule, then the matte — concentric, each opaque.
    expect(out).toContain("0 0 0 6px #0000AA");
    expect(out).toContain("0 0 0 9px #00AA00");
    expect(out).toContain("0 0 0 9999px #AAAA00");
  });

  it("keeps the Bani inside the innermost rule whatever the frame costs", () => {
    // The containment guarantee. The element sits on the inner rule at
    // inset + outerWidth + gap; the text starts a further width + 10 in, so a
    // heavier or wider frame pushes the text in with it rather than under it.
    const themed = defineReaderTheme({
      id: "framed2",
      nameKey: "reader_theme_framed2",
      base: "light",
      palette: { ground: "#FFFFFF", ink: "#101010", accent: "#101010" },
      border: { width: 2, outerWidth: 5, gap: 6, inset: 14 },
    });
    const offset = 14 + 5 + 6;
    const out = html(themed);
    expect(out).toContain(`top: ${offset}px`);
    expect(out).toContain(`padding-left: ${offset + 2 + 10}px`);
    expect(out).toContain(`padding-right: ${offset + 2 + 10}px`);
  });

  it("falls back sensibly when a frame states only its width", () => {
    // One value has to be enough: the rules take the theme's rule colour, the
    // band and matte take the page ground, and both rules are the same weight.
    const bare = defineReaderTheme({
      id: "framed3",
      nameKey: "reader_theme_framed3",
      base: "light",
      palette: { ground: "#FFFFFF", ink: "#101010", accent: "#101010", rule: "#CCCCCC" },
      border: { width: 1, gap: 4 },
    });
    const out = html(bare);
    expect(out).toContain("border: 1px solid #CCCCCC");
    // Outer rule inherits the inner colour; band and matte inherit the ground.
    expect(out).toContain("0 0 0 5px #CCCCCC");
    expect(out).toContain("0 0 0 4px #FFFFFF");
    expect(out).toContain("0 0 0 9999px #FFFFFF");
  });

  it("layers puratan's texture on a fixed pseudo-element at its own opacity", () => {
    const { background } = READER_THEMES_BY_ID.puratan;
    const out = html(READER_THEMES_BY_ID.puratan);
    expect(out).toContain("body::before");
    expect(out).toContain(`opacity: ${background.imageOpacity}`);
    expect(out).toContain(`background-repeat: ${background.imageRepeat}`);
    // Fading `body` itself would fade the Gurbani with it; a separate layer is
    // the only way CSS can give a background image its own opacity.
    expect(out).toContain("z-index: -1");
  });

  it("emits line-height only for a theme that sets a ratio", () => {
    expect(html(READER_THEMES_BY_ID.white)).toContain(
      `line-height: ${READER_THEMES_BY_ID.white.typography.lineHeightRatio};`
    );
  });
});

describe("fontColorForReader", () => {
  it("gives header level 1 the heading colour and 2/6 the body colour", () => {
    expect(fontColorForReader(1, light, "GURMUKHI")).toBe(light.text.gurbaniHeading.color);
    expect(fontColorForReader(2, light, "GURMUKHI")).toBe(light.text.gurbani.color);
    expect(fontColorForReader(6, light, "GURMUKHI")).toBe(light.text.gurbani.color);
    expect(fontColorForReader(0, light, "GURMUKHI")).toBe(light.text.gurbani.color);
  });

  it("gives transliteration and translation their own slots", () => {
    expect(fontColorForReader(0, light, "TRANSLITERATION")).toBe(light.text.transliteration.color);
    expect(fontColorForReader(0, light, "TRANSLATION")).toBe(light.text.translation.color);
  });

  // This used to be an object literal built on every call and indexed by
  // header, so a header arriving as a string keyed exactly the same as a
  // number. The branch that replaced it has to keep that.
  it("reads a header level the same whether it arrives as a number or a string", () => {
    expect(fontColorForReader("1", light, "GURMUKHI")).toBe(light.text.gurbaniHeading.color);
    expect(fontColorForReader("2", light, "GURMUKHI")).toBe(light.text.gurbani.color);
  });

  it("falls back to the body colour when a theme leaves a slot empty", () => {
    // The map lookup ended in `|| defaultColor`; each branch has to keep it, or
    // a theme that sets no transliteration colour emits `color: undefined`.
    const bare = {
      ...light,
      text: {
        ...light.text,
        gurbaniHeading: { ...light.text.gurbaniHeading, color: "" },
        transliteration: { ...light.text.transliteration, color: "" },
        translation: { ...light.text.translation, color: "" },
      },
    };
    expect(fontColorForReader(1, bare, "GURMUKHI")).toBe(bare.text.gurbani.color);
    expect(fontColorForReader(0, bare, "TRANSLITERATION")).toBe(bare.text.gurbani.color);
    expect(fontColorForReader(0, bare, "TRANSLATION")).toBe(bare.text.gurbani.color);
  });

  it("falls back to the body colour for a role it does not know", () => {
    expect(fontColorForReader(0, light, "SOMETHING_ELSE")).toBe(light.text.gurbani.color);
  });
});

describe("fontSizeForReader", () => {
  it("treats the theme's scale as a multiplier on the user's setting", () => {
    // Never an override: the user's font-size choice still governs, a theme only
    // nudges it. White ships 1.08 for readability.
    const base = fontSizeForReader("SMALL", 0, false);
    expect(fontSizeForReader("SMALL", 0, false, 1.08)).toBeCloseTo(base * 1.08);
  });

  it("defaults to 1 and ignores a falsy scale rather than zeroing the text", () => {
    const base = fontSizeForReader("SMALL", 0, false);
    expect(fontSizeForReader("SMALL", 0, false)).toBe(base);
    expect(fontSizeForReader("SMALL", 0, false, 0)).toBe(base);
  });
});

// Which column a font is fed, and what it falls back to. Both are decided in
// the generated string, and getting either wrong renders the wrong script
// rather than merely the wrong shape.
describe("the Bani font", () => {
  // Every font but Baloo Paaji is legacy ASCII-encoded — the glyphs sit at
  // Latin codepoints — so they are handed the `gurmukhi` column. Baloo is the
  // only Unicode one and is handed `gurmukhiUni`. A font fed the wrong column
  // renders Latin letters.
  it("hands a legacy font the ASCII column", () => {
    const out = html(light, { fontFace: "Puratan_Hastlikhat" });
    expect(out).toContain("siq nwmu");
    expect(out).not.toContain("ਸਤਿ ਨਾਮੁ");
  });

  it("hands Baloo Paaji the Unicode column", () => {
    const out = html(light, { fontFace: "BalooPaaji2-Regular" });
    expect(out).toContain("ਸਤਿ ਨਾਮੁ");
  });

  it("declares an @font-face for the chosen font", () => {
    expect(html(light, { fontFace: "Puratan_Hastlikhat" })).toContain(
      "font-family: 'Puratan_Hastlikhat'"
    );
  });

  // The inline font-family overrides the stylesheet, so the chain has to be on
  // the line itself — otherwise a character the chosen font lacks falls through
  // to the WebView's own default instead of to another Gurmukhi face.
  it("follows the chosen font with the Gurmukhi fallbacks, in order", () => {
    expect(html(light, { fontFace: "Puratan_Hastlikhat" })).toContain(
      "font-family: Puratan_Hastlikhat, 'GurbaniAkharHeavyTrue', 'GurbaniAkharTrue', " +
        "'GurbaniAkharThickTrue', 'AnmolLipiSG';"
    );
  });

  // Only a Gurmukhi line takes a face from the caller. A translation must not
  // pick up a Gurmukhi chain it never had.
  it("leaves a line with no font of its own alone", () => {
    const out = createDiv("Truth", 0, "translation", "center", "SMALL", light, false);
    expect(out).not.toContain("GurbaniAkharHeavyTrue");
  });
});

describe("createDiv", () => {
  it("emits a text-shadow only for a theme that declares one, and only on Gurmukhi", () => {
    const shadowed = {
      ...light,
      text: { ...light.text, gurbani: { color: "#000", shadow: "0 0 4px #888" } },
    };
    expect(createDiv("ਸਤਿ", 0, "gurmukhi", "center", "SMALL", shadowed, false)).toContain(
      "text-shadow: 0 0 4px #888;"
    );
    // A shadow on a translation line just blurs the reading.
    expect(createDiv("Truth", 0, "translation", "center", "SMALL", shadowed, false)).not.toContain(
      "text-shadow"
    );
  });
});

describe("loadHTML page top margin", () => {
  const withMargin = (pageTopMargin) =>
    loadHTML(
      SHABAD,
      true,
      "SMALL",
      "GurbaniAkharTrue",
      true,
      false,
      false,
      light,
      false,
      pageTopMargin
    );

  it("keeps the 50px body margin when none is given", () => {
    expect(withMargin(undefined)).toContain("margin-top:50px;");
  });

  it("uses the margin it is given", () => {
    const out = withMargin(78);
    expect(out).toContain("margin-top:78px;");
    expect(out).not.toContain("margin-top:50px;");
  });
});
