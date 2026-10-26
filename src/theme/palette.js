// TIER 1 — primitives. The only file in the app allowed to contain a raw hex.
//
// These name a colour, not a job. Never consume a step directly in a component;
// take a semantic role from `semanticColors.js` instead, so a value can differ
// between themes (and between future user-selectable themes) without the call
// site knowing.
//
// Ramps are generated from a single hue at even lightness steps rather than
// picked by eye, so the steps stay perceptually consistent. Every step carrying
// a contrast guarantee is marked, and `contrast.test.js` fails the build if one
// is edited into non-compliance.

// ── Neutrals — the workhorse ────────────────────────────────────────────────
// Hue 220 at 8–20% saturation: enough cool cast to avoid the dead flat-grey
// look, far too little to read as blue. These carry ~90% of every screen (the
// "60" and the "30" of 60/30/10), in both themes.
//
// 950 is the dark background, deliberately NOT #000000 — pure black against
// near-white text hits 21:1 and causes halation (text appears to shimmer/bleed)
// for many readers, especially on OLED. 17.6:1 is still far above AA.
export const neutral = {
  0: "#ffffff",
  50: "#f9fafb", // dark-mode body text
  100: "#f3f4f6", // light-mode alt ground
  200: "#e5e7eb", // light-mode selected row / divider
  300: "#ced2d9", // dark-mode secondary text
  400: "#a2a8b3", // light-mode disabled text
  500: "#7a8190", // dark-mode disabled text
  600: "#616875", // light-mode secondary text
  700: "#464a53",
  800: "#31343a", // light-mode body text; dark-mode selected row
  850: "#26282c", // dark-mode elevated surface (sheets, modals)
  900: "#1c1e21", // dark-mode surface (cards)
  950: "#131416", // dark-mode background
  1000: "#000000", // scrims only, never a surface
};

// ── Brand navy — the company colour ─────────────────────────────────────────
// Step 800 is the exact existing brand value. Used for brand furniture in light
// mode (app bar, bottom navigation, primary buttons) and as the seed for the
// blue theme shipping later. It is NOT a dark-mode surface: navy grounds were
// dropped in favour of neutrals.
export const navy = {
  50: "#eff3fb",
  100: "#dfe8f6",
  200: "#c2d1eb",
  300: "#97b0d8",
  400: "#6b8ec7",
  500: "#3c6ab4",
  600: "#27539b",
  700: "#174082",
  800: "#113979", // brand base — exact, do not regenerate
  900: "#0b2650",
  950: "#071731",
};

// ── Accent blue — the "10" ──────────────────────────────────────────────────
// Links, active states, focus rings, selected controls. A brighter, cooler hue
// (212) than the brand navy so "tappable" reads differently from "brand
// furniture". The dark steps are ~12% less saturated than a naive lightening
// would give: fully saturated blue on a dark ground reads as neon and vibrates
// against the background.
export const accent = {
  200: "#8dbaec", // dark-mode brand/emphasis text
  300: "#67a2e4", // dark-mode link and accent
  400: "#509bf1",
  500: "#237ee7",
  600: "#1065c6", // light-mode accent / focus ring (≥3:1)
  700: "#0d4f9c", // light-mode link text (≥4.5:1)
};

// ── Status ─────────────────────────────────────────────────────────────────
// Light steps are pinned to the darkest ground they must survive (a selected
// row, neutral 200) rather than to white, so a status label stays legible
// wherever it lands.
export const red = {
  300: "#f07d75", // dark-mode error text
  500: "#d03025",
  600: "#af261d", // light-mode error text (≥4.5:1 on neutral 200)
  700: "#98231b",
};

export const green = {
  300: "#6ecf96", // dark-mode success text
  500: "#2c9658",
  600: "#1e7643", // light-mode success text (≥4.5:1 on neutral 200)
  700: "#1a6639",
};

// Gold is a fixed brand accent. The light-mode *text* step is much darker than
// the decorative one, because saturated yellow cannot clear 4.5:1 on a light
// ground at its natural lightness — the bright step is for fills and icons only.
// Vishraam (pause) marks in Gurbani. Fixed in both themes: they are reading
// marks whose meaning does not change with the theme, and the Reader renders
// them inside a WebView from a plain style string, which has no access to the
// React theme. The gradient pair is the same two colours in rgba form.
export const vishraam = {
  short: "#16a085",
  long: "#d35400",
  shortGradient: "rgba(22, 160, 133,1.0)",
  longGradient: "rgba(211, 84, 0,1.0)",
};

export const gold = {
  200: "#fae7c6",
  400: "#f3b13f", // dark-mode gold text; fills in both themes
  500: "#ec9c13",
  700: "#8a5f14", // light-mode gold text (≥4.5:1 on neutral 200)
};

// ── Third-party brand marks ────────────────────────────────────────────────
// NOT theme values. Never swap these per theme or adjust them for contrast: a
// logotype is exempt from WCAG 1.4.11, and altering it misrepresents the brand.
// They live here only so they are identifiable as deliberate literals rather
// than stray hexes.
export const brandMarks = {
  /**
   * Gurdham's mark: a vertical gradient with a faint light outline. Fixed brand
   * artwork, so it does not track the theme — same reason the social marks below
   * are literals rather than roles.
   */
  /**
   * The Gurdham mark. Its gradient runs periwinkle → near-black indigo in light.
   * On a dark ground an indigo tomb reads as a silhouette however far the stops
   * are lifted — the mark is a solid-filled shape, not an outline — so dark mode
   * carries it in white instead, shaded top-to-bottom so the domes still have
   * form rather than flattening into one white blob.
   */
  gurdham: {
    gradientTop: { light: "#98A6FF", dark: "#FFFFFF" },
    gradientBottom: { light: "#13143C", dark: "#C5CDE0" },
    outline: "#FFFFFF",
  },
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  /** Instagram's mark is a gradient; stops in order. */
  instagram: ["#FEDA75", "#FA7E1E", "#D62976", "#962FBF"],
  substack: "#FF6719",
  tiktokCyan: "#25F4EE",
  tiktokMagenta: "#FE2C55",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  slack: { rose: "#E01E5A", sky: "#36C5F0", green: "#2EB67D", gold: "#ECB22E" },
  /**
   * The letterforms cut out of a solid mark (the "f", the "in", YouTube's
   * play triangle). Part of the logotype, so they stay pure white/black in
   * both themes rather than following the surface.
   */
  cutoutLight: "#FFFFFF",
  cutoutDark: "#000000",
  /**
   * Icon grounds for the other Khalis apps, taken from each app's own artwork so
   * its logo sits on its colour rather than ours. Two per app, because a mark
   * drawn for a light ground disappears on a dark one.
   */
  khalisApps: {
    sahejPath: { dark: "#0a1628", light: "#E2E8F1" },
    sttm: { dark: "#0f2044", light: "#ffffff" },
    shabadavali: { dark: "#0d1c10", light: "#ffffff" },
  },
  /**
   * Plates for Explore tiles whose artwork carries its OWN fixed colours.
   *
   * Fixed rather than themed, for the same reason the marks above are: the
   * artwork's own colours are not ours to change, so the plate is the only
   * thing that can separate it from the card. A themed plate takes its value
   * from the page, which on the dark-based designed themes is exactly the
   * ground these marks disappear into.
   *
   * Two of them, because the two marks pull in opposite directions.
   */
  appIconPlates: {
    /**
     * Under a mark drawn on its own DEEP ground — Sehaj Path's app icon is a
     * navy square with gold linework.
     *
     * Light in both modes, but not the same light. Light mode keeps the pale
     * brand tint the neighbouring tiles use, so this tile does not stand out in
     * a row of them. Dark mode steps one rung down the ramp: the same tint on a
     * near-black card reads as a white block, and the plate is meant to hold
     * the mark, not to be the brightest thing on the screen.
     */
    pale: { light: "#E2E8F1", dark: "#C4CEDD" },
    /**
     * Under a GOLD mark — Sri Darbar Sahib. One deep navy in every theme: gold
     * on a pale plate has nothing to sit against, and this is the same ground
     * the Hukamnama card already puts the darbar photograph on, so the two
     * appearances of the building on this screen agree.
     */
    deep: "#042f67",
  },
  /** Browser chrome for in-app links — the brand navy and its off-white. */
  inAppBrowser: { chrome: "#113979", onChrome: "#FAF9F6" },
  /**
   * The scroll thumb over the bani text. ONE muted blue in both themes, at 50%
   * — it floats over scripture on a light and a dark ground alike, and a
   * theme-derived accent made it two different colours for no reason.
   */
  scrollThumb: "#7A99C9",
  /**
   * The reading-progress bar under the Reader. One track and one fill in both
   * themes: it sits on the bani ground, not on a themed surface, and splitting
   * it per theme made the same bar two different colours mid-session when the
   * user switched.
   */
  readerProgress: { track: "#E0E0E0", fill: "#113979" },
};

export default { neutral, navy, accent, red, green, gold, vishraam, brandMarks };
