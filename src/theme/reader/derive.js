import { mix, withAlpha } from "@theme/colorUtils";
import { contrastRatio, AA_CONTRAST as AA } from "./contrast";

// WCAG's floor for a control or a meaningful outline, as opposed to text.
const UI_CONTRAST = 3;

// How far a card has to sit off the page to read as a card.
//
// Both app themes use the same step — light mode puts white on a recessed grey,
// dark mode a lighter grey on near-black — and both measure 1.10. Matching that
// number is the point: the first cut set the player's surface to the page
// ground itself, which measures 1.00, and the player, the track dialog and the
// mini pill all became invisible boxes on every designed theme.
const CARD_LIFT = 1.1;
// A dialog or toast sits above the player, so it lifts further.
const OVERLAY_LIFT = 1.2;

const WHITE = "#FFFFFF";

// The smallest step from `ground` toward `toward` that reaches `target`.
//
// A fixed mix fraction cannot do this: 4% toward white lifts a near-black page
// by 1.10 but a parchment page by only 1.01, because contrast between two light
// colours moves far more slowly. Solving for the ratio gives every theme the
// same PERCEIVED lift instead of the same arithmetic.
const stepToward = (ground, toward, target) => {
  for (let t = 0.02; t <= 1; t += 0.02) {
    const candidate = mix(ground, toward, t);
    if (contrastRatio(candidate, ground) >= target) return candidate;
  }
  return null;
};

// Deepens `from` toward `toward` until it clears `target` against `backdrop`.
//
// The same solve-for-the-ratio idea as stepToward, pointed at a different
// problem: not "separate these two" but "make this one legible on that". A
// colour that already clears the target comes back untouched, so a theme's own
// declared value is only ever adjusted when it would otherwise fail.
//
// This is what stops a theme shipping a secondary label that reads on the page
// but not on a dialog, which is exactly what Kesari did — its muted ink
// measured 4.43:1 on its own elevated surface, just under AA.
export const readableOn = (from, toward, backdrop, target) => {
  if (contrastRatio(from, backdrop) >= target) return from;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const candidate = mix(from, toward, t);
    if (contrastRatio(candidate, backdrop) >= target) return candidate;
  }
  return toward;
};

// Which way a card separates from the page.
//
// DARK themes lift toward white — the Material convention, and what the app's
// own dark mode does.
//
// LIGHT themes go the other way, toward their own ink. The app's light mode
// puts a white card on a recessed grey, but copying that onto a designed theme
// destroys it: mixing a parchment toward white desaturates the parchment, so
// Puratan's player came out near-white on a cream page and stopped looking like
// the theme at all. Stepping toward the ink keeps the card in the theme's own
// hue family — a deeper cream on cream, which is what Kesari was already doing
// and what reads correctly.
const lifted = (ground, ink, target, mode) =>
  (mode === "dark"
    ? stepToward(ground, WHITE, target) ?? stepToward(ground, ink, target)
    : stepToward(ground, ink, target) ?? stepToward(ground, WHITE, target)) ?? ground;

// Everything a reading theme can work out for itself.
//
// A designed theme declares FIVE colours and nothing else has to be written:
//
//   ground   the page
//   ink      the Gurbani
//   accent   headings, transliteration's parent tone, the player, the nav bar
//   muted    (optional) secondary ink — transliteration, teeka, muted labels
//   rule     (optional) frames, dividers, separators
//
// From those, this file produces every semantic slot in the schema: the four
// text roles, the sync-scroll wash, the scrollbar, the reader chrome, the whole
// audio player, and the bottom navigation. That is ~40 values from 5.
//
// It exists because the alternative is what the first cut of these themes looked
// like: Puratan spelled its accent SIX times across its own file, three as
// "#6B2020" and three as "rgba(107, 32, 32, …)". Changing one colour meant
// finding every spelling by hand with nothing to catch a miss.
//
// EVERY slot below is still overridable — the merge order in schema.js is
// base -> derived -> the theme's own record, so a theme states only where it
// disagrees. Puratan's two-rule frame and White's larger font scale are exactly
// that: a few lines of deliberate divergence on top of a derived whole.
//
// Two things are deliberately NOT derived:
//
//   • `vishraam` — reading marks whose meaning does not change with the theme.
//     They stay on the fixed pair from the base unless a theme moves them, and
//     the only reason to move them is legibility on an unusual ground.
//   • `border.width` — a frame is a design decision, not a colour. Themes get
//     `border.color` for free but draw nothing until they ask for a width.

// The optional primitives, filled in when a theme does not supply them.
//
// `muted` lands 35% of the way from the ink toward the ground: far enough to
// read as secondary, close enough to stay comfortably above AA.
// `rule` is a translucent ink, so it sits correctly on the page whatever the
// ground is, including over a background texture.
const resolvePalette = ({ ground, ink, accent, muted, rule }) => ({
  ground,
  ink,
  accent,
  muted: muted ?? mix(ink, ground, 0.35),
  rule: rule ?? withAlpha(ink, 0.18),
});

// The audio player, its dialogs and the mini pill.
//
// They sit ON the Reader beside the Bani, so a parchment page with a navy player
// reads as broken. The keys are the app's own semantic ROLE names (see
// AUDIO_ROLES in bases/appBase.js), so the result merges straight over
// `theme.c` and every existing style rule in those components keeps working.
//
// One difference from the app's audio chrome: there, the control bar is a
// contrasting navy block. Here it is the page ground, separated by the theme's
// own rule instead of by a colour slab — which is what makes the player read as
// part of the reading surface rather than furniture parked on top of it.
const deriveAudio = ({ ground, ink, accent, muted, rule }, mode) => ({
  // The player, the track dialog, the settings sheet and the mini pill. NOT the
  // page ground — see CARD_LIFT.
  surface: lifted(ground, ink, CARD_LIFT, mode),
  // The confirm dialog and the toast, which sit above the player.
  surfaceElevated: lifted(ground, ink, OVERLAY_LIFT, mode),
  textPrimary: ink,
  textSecondary: muted,
  // Icons, and the played half of the seek slider. `textBrand` and `primary` are
  // one accent here; the app palette can separate them, but a reading theme has
  // a single accent by design.
  textBrand: accent,
  primary: accent,
  accent,
  // Text and icons sitting ON an accent-filled control, so this is the ground —
  // the accent is the fill behind them.
  onPrimary: ground,
  border: rule,
  // The unselected track pill, and the UNPLAYED half of the seek slider. Derived
  // from the ink rather than the accent so it never competes with the played
  // half sitting right beside it.
  surfaceSelected: withAlpha(ink, 0.14),
  // A brand-tinted fill: the active Audios/Options chip behind its icon.
  accentSubtle: withAlpha(accent, 0.12),
  // Its neutral counterpart — the same chip, inactive.
  fillSubtle: withAlpha(ink, 0.08),
  // The download badge's label, which sits on a `border`-coloured strip.
  headerFg: ink,
  link: accent,
  // The Auto Play / Sync Scroll switches. The ON track is the accent with a
  // ground-coloured thumb; the OFF track is a step from the ground toward the
  // ink, and it is the one value here that has to clear 3:1 — WCAG's floor for
  // a control — against both the panel behind it and the thumb sitting on it.
  //
  // Deeper on a light theme, because the same 45% step that reads clearly on a
  // dark ground measured 2.43:1 on Kesari's ivory and 2.64:1 on Puratan's
  // parchment. The guard catches this, so the numbers are checked rather than
  // guessed at.
  controlAccent: accent,
  controlTrackOff: mode === "dark" ? mix(ground, ink, 0.45) : mix(ground, ink, 0.62),
});

// The whole app, from the same five primitives.
//
// Merged over `theme.c` in ThemeProvider, so it reaches every screen — Home,
// Dashboard, Seva, Settings, Bookmarks, every dialog and sheet — not just the
// Reader. The keys are the app's own semantic role names, so no screen's style
// rules change; they simply resolve to themed values.
//
// The status family (error, success, gold), the reading mark and the black
// washes are deliberately absent — see APP_ROLES_FIXED in bases/appBase.js.
// A theme that recoloured them would turn information into decoration.
//
// `primary` follows the NAV bar rather than the accent. It is the tab bar, the
// filled buttons and the selected states — the biggest blocks of colour in the
// app — and an accent-filled tab bar is the same mistake the Reader's nav made:
// the brightest thing on screen, permanently, on a theme chosen for night
// reading.
const deriveApp = ({ ground, ink, accent, muted, rule }, mode, nav) => {
  const surface = lifted(ground, ink, CARD_LIFT, mode);
  // The deepest ground any text can land on, and therefore the one every text
  // role has to stay legible against.
  const surfaceElevated = lifted(ground, ink, OVERLAY_LIFT, mode);

  return {
    // ── Grounds ──────────────────────────────────────────────────────────
    background: ground,
    backgroundAlt: ground,
    surface,
    surfaceElevated,
    surfaceSelected: withAlpha(ink, 0.14),
    fillSubtle: withAlpha(ink, 0.08),
    // The top edge of a raised card. Flat on light, a lift on dark — the same
    // convention the app palette uses.
    edgeHighlight: mode === "dark" ? withAlpha(ink, 0.08) : lifted(ground, ink, CARD_LIFT, mode),

    // ── Ink ──────────────────────────────────────────────────────────────
    textPrimary: ink,
    // Guaranteed against the DEEPEST surface, not just the page — a secondary
    // label has to read on a dialog too.
    textSecondary: readableOn(muted, ink, surfaceElevated, AA),
    textDisabled: mix(muted, ground, 0.45),
    textBrand: accent,
    headerFg: accent,
    link: accent,
    // Text sitting on a `primary`-filled block, which is the nav bar's pair.
    textOnBrand: nav.onPrimary,

    // ── Brand and controls ───────────────────────────────────────────────
    primary: nav.primary,
    primaryPressed: mix(nav.primary, ink, 0.18),
    onPrimary: nav.onPrimary,
    accent,
    accentPressed: mix(accent, ink, 0.18),
    onAccent: ground,
    accentSubtle: withAlpha(accent, 0.12),
    controlAccent: accent,
    controlAccentPressed: mix(accent, ink, 0.18),
    onControlAccent: ground,
    controlTrackOff: mode === "dark" ? mix(ground, ink, 0.45) : mix(ground, ink, 0.62),

    // ── Lines ────────────────────────────────────────────────────────────
    border: rule,
    // Outlines a user can INTERACT with — WCAG holds those to 3:1 against what
    // is behind them, which a flat 40% step does not reach on a light ground.
    borderStrong: readableOn(mix(ground, ink, 0.4), ink, ground, UI_CONTRAST),
    focusRing: accent,
  };
};

/**
 * @param {object} palette The theme's declared primitives.
 * @param {"light"|"dark"} mode The theme's `base` — the appearance it pairs
 *   with. Only the navigation bar reads it; see the note at `nav` below.
 * @returns A partial theme record. Merged BETWEEN the base and the theme's own
 *   record, so it beats the base and loses to anything the theme states.
 */
const deriveFromPalette = (palette, mode) => {
  const p = resolvePalette(palette);
  const { ground, ink, accent, muted, rule } = p;

  // Computed once and shared: the app's `primary` follows the nav bar, so the
  // tab bar and every filled button are the same colour by construction.
  const nav =
    mode === "dark"
      ? { primary: mix(ground, ink, 0.1), onPrimary: ink }
      : { primary: mix(ground, ink, 0.88), onPrimary: ground };

  return {
    palette: p,

    background: { color: ground },

    text: {
      gurbani: { color: ink },
      // Header level 1, and the centred lines inside a bani.
      gurbaniHeading: { color: accent },
      // One step down from the Gurbani, one step above the transliteration —
      // the reading hierarchy every shipped theme sets by hand. An OPAQUE mix,
      // not an alpha of the ink: a translucent translation would shift over a
      // background texture or a highlighted line and stop being that step.
      translation: { color: mix(ink, muted, 0.45) },
      transliteration: { color: muted },
      teeka: { color: muted },
    },

    // The sync-scroll / audio active-line wash. Translucent on purpose, so the
    // enlarged line lifts off the page without hiding the Gurbani on it — the
    // contrast guard measures the ink against this COMPOSITED over the ground.
    highlight: { color: withAlpha(accent, 0.12) },

    scrollbar: { thumb: withAlpha(accent, 0.45), track: "transparent", width: 4 },

    // A frame a theme can opt into with ONE value: `border: { width: 1 }`.
    //
    // Colour, inset and radius are all supplied here, because a bare width is a
    // trap otherwise — the base's inset of 0 draws the rule hard against the
    // viewport edge, which reads as window chrome rather than a ruled page, and
    // a radius of 0 squares off corners that every shipped frame rounds. Those
    // are not decisions a theme should have to rediscover; they are what a frame
    // means here. A theme still overrides any of them, and `width` deliberately
    // stays 0 so nothing is drawn until it is asked for — a frame is a design
    // decision, not a colour.
    border: { color: rule, outerColor: rule, inset: 10, radius: 6 },

    // The header bar and the reading-progress bar, both physically contiguous
    // with the Bani, so they move with the page rather than with the app.
    chrome: {
      headerBackground: ground,
      headerForeground: accent,
      progressTrack: withAlpha(accent, 0.16),
      progressFill: accent,
    },

    audio: deriveAudio(p, mode),

    // The bottom navigation while the Reader is open.
    //
    // Derived from the GROUND, never from the accent. Deriving it from the
    // accent was tried and is wrong: on Blue it produced a bar of bright
    // #7FC4FF across the bottom of a very dark page — the brightest thing on
    // screen, in a theme chosen for reading at night.
    //
    // The bar is a solid block roughly 56pt tall that never scrolls away, so it
    // has to sit QUIETLY against the page while still reading as a bar. Which
    // direction achieves that depends on the appearance, and this is the one
    // place in the file where it does:
    //
    //   dark  — the page is already the darkest thing available, so the bar
    //           lifts slightly off it and carries the page's own ink.
    //   light — a barely-tinted bar would vanish into a pale page, so it goes
    //           the other way, deep into the theme's own hue, and carries the
    //           ground as its ink. That is the same relationship a book's cover
    //           has to its pages: same family, much deeper.
    //
    // Either way the pair is the theme's own two colours, so the bar belongs to
    // the page rather than being app furniture parked on top of it. The active
    // pill is the same pair inverted, which is already how the component draws
    // it — so two values cover both states, and the contrast guard checks them.
    nav,

    // The whole app, from the same five primitives. Merged over `theme.c` in
    // ThemeProvider so it reaches every screen, not just the Reader.
    app: deriveApp(p, mode, nav),
  };
};

export { deriveAudio, resolvePalette };
export default deriveFromPalette;
