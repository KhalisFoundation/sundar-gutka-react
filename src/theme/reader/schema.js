// Reading-theme schema.
//
// A reading theme describes ONLY the Reader — the surface where Bani is read,
// and the chrome that physically touches it. It is a SECOND, independent axis
// from the app's Light/Dark appearance (`state.theme`), which this file
// deliberately knows nothing about and which no theme here can change.
//
// Every theme declares a `base` ("light" | "dark") and states ONLY what makes it
// different: defineReaderTheme deep-merges the record over that base, so a new
// theme is a handful of lines rather than a full restatement. ALLOWED_SHAPE
// below is the single place a new theme property is registered — the __DEV__
// validator rejects anything not listed, which catches a typo like
// `backgroundColour` at import time instead of leaving it silently ignored.

/* global __DEV__ */
import darkBase from "./bases/darkBase";
import lightBase from "./bases/lightBase";
import deriveFromPalette from "./derive";

const BASES = { light: lightBase, dark: darkBase };

// Shape registry: `true` = a leaf value, an object = a nested namespace.
const ALLOWED_SHAPE = {
  id: true,
  nameKey: true,
  base: true,
  order: true,
  // Tier 1 of the token model: the theme's raw identity colours. Every semantic
  // slot below points at one of these rather than repeating its literal, so
  // retuning a theme's accent is a one-value edit. Deliberately a single hop —
  // primitives never reference other primitives, semantics never chain through
  // another semantic.
  palette: {
    ground: true,
    ink: true,
    muted: true,
    accent: true,
    rule: true,
  },
  background: {
    color: true,
    image: true,
    imageOpacity: true,
    imageRepeat: true,
    imageSize: true,
  },
  text: {
    gurbani: { color: true, shadow: true },
    gurbaniHeading: { color: true, shadow: true },
    translation: { color: true },
    transliteration: { color: true },
    teeka: { color: true },
  },
  highlight: { color: true },
  // Reading marks. The GRADIENT vishraam option is a separate pair, because a
  // colour that reads correctly as a solid glyph can be too weak as the far end
  // of a fade. Unset, each falls back to its solid counterpart.
  vishraam: { main: true, yamki: true, mainGradient: true, yamkiGradient: true },
  typography: {
    fontScale: true,
    lineHeightRatio: true,
    letterSpacing: true,
    preferredFontFace: true,
    // How far Larivaar Assist dims every second word. It is a legibility knob,
    // not a decoration: 0.65 reads correctly on the app's own high-contrast
    // grounds, but on a low-contrast parchment the dimmed words drop close to
    // the paper, so a warm theme needs to dim less.
    larivaarAssistOpacity: true,
  },
  // The reading frame. `gap` > 0 draws a SECOND concentric rule that far inside
  // the first, for a ruled-manuscript page. Its four parts each take their own
  // colour, and each falls back so a theme can state as little as { width: 1 }:
  //
  //   color        the inner rule — the one the Bani sits inside
  //   outerColor   the second rule            (defaults to `color`)
  //   gapColor     the band between the two   (defaults to `marginColor`)
  //   marginColor  outside the frame, out to the screen edge, and the matte
  //                that clips scrolling text (defaults to the page ground)
  //
  // `outerWidth` lets the second rule be a different weight — a manuscript frame
  // is classically thick-outer/thin-inner. The Bani is ALWAYS confined inside
  // the innermost rule whatever these are set to; see borderCss in gutkahtml.js.
  border: {
    width: true,
    outerWidth: true,
    color: true,
    outerColor: true,
    gapColor: true,
    marginColor: true,
    style: true,
    radius: true,
    inset: true,
    gap: true,
  },
  scrollbar: { thumb: true, track: true, width: true },
  // The WHOLE APP's colour roles. Merged over `theme.c` in ThemeProvider, so a
  // designed theme reaches every screen — Home, Dashboard, Seva, Settings, every
  // dialog and sheet — not only the Reader.
  //
  // Same trick as `audio` below: these are the app's own semantic role names, so
  // no screen's style rules change. Light and Dark fill this group FROM the app
  // palette, making the merge the identity and leaving them untouched.
  //
  // The status family, the reading mark and the black washes are deliberately
  // absent — see APP_ROLES_FIXED in bases/appBase.js.
  app: {
    background: true,
    backgroundAlt: true,
    surface: true,
    surfaceElevated: true,
    surfaceSelected: true,
    fillSubtle: true,
    edgeHighlight: true,
    textPrimary: true,
    textSecondary: true,
    textDisabled: true,
    textBrand: true,
    textOnBrand: true,
    headerFg: true,
    link: true,
    primary: true,
    primaryPressed: true,
    onPrimary: true,
    accent: true,
    accentPressed: true,
    onAccent: true,
    accentSubtle: true,
    controlAccent: true,
    controlAccentPressed: true,
    onControlAccent: true,
    controlTrackOff: true,
    border: true,
    borderStrong: true,
    focusRing: true,
  },
  // The audio player and its dialogs sit ON the Reader, beside the Bani, so they
  // follow the reading theme rather than the app appearance.
  //
  // These are the app's own SEMANTIC ROLE NAMES, not invented slots — the same
  // trick `sevaRoles`/`dashboardRoles` use in screenPalettes.js. The hook merges
  // this group straight over `theme.c`, so every existing `theme.c.surface` in
  // the audio components keeps working and simply resolves to a themed value.
  // No audio style rule changes, and nothing that is not a colour is touched.
  //
  // Because the light/dark bases fill this group FROM the app's own light/dark
  // palettes, the override is the identity whenever the reading theme agrees
  // with the app appearance — which is what makes "Follow app theme" provably
  // unchanged rather than hand-copied and hoped for.
  //
  // `error` is deliberately absent: a failed download stays red on every theme.
  audio: {
    surface: true,
    surfaceElevated: true,
    textPrimary: true,
    textSecondary: true,
    textBrand: true,
    onPrimary: true,
    primary: true,
    accent: true,
    border: true,
    surfaceSelected: true,
    accentSubtle: true,
    fillSubtle: true,
    headerFg: true,
    link: true,
    // The Auto Play / Sync Scroll switches in the audio options sheet. The ON
    // track and the OFF track; the thumb takes `surface`.
    controlAccent: true,
    controlTrackOff: true,
  },
  // React Native surfaces that are physically contiguous with the Bani text.
  chrome: {
    headerBackground: true,
    headerForeground: true,
    progressTrack: true,
    progressFill: true,
  },
  // The bottom navigation WHILE THE READER IS OPEN. Two roles is all it needs:
  // the bar, and what sits on it. The active pill is the same pair inverted —
  // pill fill = onPrimary, active icon = primary — which is already how the
  // component draws it, so nothing further has to be declared. Role names again,
  // for the same reason as `audio` above.
  nav: { primary: true, onPrimary: true },
  defaults: {
    isTransliteration: true,
    isEnglishTranslation: true,
    isPunjabiTranslation: true,
    isSpanishTranslation: true,
  },
};

const REQUIRED_FIELDS = ["id", "nameKey", "base"];

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Deep merge treating plain objects as namespaces to recurse into, and
// everything else (strings, numbers, booleans, require()d image refs) as a
// replaceable leaf.
const merge = (base, override) => {
  const result = { ...base };
  Object.keys(override ?? {}).forEach((key) => {
    const next = override[key];
    if (isPlainObject(next) && isPlainObject(base?.[key])) {
      result[key] = merge(base[key], next);
    } else if (next !== undefined) {
      result[key] = next;
    }
  });
  return result;
};

const validate = (record, shape = ALLOWED_SHAPE, path = "") => {
  Object.keys(record).forEach((key) => {
    const allowed = shape[key];
    const here = path ? `${path}.${key}` : key;
    if (!allowed) {
      throw new Error(
        `[readerTheme] Unknown property "${here}". Register it in ALLOWED_SHAPE ` +
          `(src/theme/reader/schema.js) before using it.`
      );
    }
    if (isPlainObject(allowed) && isPlainObject(record[key])) {
      validate(record[key], allowed, here);
    }
  });
};

const defineReaderTheme = (record) => {
  const base = BASES[record?.base];

  // __DEV__ only: the validator walks the whole record on every import, which is
  // wasted work in a release bundle where the records cannot have changed since
  // the last dev run.
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    REQUIRED_FIELDS.forEach((field) => {
      if (!record?.[field]) {
        throw new Error(`[readerTheme] Missing required field "${field}".`);
      }
    });
    if (!base) {
      throw new Error(
        `[readerTheme] "${record.id}" has base "${record.base}" — expected "light" or "dark".`
      );
    }
    validate(record);
  }

  // Three layers, in precedence order.
  //
  //   base     a complete record — for light/dark, the app's own palette
  //   derived  everything a designed theme's five primitives imply (see
  //            derive.js). Absent for light/dark, which declare no `palette` of
  //            their own, so those two stay exactly what the app resolves.
  //   record   whatever this theme states explicitly, which always wins
  //
  // Read against the RAW record, not the merged one: the bases carry a
  // `palette` block of their own, and testing that would derive over light and
  // dark and quietly repaint the default Reader.
  const derived = record?.palette ? deriveFromPalette(record.palette, record.base) : null;
  const withDerived = derived ? merge(base ?? lightBase, derived) : base ?? lightBase;
  const merged = merge(withDerived, record);

  // The bottom bar is ONE colour everywhere.
  //
  // `app.primary` is the tab bar off the Reader; `nav.primary` is the same bar
  // over it. The derivation computes both from the palette, so they agree — but
  // a theme that overrides only `nav` would leave the two disagreeing, and the
  // bar would change colour as you walked into the Reader. Blue does exactly
  // that: it pins `nav` to the app's dark navy, and without this its tab bar
  // stayed the derived #203047.
  //
  // Re-linked AFTER the merge, so it follows whatever `nav` finally resolved to.
  // A theme that states `app.primary` itself is left alone. For Light and Dark
  // both sides already come from the same palette key, so this is a no-op.
  const relinked =
    record?.app?.primary === undefined && record?.app?.onPrimary === undefined
      ? {
          ...merged,
          app: {
            ...merged.app,
            primary: merged.nav.primary,
            onPrimary: merged.nav.onPrimary,
            textOnBrand: merged.nav.onPrimary,
          },
        }
      : merged;

  return Object.freeze(relinked);
};

export { ALLOWED_SHAPE, merge };
export default defineReaderTheme;
