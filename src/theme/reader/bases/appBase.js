import { withAlpha } from "@theme/colorUtils";
import { navy, vishraam } from "@theme/palette";
import { light as lightColors, dark as darkColors } from "@theme/semanticColors";

// The complete default record for a reading theme, built FROM the app's own
// semantic colours.
//
// This is the load-bearing decision in the whole feature. The obvious approach
// is to hand-copy today's Reader colours into two literal files — but the Reader
// no longer holds literals: since the token overhaul every colour it draws comes
// from a role (`c.backgroundAlt`, `c.textPrimary`, `c.textBrand`, …). Copying
// those values out would fork them, and the copy would go stale the first time
// the app palette was retuned, in the one place the difference is least
// forgivable: the page scripture is read on.
//
// So the two bases are DERIVED. Every mapping below is the exact role the Reader
// reads today, which means:
//
//   • "Follow app theme" (the default) resolves to a record whose every value is
//     already what the Reader draws — the override is the identity, so an
//     existing user sees no change at all. Not "looks the same"; the same value.
//   • Pinning "Light" while the app is dark hands the Reader the app's LIGHT
//     palette rather than an invented one, so it stays coherent with itself.
//   • Retuning the app palette carries into the Reader automatically, exactly as
//     it does now.
//
// The four designed themes (Blue, Kesari, Puratan, White) are the opposite: they
// declare their own literals and inherit only the structure from here.

// The roles the audio player, its dialogs and the mini pill read. Listed once,
// used both to lift the app's values into the base and to document what a
// designed theme's `deriveAudio` has to supply. See schema.js.
export const AUDIO_ROLES = [
  "surface",
  // The lifted card behind a confirm dialog or a toast raised over the Reader.
  "surfaceElevated",
  "textPrimary",
  "textSecondary",
  "textBrand",
  "onPrimary",
  "primary",
  // A dialog's confirm label. Distinct from `primary` in the app palette, which
  // is the fixed brand navy in both appearances.
  "accent",
  "border",
  "surfaceSelected",
  "accentSubtle",
  "fillSubtle",
  "headerFg",
  "link",
  // The Auto Play / Sync Scroll switches in the audio options sheet.
  //
  // ThemedSwitch reads `useTokens()`, which goes through the APP ThemeContext —
  // it never sees the scoped theme the surrounding sheet is built from, so
  // remapping `theme.c` alone left the toggles on the app's blue over a themed
  // panel. The switch already accepts explicit colour props for exactly this
  // case, and AudioSettingsModal now passes these two through.
  "controlAccent",
  "controlTrackOff",
];

// The reading-progress bar's blue and the WebView scrollbar's thumb are the two
// Reader colours that are NOT roles today — the progress bar derives from
// `c.accent`, the scrollbar is a literal in gutkahtml.js. Named here so the
// scrollbar's value has one home instead of being retyped in a CSS string.
const SCROLLBAR_INDICATOR = "#7A99C9";

// The bottom navigation's two roles: the bar, and what sits on it.
const NAV_ROLES = ["primary", "onPrimary"];

// Roles a designed theme RECOLOURS app-wide. Everything the eye reads as "this
// app's colour": grounds, ink, brand, controls, borders.
export const APP_ROLES = [
  "background",
  "backgroundAlt",
  "surface",
  "surfaceElevated",
  "surfaceSelected",
  "fillSubtle",
  "edgeHighlight",
  "textPrimary",
  "textSecondary",
  "textDisabled",
  "textBrand",
  "textOnBrand",
  "headerFg",
  "link",
  "primary",
  "primaryPressed",
  "onPrimary",
  "accent",
  "accentPressed",
  "onAccent",
  "accentSubtle",
  "controlAccent",
  "controlAccentPressed",
  "onControlAccent",
  "controlTrackOff",
  "border",
  "borderStrong",
  "focusRing",
];

// Roles a designed theme must NOT touch, and why.
//
// `error`, `success` and the gold family carry MEANING — a failed download is
// red and a streak is gold on every theme, or the colour stops being
// information and becomes decoration. `vishraamShort` is a reading mark, for
// the same reason. `scrim` and `shadow` are black washes that work on any
// ground and would only be weakened by tinting.
//
// Listed rather than merely omitted so the split is a decision on the page and
// a test can assert it — see themeShape/readerTheme tests.
export const APP_ROLES_FIXED = [
  "scrim",
  "shadow",
  "error",
  // The destructive button's fill and its label, fixed for the same reason the
  // error text is: red says "this removes something" and is not a theme's to
  // restyle. A separate role from `error` only because a fill and text have
  // different contrast floors, not because a theme may set it.
  "errorFill",
  "onErrorFill",
  "errorSurface",
  "onError",
  "success",
  "successSurface",
  "gold",
  "goldFill",
  "goldSurface",
  "onGold",
  "vishraamShort",
];

const pick = (source, keys) =>
  keys.reduce((acc, key) => {
    acc[key] = source[key];
    return acc;
  }, {});

/**
 * @param {object} c   A semantic colour set — `light` or `dark` from
 *                     `@theme/semanticColors`.
 * @param {"light"|"dark"} mode Which one it is. Drives the WebView's first-paint
 *                     fade and the status-bar style over the Reader.
 */
const createAppBase = (c, mode) => ({
  base: mode,
  order: 100,

  // The app palette IS this theme's identity, so there is no separate tier-1
  // block to restate. A designed theme declares one; these two do not need it.
  palette: {
    ground: c.backgroundAlt,
    ink: c.textPrimary,
    muted: c.textSecondary,
    accent: c.textBrand,
    rule: c.border,
  },

  // `backgroundAlt`, not `background`: the two are identical in dark mode, but
  // in light the rest of the app sits on a slightly recessed ground while the
  // Reader used to be pure white. This is the role the Reader reads today.
  background: {
    color: c.backgroundAlt,
    image: null,
    imageOpacity: 1,
    imageRepeat: "no-repeat",
    imageSize: "cover",
  },

  // Straight from fontColorForReader(): header level 1 and all transliteration
  // take the brand blue, everything else the primary text colour.
  text: {
    gurbani: { color: c.textPrimary, shadow: null },
    gurbaniHeading: { color: c.textBrand, shadow: null },
    translation: { color: c.textPrimary },
    transliteration: { color: c.textBrand },
    // Reserved — there is no teeka UI in v1, but a theme may already declare it.
    teeka: { color: c.textSecondary },
  },

  // The sync-scroll / audio active-line wash.
  //
  // LIGHT ONLY is derived. `c.accentSubtle` is navy[50] (#eff3fb) and the
  // Reader's light ground is neutral[100] (#f3f4f6) — two near-whites 1.01:1
  // apart, so the wash marking the line being sung was mathematically
  // invisible.
  //
  // It is navy[400], NOT the light theme's own accent. Every blue role in light
  // is navy[800], which is dark: thinned enough to sit under scripture it turns
  // blue-GREY (a composite only 26 points of blue-over-red — it read as a grey
  // bar, not a blue one). A mid-navy keeps its hue as it thins, so 0.45 gives
  // 43 points of tint at 1.57:1 against the ground — a shade stronger than dark
  // manages (1.46:1) — with the Gurbani over it still at 7.22:1, well past AA.
  //
  // Dark keeps `accentSubtle` untouched: it was never the broken one. Nothing
  // else in the app reads `highlight`, so this moves the sung-line wash alone.
  highlight: { color: mode === "dark" ? c.accentSubtle : withAlpha(navy[400], 0.45) },

  // Reading marks, whose meaning does not change with the theme — so the two
  // bases keep the fixed palette values the Reader uses now. Only a designed
  // theme moves them, and only to stay legible on its own ground.
  // The gradient pair is left unset so it FOLLOWS the solid marks — a theme that
  // recolours `main` gets a matching gradient without stating it twice, which is
  // what you want by default: the fade should end on the same colour the solid
  // glyph is. gutkahtml resolves `mainGradient ?? main`.
  //
  // For Light and Dark that resolves to vishraam.long/.short, which are the same
  // two colours as .longGradient/.shortGradient in rgba form — so both render
  // exactly as they always have.
  vishraam: {
    main: vishraam.long,
    yamki: vishraam.short,
    mainGradient: null,
    yamkiGradient: null,
  },

  typography: {
    // A multiplier on the user's font-size setting, never an override.
    fontScale: 1,
    // null = emit nothing, preserving the WebView's default leading.
    lineHeightRatio: null,
    letterSpacing: null,
    // null = always honour the user's Bani Font setting.
    preferredFontFace: null,
    // Larivaar Assist dims every second word so word boundaries are readable in
    // an unbroken line. 0.65 is the value the Reader has always used.
    larivaarAssistOpacity: 0.65,
  },

  // width: 0 = no frame drawn, which is what the Reader does today. The null
  // parts each fall back at render time — see resolveBorder in gutkahtml.js.
  border: {
    width: 0,
    outerWidth: null,
    color: "transparent",
    outerColor: null,
    gapColor: null,
    marginColor: null,
    style: "solid",
    radius: 0,
    inset: 0,
    gap: 0,
  },

  scrollbar: { thumb: withAlpha(SCROLLBAR_INDICATOR, 0.5), track: "transparent", width: 4 },

  // The header bar and the reading-progress bar, both physically contiguous with
  // the Bani. Same roles they read today — `headerStyle.backgroundColor`,
  // `c.headerFg`, and the two `withAlpha(c.accent, …)` steps in styles/index.js.
  chrome: {
    headerBackground: c.backgroundAlt,
    headerForeground: c.headerFg,
    progressTrack: withAlpha(c.accent, 0.2),
    progressFill: withAlpha(c.accent, 0.5),
  },

  // Identity by construction — see the note at the top of this file.
  //
  // `app` is the whole-app role override. For Light and Dark it is the app's
  // own colour layer handed straight back, so ThemeProvider merging it changes
  // nothing at all — which is what keeps those two byte-identical.
  app: pick(c, APP_ROLES),
  audio: pick(c, AUDIO_ROLES),
  nav: pick(c, NAV_ROLES),

  // Seeded into the user's toggles once, the first time a theme is applied.
  // Empty here on purpose: Light and Dark must never touch a user's settings.
  defaults: {},
});

/**
 * The app's OWN bottom navigation for an appearance — the navy bar with white
 * icons that every screen outside the Reader wears.
 *
 * A designed theme states `nav: appNav("dark")` when it wants the bar left
 * exactly as it is everywhere else, rather than tinted to the page. Blue does:
 * a bar derived from its ground is a lighter navy than the app's, and the two
 * sitting a tap apart looked like a bug rather than a theme.
 *
 * Reads the palette rather than repeating the hex, so it cannot drift from the
 * bar it is supposed to match.
 */
export const appNav = (mode) => pick(mode === "dark" ? darkColors : lightColors, NAV_ROLES);

export { SCROLLBAR_INDICATOR };
export default createAppBase;
