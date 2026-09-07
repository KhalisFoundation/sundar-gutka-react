// Reader-only tokens keep custom palettes from making Settings unreadable.
export const DEFAULT_READER_COLORS = {
  light: {
    background: "#ffffff",
    text: "#121212",
    heading: "#113979",
    subheading: "#121212",
    transliteration: "#113979",
    translation: "#121212",
    vishraamShort: "#087f6c",
    vishraamLong: "#b34400",
  },
  dark: {
    background: "#121212",
    text: "#faf9f6",
    heading: "#77baff",
    subheading: "#faf9f6",
    transliteration: "#77baff",
    translation: "#faf9f6",
    vishraamShort: "#5cdbbd",
    vishraamLong: "#ffb86b",
  },
};

export const READER_COLOR_KEYS = [...Object.keys(DEFAULT_READER_COLORS.light), "larivaar"];

export const isHexColor = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export const sanitizeReaderColors = (overrides) =>
  READER_COLOR_KEYS.reduce((result, key) => {
    if (isHexColor(overrides?.[key])) return { ...result, [key]: overrides[key].toLowerCase() };
    return result;
  }, {});

export const resolveReaderColors = (mode, overrides) => {
  const defaults = DEFAULT_READER_COLORS[mode] || DEFAULT_READER_COLORS.light;
  return { ...defaults, ...sanitizeReaderColors(overrides) };
};

export const getReaderColors = (theme) => resolveReaderColors(theme.mode, theme.readerColors);

// A translucent highlight preserves text contrast in both reading modes.
const GRADIENT_ALPHA = 77 / 255;
export const gradientBackground = (color, background) =>
  `#${[1, 3, 5]
    .map((offset) => {
      const channel =
        parseInt(color.slice(offset, offset + 2), 16) * GRADIENT_ALPHA +
        parseInt(background.slice(offset, offset + 2), 16) * (1 - GRADIENT_ALPHA);
      return Math.round(channel).toString(16).padStart(2, "0");
    })
    .join("")}`;

export const readerColorVariables = (theme) => {
  const palette = getReaderColors(theme);
  const declarations = READER_COLOR_KEYS.filter((key) => palette[key]).map(
    (key) => `--reader-${key}: ${palette[key]};`
  );
  // An explicit assist color replaces the legacy opacity treatment. Vishraam
  // markers take precedence over assist colors on words that have a pause.
  declarations.push(`--reader-larivaar-opacity: ${palette.larivaar ? 1 : 0.65};`);
  declarations.push(`--reader-vishraamShortGradient: ${palette.vishraamShort}4d;`);
  declarations.push(`--reader-vishraamLongGradient: ${palette.vishraamLong}4d;`);
  return `:root { ${declarations.join(" ")} }`;
};

const luminance = (color) => {
  const channels = color.match(/[0-9a-f]{2}/gi).map((hex) => {
    const channel = parseInt(hex, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

export const contrastRatio = (foreground, background) => {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
