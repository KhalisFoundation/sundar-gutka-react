import { AA_CONTRAST, contrastRatio } from "./contrast";
import defineReaderTheme, { ALLOWED_SHAPE } from "./schema";
import { READER_THEMES, READER_THEMES_BY_ID } from "./themes";

// The theme registry as the app actually uses it: the bundled records merged
// with whatever the backend has served, so a theme can be added, corrected or
// withdrawn without an app release — and so a device that has never reached
// the network, or is offline today, is on exactly the bundled set.
//
// Remote rows are DATA until they pass through here. Nothing about them is
// trusted: a row is cut down to the keys the schema knows, its colours are
// checked, its ink must read on its ground, and only then is it built into a
// record the same way a bundled theme is. A row that fails is dropped with no
// effect on any other theme. That is what lets a typo in pgAdmin be a missing
// theme rather than a broken Reader on every device.
//
// The bundled list itself is untouched by all this — `READER_THEMES` stays the
// registry of what shipped, and every test that pins it keeps its meaning.

export const THEME_ID_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PALETTE_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const BASES = new Set(["light", "dark"]);
/** Light and dark are what an unknown theme falls back to; they cannot be withdrawn. */
const APPEARANCE_IDS = new Set(["light", "dark"]);
const MAX_NAME_LENGTH = 40;

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Keeps only the keys the schema registers, recursively. `defineReaderTheme`
 * throws on an unknown key in development and silently merges it in release;
 * neither is right for a row typed by hand, so unknown keys are simply dropped.
 */
export const pickAllowed = (record, shape = ALLOWED_SHAPE) => {
  if (!isPlainObject(record)) return {};
  const out = {};
  Object.keys(record).forEach((key) => {
    const allowed = shape[key];
    if (!allowed) return;
    const value = record[key];
    if (isPlainObject(allowed)) {
      if (isPlainObject(value)) out[key] = pickAllowed(value, allowed);
    } else if (value !== undefined) {
      out[key] = value;
    }
  });
  return out;
};

// What each remote leaf may hold. `pickAllowed` decides which keys exist; this
// decides what they may contain. Every value here ends up inside Reader HTML —
// a style attribute, a <style> block, a string in the injected script — or in an
// app-wide React Native style, so a value that is not exactly a colour, a number
// in range or one of a few words is dropped. A dropped leaf falls back to the
// base theme's value; it never takes the rest of the row with it.
const RGB_COLOR =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i;
const isColor = (v) => typeof v === "string" && (HEX_COLOR.test(v) || RGB_COLOR.test(v));
const inRange = (min, max) => (v) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const oneOf =
  (...words) =>
  (v) =>
    words.includes(v);
const isBoolean = (v) => typeof v === "boolean";
// Lengths, offsets and colours only: no quotes, semicolons, colons, braces,
// angle brackets or backslashes, so it cannot leave the declaration it is in.
const isCssValue = (v) => typeof v === "string" && /^[a-z0-9#.,%()\s-]{1,120}$/i.test(v);
// An https URL or an inline image. Placed inside url('…'), so a quote, a
// backslash, an angle bracket or a line break is refused.
const isImageUri = (v) =>
  typeof v === "string" &&
  v.length <= 20000 &&
  /^(?:https:\/\/|data:image\/)/i.test(v) &&
  !/['"\\<>\s]/.test(v);

const LEAF_CHECKS = {
  background: {
    color: isColor,
    image: isImageUri,
    imageOpacity: inRange(0, 1),
    imageRepeat: oneOf("repeat", "no-repeat", "repeat-x", "repeat-y", "round", "space"),
    imageSize: isCssValue,
  },
  text: {
    gurbani: { color: isColor, shadow: isCssValue },
    gurbaniHeading: { color: isColor, shadow: isCssValue },
    translation: { color: isColor },
    transliteration: { color: isColor },
    teeka: { color: isColor },
  },
  highlight: { color: isColor },
  vishraam: { main: isColor, yamki: isColor, mainGradient: isColor, yamkiGradient: isColor },
  typography: {
    fontScale: inRange(0.5, 2),
    lineHeightRatio: inRange(1, 3),
    letterSpacing: inRange(-5, 10),
    preferredFontFace: (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v),
    larivaarAssistOpacity: inRange(0, 1),
  },
  border: {
    width: inRange(0, 16),
    outerWidth: inRange(0, 16),
    color: isColor,
    outerColor: isColor,
    gapColor: isColor,
    marginColor: isColor,
    style: oneOf("solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"),
    radius: inRange(0, 64),
    inset: inRange(0, 64),
    gap: inRange(0, 64),
  },
  scrollbar: { thumb: isColor, track: isColor, width: inRange(0, 20) },
  defaults: {
    isTransliteration: isBoolean,
    isEnglishTranslation: isBoolean,
    isPunjabiTranslation: isBoolean,
    isSpanishTranslation: isBoolean,
  },
};
// Every leaf of these groups is a colour role.
["app", "audio", "chrome", "nav"].forEach((group) => {
  LEAF_CHECKS[group] = Object.fromEntries(
    Object.keys(ALLOWED_SHAPE[group]).map((key) => [key, isColor])
  );
});

/**
 * Drops every leaf whose value fails its check, recursively. Groups with no
 * entry (the palette, checked on its own below; `base`) pass through.
 */
export const checkLeaves = (record, checks = LEAF_CHECKS) => {
  const out = {};
  Object.keys(record).forEach((key) => {
    const value = record[key];
    const check = checks[key];
    if (check === undefined) {
      out[key] = value;
    } else if (typeof check === "function") {
      if (check(value)) out[key] = value;
    } else if (isPlainObject(value)) {
      out[key] = checkLeaves(value, check);
    }
  });
  return out;
};

const cleanNames = (input) => {
  if (!isPlainObject(input)) return null;
  const names = {};
  Object.entries(input).forEach(([lang, value]) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed && trimmed.length <= MAX_NAME_LENGTH) names[lang] = trimmed;
  });
  return names.en || names["en-US"] ? names : null;
};

/**
 * A remote row as served by GET /themes, or null when it cannot be a theme.
 * A disabled row keeps only what is needed to withdraw a theme.
 *
 * @param {{ id?: string, position?: number, enabled?: boolean, names?: object, record?: object }} row
 */
export const sanitizeRemoteTheme = (row) => {
  if (!isPlainObject(row)) return null;
  const id = String(row.id ?? "").trim();
  if (!THEME_ID_PATTERN.test(id)) return null;
  const position = Number.isFinite(Number(row.position)) ? Number(row.position) : 100;
  if (row.enabled === false) return { id, position, enabled: false, names: null, record: null };

  const names = cleanNames(row.names);
  if (!names) return null;
  const record = checkLeaves(pickAllowed(row.record));
  if (!BASES.has(record.base)) return null;
  const palette = record.palette || {};
  // 3 or 6 digits only: every derived slot is mixed from these through
  // colorUtils, which cannot read an alpha channel — an 8-digit ground came
  // back as the ground for every button fill and label, and a rule as
  // transparent. Explicit leaf colours (isColor) may still carry alpha.
  const isHex = (value) => typeof value === "string" && PALETTE_HEX.test(value);
  if (!["ground", "ink", "accent"].every((key) => isHex(palette[key]))) return null;
  if (!["muted", "rule"].every((key) => palette[key] === undefined || isHex(palette[key]))) {
    return null;
  }
  // The one legibility rule that cannot be left to derivation: every text
  // colour is derived FROM the ink, so an ink that fails on its own ground
  // fails everywhere.
  if (contrastRatio(palette.ink, palette.ground) < AA_CONTRAST) return null;
  return { id, position, enabled: true, names, record };
};

/**
 * Builds a full theme record from a sanitized remote row, exactly as a bundled
 * file would. `names` rides along for the picker (a remote theme has no
 * localisation-file entry to look up), and `remote` marks it for analytics.
 * Returns null if the derivation itself refuses the record.
 */
export const defineRemoteTheme = (sanitized) => {
  if (!sanitized || !sanitized.enabled) return null;
  try {
    const record = defineReaderTheme({
      ...sanitized.record,
      id: sanitized.id,
      nameKey: `reader_theme_${sanitized.id}`,
      order: sanitized.position,
    });
    return Object.freeze({ ...record, names: sanitized.names, remote: true });
  } catch (_) {
    return null;
  }
};

/**
 * The merged registry: bundled themes, then remote rows applied by id — a row
 * with a bundled id replaces that theme, a new id adds one, a disabled row
 * removes one. Light and dark can be replaced but never removed.
 *
 * @param {{ themes?: object[] }|null|undefined} remoteThemes the persisted slice.
 * @returns {{ list: object[], byId: Record<string, object> }}
 */
export const mergeThemeRegistry = (remoteThemes) => {
  const byId = { ...READER_THEMES_BY_ID };
  const rows = Array.isArray(remoteThemes?.themes) ? remoteThemes.themes : [];
  rows.forEach((row) => {
    const sanitized = sanitizeRemoteTheme(row);
    if (!sanitized) return;
    if (!sanitized.enabled) {
      if (!APPEARANCE_IDS.has(sanitized.id)) delete byId[sanitized.id];
      return;
    }
    const record = defineRemoteTheme(sanitized);
    if (record) byId[sanitized.id] = record;
  });
  const list = Object.values(byId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return { list, byId };
};

/** The registry with nothing remote — what the app ships with. */
export const bundledRegistry = () => ({ list: READER_THEMES, byId: READER_THEMES_BY_ID });

/** "DEFAULT" / "en-US" / "pa" → "en" / "pa". */
const shortLang = (lang) => {
  const l = String(lang || "")
    .trim()
    .toLowerCase();
  if (!l || l === "default") return "en";
  return l.split(/[-_]/)[0] || "en";
};

/**
 * A remote theme's display name in the app's language, falling back through
 * the full tag, English, and finally the id. Bundled themes have no `names`
 * and are labelled from the localisation file by the caller.
 */
export const remoteThemeName = (record, lang) => {
  const names = record?.names;
  if (!names) return null;
  return (
    names[String(lang || "")] || names[shortLang(lang)] || names.en || names["en-US"] || record.id
  );
};

export default mergeThemeRegistry;
