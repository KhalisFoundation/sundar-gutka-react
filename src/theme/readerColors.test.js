import {
  contrastRatio,
  DEFAULT_READER_COLORS,
  gradientBackground,
  readerColorVariables,
  resolveReaderColors,
  sanitizeReaderColors,
} from "./readerColors";

describe("reader palettes", () => {
  test.each(["light", "dark"])(
    "%s defaults have legible text, colored pauses and gradients",
    (mode) => {
      const palette = resolveReaderColors(mode);
      Object.entries(palette)
        .filter(([key]) => key !== "background")
        .forEach(([, color]) => {
          expect(contrastRatio(color, palette.background)).toBeGreaterThanOrEqual(4.5);
        });
      [palette.vishraamShort, palette.vishraamLong].forEach((color) => {
        expect(
          contrastRatio(palette.text, gradientBackground(color, palette.background))
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  );

  test("missing and malformed persisted settings fall back without leaking CSS", () => {
    expect(resolveReaderColors("dark", null)).toEqual(DEFAULT_READER_COLORS.dark);
    const palette = resolveReaderColors("dark", {
      text: "#ABCDEF",
      background: "red; } </style><script>alert(1)</script>",
      heading: {},
      vishraamLong: "#fff",
      primary: "#000000",
    });
    expect(palette.text).toBe("#abcdef");
    expect(palette.background).toBe(DEFAULT_READER_COLORS.dark.background);
    expect(palette.vishraamLong).toBe(DEFAULT_READER_COLORS.dark.vishraamLong);
    expect(palette.primary).toBeUndefined();
    expect(readerColorVariables({ mode: "dark", readerColors: palette })).not.toContain("<script>");
    expect(sanitizeReaderColors("invalid")).toEqual({});
  });

  test("larivaar uses legacy opacity until a custom color is chosen", () => {
    expect(readerColorVariables({ mode: "dark" })).toContain("--reader-larivaar-opacity: 0.65");
    const css = readerColorVariables({ mode: "dark", readerColors: { larivaar: "#ffeedd" } });
    expect(css).toContain("--reader-larivaar: #ffeedd");
    expect(css).toContain("--reader-larivaar-opacity: 1");
  });
});
