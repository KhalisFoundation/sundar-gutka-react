// TIER 2 — semantic roles. What a colour is FOR, not what it looks like.
//
// This is the layer components consume. A call site asks for `textSecondary`
// and gets something readable in whichever theme is active; it never branches
// on `isDark` itself. Every `isDark ? a : b` ternary left in a component is a
// missing role in this file and should be fixed here, not there.
//
// ── Colour budget (60/30/10) ───────────────────────────────────────────────
//   60%  ground      — `background`, `surface`. Neutral. The screen itself.
//   30%  content     — text, borders, elevated surfaces. Also neutral.
//   10%  accent      — `accent`, `link`, `primary`, status. The only saturated
//                      colour on screen, reserved for what the user can act on
//                      or must notice.
// Blue is deliberately confined to that last 10%. Dark mode uses neutral greys
// for every surface; the blue-ground theme ships later as a user choice, and
// slots in as another entry in this file rather than a rewrite.
//
// ── Adding a theme later ───────────────────────────────────────────────────
// A user-selectable theme is a new object with these same keys. Because
// components only ever read role names, a theme cannot break a layout — the
// worst it can do is look wrong, and `contrast.test.js` runs over every
// registered theme, so it cannot even do that silently.

import { gold, green, navy, neutral, red, vishraam } from "./palette";

/**
 * Every role a theme must define. Exported so `contrast.test.js` can assert a
 * theme is complete, and so a future theme editor has something to enumerate.
 */
export const ROLES = [
  "background",
  "backgroundAlt",
  "surface",
  "surfaceElevated",
  "surfaceSelected",
  "scrim",
  "textPrimary",
  "textSecondary",
  "textDisabled",
  "textOnBrand",
  "textBrand",
  "headerFg",
  "link",
  "primary",
  "primaryPressed",
  "onPrimary",
  "controlAccent",
  "controlAccentPressed",
  "onControlAccent",
  "accent",
  "accentPressed",
  "onAccent",
  "border",
  "borderStrong",
  "controlTrackOff",
  "focusRing",
  "error",
  "errorFill",
  "errorSurface",
  "onError",
  "onErrorFill",
  "success",
  "successSurface",
  "gold",
  "goldFill",
  "goldSurface",
  "onGold",
  "fillSubtle",
  "edgeHighlight",
  "accentSubtle",
  "vishraamShort",
  "shadow",
];

const light = {
  // ── Ground (60%) ───────────────────────────────────────────────────────
  background: neutral[0],
  // The secondary ground, for screens that need cards to read as raised
  // (Dashboard, Seva). Neutral, not tinted.
  backgroundAlt: neutral[100],
  surface: neutral[0],
  // Light mode conveys elevation with a real shadow, so a raised surface stays
  // the same colour as the base one.
  surfaceElevated: neutral[0],
  surfaceSelected: neutral[200],
  scrim: "rgba(0, 0, 0, 0.5)",

  // ── Content (30%) ──────────────────────────────────────────────────────
  textPrimary: neutral[800],
  textSecondary: neutral[600],
  textDisabled: neutral[400],
  border: neutral[200],
  // Outlines a user can interact with, held to 3:1. Not interchangeable with
  // `border`, which is decorative and exempt.
  borderStrong: navy[500],
  // The "off" half of a switch or slider. One value serves both themes — it
  // clears 3:1 against either ground and against the thumb, so the switch
  // needs no per-theme branch at all.
  controlTrackOff: neutral[500],

  // ── Accent (10%) ───────────────────────────────────────────────────────
  primary: navy[800],
  primaryPressed: navy[900],
  onPrimary: neutral[0],

  // ── Interactive blue ───────────────────────────────────────────────────
  // The blue a user can ACT on: a switch that is on, a selected radio or
  // amount pill, a focused field, the Donate button.
  //
  // Split from `primary` because the two only look alike in light mode.
  // `primary` is brand CHROME — the bottom navigation — and stays navy in both
  // themes. On a near-black ground that navy measures
  // 1.3:1, which is fine behind white text on a big filled bar but far too
  // quiet for a control the user is meant to spot, so dark mode lifts THIS
  // role to a bright blue and leaves the chrome alone.
  //
  // Light mode is navy here, exactly as it was when the switch read `primary`,
  // so nothing about the light theme changes.
  controlAccent: navy[800],
  controlAccentPressed: navy[900],
  onControlAccent: neutral[0],

  textOnBrand: neutral[0],
  textBrand: navy[800],
  // Screen-header foreground — the title and every icon in a header bar (back
  // arrow, close cross, actions). Deliberately NOT `textPrimary`: near-black
  // read as heavy and unbranded across the top of every screen. Light mode is
  // the same navy as the bottom navigation, so the two ends of the screen
  // agree; dark mode goes to plain white, because a tinted blue on a near-black
  // bar reads as a coloured state rather than as chrome.
  //
  // A header icon that carries its own meaning — the destructive delete in
  // Manage Downloads — sets its own colour and does not use this.
  headerFg: navy[800],
  // ONE blue in light mode, exactly as dark mode has one.
  //
  // It is the navigation bar's navy, so every blue thing in the app agrees with
  // the bar at the bottom of the screen. There used to be three — navy[800] for
  // chrome and controls, accent[600] for accents, accent[700] for links — which
  // no rule distinguished and which had no counterpart in dark mode, where all
  // of these already collapse to a single value.
  //
  // 11.14:1 on white, the highest contrast of the three it replaces.
  link: navy[800],
  accent: navy[800],
  accentPressed: navy[900],
  // Content drawn ON an accent fill — a checked checkbox's tick, a badge label.
  // Light mode's accent is dark enough to take white; dark mode's is a lighter
  // tint and needs near-black, which is why this is a role and not a literal.
  onAccent: neutral[0],
  focusRing: navy[800],

  error: red[600],
  // The FILL of a destructive button, which is not the same job as error TEXT.
  // Text has to clear 4.5:1 on every surface, which pushes it to the dark end
  // of the ramp; a whole button painted that dark reads as heavy and severe.
  // A fill only has to hold its own shape (3:1) and carry its label (4.5:1), so
  // it can be the lighter, less sombre red one step up the ramp.
  errorFill: red[500],
  errorSurface: "#fdecea",
  // Text sitting ON an error fill (a destructive button). Light mode's error is
  // dark enough to take white; dark mode's is a light tint and needs the
  // opposite, which is exactly the kind of flip a component must never make
  // for itself.
  onError: neutral[0],
  // The label on that fill. White on the lighter red is 5.08:1.
  onErrorFill: neutral[0],
  success: green[600],
  successSurface: "#e8f5ee",
  gold: gold[700],
  goldFill: gold[400],
  goldSurface: gold[200],
  // Content drawn ON a gold fill. Near-black in BOTH themes, because `goldFill`
  // is the same mid-yellow in both: white on it measures about 2:1 and fails
  // 1.4.3 outright, which is what the "NEW" badge was doing.
  onGold: neutral[950],

  // ── Low-emphasis fills ────────────────────────────────────────────────────
  // The tint behind an icon, a chip, an inactive chart bar. Six different white
  // opacities and four different blue ones were hand-rolled across the
  // Dashboard for this; these are the two that replace them.
  /** Neutral tint — icon chips, inactive controls. */
  fillSubtle: neutral[100],
  // The top edge of a raised card. Light mode gives it the surface colour so the
  // edge reads as catching the light above it; dark mode has nothing above to
  // catch, so it takes the plain border and the card reads flat — which is what
  // dark wants anyway, depth there coming from the surface ladder.
  edgeHighlight: neutral[0],
  /** Brand-tinted fill — today's date, an active chip, an inactive bar. */
  accentSubtle: navy[50],

  // Marks a short vishraam (pause) in Gurbani. It is TEXT, so it has to clear
  // 4.5:1 like any other text: the old fixed teal (#16a085) measured 3.28:1 on
  // white and failed. Reusing the green ramp rather than adding a colour keeps
  // the palette small.
  vishraamShort: vishraam.short,

  shadow: neutral[1000],
};

/**
 * Dark mode's single blue, client-specified.
 *
 * Deliberately a literal rather than a step off the `accent` ramp: it is a
 * brand decision, not a generated tint, and pinning it here means the two dozen
 * roles below cannot drift apart the way the old four blues did. Light mode
 * does not use it at all.
 */
const BLUE = "#3B82F6";
/** One step down, for pressed states. */
const BLUE_PRESSED = "#2563EB";

const dark = {
  // ── Ground (60%) ───────────────────────────────────────────────────────
  // All neutral. Depth comes from a lightness ladder, because a drop shadow
  // has too little contrast to read as elevation on a dark ground.
  background: neutral[950],
  backgroundAlt: neutral[950],
  surface: neutral[900],
  surfaceElevated: neutral[850],
  surfaceSelected: neutral[800],
  // Heavier than light mode's: a scrim must still separate a sheet from an
  // already-dark background.
  scrim: "rgba(0, 0, 0, 0.7)",

  // ── Content (30%) ──────────────────────────────────────────────────────
  textPrimary: neutral[50],
  textSecondary: neutral[300],
  textDisabled: neutral[500],
  border: neutral[800],
  borderStrong: neutral[500],
  controlTrackOff: neutral[500],

  // ── Accent (10%) ───────────────────────────────────────────────────────
  // ONE blue for everything interactive or emphasised in dark mode.
  //
  // The brand navy measures 1.3:1 on this ground. Behind white text on a big
  // filled bar that is fine, which is why the bottom navigation keeps it — but
  // for a switch, a link, a chart bar or a figure it is barely there. Every
  // such role below resolves to the same bright blue instead, so dark mode
  // shows one blue rather than the four near-identical steps it used to.
  //
  // Measured on this theme's own surfaces:
  //   BLUE on background   5.0:1  — passes AA for text
  //   BLUE on surface      4.5:1  — passes AA for text
  //   BLUE on a sheet      4.0:1  — under AA; bounded exception in the tests
  //   white ON the blue    3.7:1  — under AA for small text; see below
  //
  // Content drawn ON the blue is WHITE, not the near-black that measures
  // better. A solid blue button with black text reads as a rendering fault
  // rather than as a considered choice, and light mode has always been white
  // on navy. `#2563EB` as the fill would carry white at 5.2:1 if strict AA
  // matters more than matching this exact hex.
  primary: navy[800],
  primaryPressed: navy[700],
  onPrimary: neutral[0],

  /** See the light-mode note: chrome stays navy, controls lift to the blue. */
  controlAccent: BLUE,
  controlAccentPressed: BLUE_PRESSED,
  // WHITE on the blue, like light mode and like every filled blue button.
  // Near-black measures better on paper (5.0:1 vs 3.7:1) but reads as a bug:
  // a solid blue Donate button with black text on it looks broken, not
  // accessible. See the bounded exception in contrast.test.js.
  onControlAccent: neutral[0],

  textOnBrand: neutral[0],
  textBrand: BLUE,
  /** Header chrome is white here, not a blue tint. */
  headerFg: neutral[50],
  link: BLUE,
  accent: BLUE,
  accentPressed: BLUE_PRESSED,
  // White, matching onControlAccent — the same blue underneath both, so the
  // content on it must not differ between a Settings control and a Dashboard
  // pill.
  onAccent: neutral[0],
  focusRing: BLUE,

  error: red[300],
  // Dark mode's red is already a light tint — the fill is not the heavy block
  // light mode's was, so text and fill share it.
  errorFill: red[300],
  errorSurface: "#3a1512",
  onError: neutral[950],
  onErrorFill: neutral[950],
  success: green[300],
  successSurface: "#0f2e1d",
  gold: gold[400],
  goldFill: gold[400],
  goldSurface: "#3a2a0d",
  /** Same near-black as light mode — `goldFill` is identical in both. */
  onGold: neutral[950],

  // ── Low-emphasis fills ────────────────────────────────────────────────────
  // The dark-mode counterparts. Opaque steps off the neutral ladder rather than
  // translucent white: a `rgba(255,255,255,0.08)` composites differently on
  // every surface it lands on, which is why the same chip looked like three
  // different greys depending on which card it sat in.
  fillSubtle: neutral[800],
  /** See the light-mode note — flat on dark. */
  edgeHighlight: neutral[800],
  /** Brand-tinted fill. Navy is invisible here, so this is a dark accent step. */
  accentSubtle: "#1b3454",

  /** See the light-mode note. 8.8:1 on the dark surface. */
  vishraamShort: vishraam.short,

  shadow: neutral[1000],
};

export { light, dark };
export default { light, dark };
