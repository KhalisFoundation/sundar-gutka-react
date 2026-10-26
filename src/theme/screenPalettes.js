import { mix } from "./colorUtils";
import { green } from "./palette";
import { designedRolesFor, themedScreenPalette } from "./reader/screenPalette";

// Screen-scoped palettes.
//
// These are the colours the Dashboard, Seva and the bani list carried before the
// token migration, restored deliberately. They are NOT part of the semantic
// layer and must not be used anywhere else: `semanticColors.js` still owns the
// roles every other screen reads, and mixing the two is what produced the
// mismatch these replace.
//
// ── Why a separate file rather than more roles ─────────────────────────────
// A semantic role answers "what is this colour FOR" and must hold for every
// screen. These do not: the Dashboard's navy card and Seva's bordered amount
// pill are decisions about two specific screens, and folding them into
// `semanticColors` would either bloat it with screen-specific names or, worse,
// tempt a third screen into reading them.
//
// ── Shaped for the theme system that is coming ────────────────────────────
// Every palette is `{ light, dark }` with identical keys, exactly like a theme.
// When user-selectable themes land, a theme supplies its own object with these
// same keys and nothing else changes — the screens already read by key rather
// than by literal. `paletteFor` is the single resolution point, so a theme id
// can be threaded through it later without touching a call site.

/**
 * The brand navy and its tints, all mixed from `base` with white.
 *
 * Two steps are pinned by contrast rather than chosen by eye:
 *   tint25 — the lightest step still clearing 4.5:1 for small text on both
 *            light grounds (5.40 on white, 4.89 on tint94).
 *   tint40 — the lightest step still clearing 3:1 for a non-text edge on
 *            tint94 (3.45).
 * Anything lighter than tint40 is decorative only: fills, dividers, disabled.
 */
export const brandRamp = {
  base: "#113979",
  tint15: "#35578D",
  tint25: "#4D6B9B",
  tint40: "#6B84AC",
  tint45: "#7C92B5",
  tint60: "#A0B0C9",
  tint75: "#C4CEDD",
  tint88: "#E2E8F1",
  tint94: "#F1F4F9",
  /** The base disappears on a near-black ground; this keeps its hue and lifts L. */
  accentOnDark: "#558DE7",
};

/** Client-fixed gold. Warmer in dark so it still reads against near-black. */
const gold = { light: "#eb9d18ff", dark: "#f2b03e" };

const white = "#FFFFFF";
/** The off-white the old themes used for text on dark grounds. */
const offWhite = "#faf9f6";
/**
 * A completed day in the week strip. Green, because a tick is a "yes" and the
 * decorative gold read as a highlight rather than an achievement.
 *
 * The two modes take opposite steps of the ramp and therefore opposite ticks:
 * the light fill is dark enough to carry a white tick (5.63:1), the dark fill
 * is light enough that only a dark one works (8.25:1 against the card colour).
 * Gold carried white in both and measured 2.24:1 and 1.90:1 — under the 3:1
 * that 1.4.11 asks of a graphical object — so this is a contrast fix as much
 * as a colour change. Both fills also clear 3:1 against their own card, which
 * is what today's unfilled ring needs.
 */
const streakDone = {
  light: { fill: green[600], tick: white },
  dark: { fill: green[300], tick: "#062346" },
};

const dashboard = {
  light: {
    screenBg: brandRamp.tint94,
    cardBg: white,
    primaryText: "#121212",
    /** A brand tint, not an unrelated grey-blue. */
    mutedText: brandRamp.tint25,
    separator: "#eeeeee",
    /**
     * The headline colour: a card's big number, and the Fateh at the top of the
     * header. Brand blue in light, white in dark — the one pair on this screen
     * that inverts rather than tinting, because a headline has to read as ink.
     */
    brandText: brandRamp.base,
    accentBlue: brandRamp.base,
    gold: gold.light,
    /** A completed day in the week strip, and its tick. */
    streakDone: streakDone.light.fill,
    onStreakDone: streakDone.light.tick,
    /**
     * A card's own title line. Pre-overhaul #0F3677, another near-navy off the
     * brand blue by a few points; folded onto the brand blue with accentText.
     */
    cardTitle: brandRamp.base,
    cardMeta: "#8D9FBD",
    /** Tinted icon plates: warm for sun/sunrise, brand for sunset, neutral for night. */
    goldSurface: "#FBF1E2",
    accentSurface: brandRamp.tint88,
    neutralSurface: "#ECEEF2",
    /** Null means "leave the platform switch on its default colours". */
    switchOffThumb: null,
    switchOnTrack: null,
    switchOffTrack: null,
    /**
     * The list sections (calendar, most read, most listened) sit on their OWN
     * ground, a step darker than a card in dark mode. Folding these into one
     * "surface" role is what flattened the screen — they are separate here
     * precisely because they always were.
     */
    sectionBg: white,
    /** The circular play button and the tinted plate behind a section icon. */
    playButtonBg: "rgba(0,0,0,0.06)",
    iconPlate: brandRamp.tint88,
    /** The header's date pill. */
    headerPill: brandRamp.tint75,
    /** The line under the name in the header — tint45, lighter than mutedText. */
    subtleText: brandRamp.tint45,
    /** Explore's heading is brand navy in light, plain white in dark. */
    exploreTitle: brandRamp.base,
    /** The glyph inside an Explore tile: accent in light, white on the navy card. */
    tileIcon: brandRamp.base,
    /** The streak flame and its plate. One warm orange in both themes. */
    flame: "#F5A623",
    flameBg: "#FFF3E0",
    /** Text on a filled accent cell in the calendar. */
    onAccent: white,
    /**
     * The Hukamnama / Random Shabad card is a DEEP NAVY panel in BOTH themes —
     * light mode included. Its contents therefore never follow the theme's text
     * roles: they are always light-on-navy, which is why they are their own keys
     * rather than textPrimary/textSecondary.
     */
    vaakCardBg: "#042f67",
    onVaakCard: "#fff",
    onVaakCardMuted: "#c9ced5ff",
    /** The unselected Vaak/Shabad tab, and the shuffle pill beside it. */
    vaakTabBg: brandRamp.tint88,
    vaakTabActiveBg: "#FBF1E2",
    shufflePillBg: brandRamp.tint88,
    backdropOpacity: 0.16,
    /**
     * The list sections computed their OWN blue rather than using accentBlue:
     * the brand navy in light, a brighter blue in dark than the header uses.
     */
    sectionAccentBlue: brandRamp.base,
    /** The stat label under a big number. */
    statLabel: "#5E7090",
    /** The Journey header: its ground, its title and its invocation line. */
    journeyBg: white,
    journeyTitle: brandRamp.base,
    invocationText: "#718096",
    journeyFlameBg: "#FFF3E0",
    /** A feature tile: its hairline and the plate behind its glyph. */
    tileBorder: "rgba(0,0,0,0.07)",
    tileIconBg: "rgba(0,0,0,0.06)",
    /** The icon box in the day-detail sheet. */
    dayIconBg: "#EEF2FF",
    /** The calendar heat ramp is mixed from these at each level. */
    heatRgb: "17,57,121",
    todayFill: "rgba(17,57,121,0.15)",
    /** The Khalis app tiles keep one edge and one shadow in both themes. */
    appTileBorder: "rgba(100, 116, 139, 0.3)",
    appTileShadow: "#64748B",
    /** The thumb was a fixed white disc with a hairline, in both themes. */
    switchOnThumb: white,
    switchThumbBorder: "rgba(0,0,0,0.1)",
    /** The dashed "missed day" ring — equally faint on the light and dark card. */
    missedFill: "rgba(150, 150, 150, 0.12)",
    /**
     * The week chart's bars. Pre-overhaul this was its own brighter blue
     * (#006bde); it is the brand navy now so the chart matches the nav bar and
     * every other blue on the screen.
     */
    chartBar: brandRamp.base,
    chartBarInactive: brandRamp.tint75,
    /** The unfilled part of the Nitnem progress ring. */
    ringTrack: "#e6ebf5",
    /**
     * The rule between rows in a sheet list. The card separator (#eeeeee) is
     * all but invisible against the sheet's own pale ground, so a list that
     * needs its rows told apart uses this instead.
     */
    listDivider: brandRamp.tint75,
    /**
     * Nitnem's figures and labels: the ring count, "banis left today", a
     * completed bani name and Mark Done. Pre-overhaul this was #133a78 — a
     * near-navy a few points off the brand blue for no reason anyone recorded.
     * It is THE brand blue now, so every blue on this screen is one blue.
     */
    accentText: brandRamp.base,
    /**
     * "Your practice": the big figure is the brand blue (white in dark), its
     * label a muted slate, its icon the brand blue (a pale blue in dark). All
     * three had collapsed onto textPrimary/accent, which put the headline
     * number in near-black.
     */
    heroLabel: "#5E7090",
    heroIcon: brandRamp.base,
  },
  dark: {
    screenBg: "#031329",
    cardBg: "#062346",
    primaryText: offWhite,
    mutedText: "#a1bee7ff",
    separator: "rgba(190, 210, 242, 0.23)",
    brandText: white,
    accentBlue: brandRamp.accentOnDark,
    gold: gold.dark,
    streakDone: streakDone.dark.fill,
    onStreakDone: streakDone.dark.tick,
    cardTitle: offWhite,
    cardMeta: "#a1bee7ff",
    // Tints of the icon's own colour, so each plate reads as a wash of it
    // rather than as a grey box on the card.
    goldSurface: "rgba(210,144,48,0.14)",
    accentSurface: "rgba(85,141,231,0.14)",
    neutralSurface: "rgba(255,255,255,0.06)",
    switchOffThumb: "#33456A",
    switchOnTrack: "#5A8DEF",
    switchOffTrack: "#1B2B47",
    sectionBg: "#041126",
    playButtonBg: "rgba(255,255,255,0.08)",
    iconPlate: "rgba(255,255,255,0.08)",
    headerPill: "rgba(85,141,231,0.25)",
    subtleText: "#a1bee7ff",
    exploreTitle: white,
    tileIcon: white,
    flame: "#F5A623",
    flameBg: "rgba(245,166,35,0.15)",
    onAccent: white,
    vaakCardBg: "#062346",
    onVaakCard: "#fff",
    onVaakCardMuted: "#c9ced5ff",
    vaakTabBg: "rgba(255,255,255,0.06)",
    vaakTabActiveBg: "rgba(210,144,48,0.16)",
    shufflePillBg: "rgba(85,141,231,0.16)",
    backdropOpacity: 0.12,
    sectionAccentBlue: "#2581df",
    statLabel: "#a1bee7ff",
    journeyBg: "#041126",
    journeyTitle: white,
    invocationText: "#8A99AD",
    journeyFlameBg: "rgba(245,166,35,0.13)",
    tileBorder: "rgba(255,255,255,0.08)",
    tileIconBg: "rgba(255,255,255,0.1)",
    dayIconBg: "rgba(100,150,255,0.15)",
    heatRgb: "85,141,231",
    todayFill: "rgba(85,141,231,0.22)",
    appTileBorder: "rgba(100, 116, 139, 0.3)",
    appTileShadow: "#64748B",
    /** The thumb was a fixed white disc with a hairline, in both themes. */
    switchOnThumb: white,
    switchThumbBorder: "rgba(0,0,0,0.1)",
    missedFill: "rgba(150, 150, 150, 0.12)",
    chartBar: "#429aff",
    chartBarInactive: "rgba(85,141,231,0.25)",
    ringTrack: "rgba(255,255,255,0.12)",
    accentText: "#E8EEF7",
    heroLabel: offWhite,
    heroIcon: "#a1bee7ff",
    listDivider: "rgba(190, 210, 242, 0.38)",
  },
};

const seva = {
  light: {
    pageBg: brandRamp.tint94,
    /** The amount card: the page's own pale ground, not a white slab. */
    cardBg: brandRamp.tint94,
    /** The donate / means cards: a true white panel that lifts off the page. */
    panelBg: white,
    /** The tinted plate behind a card's icon. */
    insetBg: brandRamp.tint88,
    /** The small circle inside the donate button — white in both themes. */
    brightBg: white,
    heading: brandRamp.base,
    bodyText: brandRamp.tint15,
    mutedText: brandRamp.tint25,
    link: brandRamp.base,
    /** The faint 1pt outline on a card. */
    border: brandRamp.tint88,
    /** The 2pt outline on an unselected amount pill. Heavier on purpose. */
    borderStrong: brandRamp.tint40,
    selectedBg: brandRamp.base,
    selectedBorder: brandRamp.base,
    selectedText: white,
    noteBg: "#EBF8FF",
    noteText: "#2B6CB0",
    badgeBg: "#FEFCBF",
    badgeText: "#744210",
    bannerBg: "#FEFCBF",
    bannerBorder: "#ECC94B",
    bannerText: "#744210",
    radioRing: brandRamp.base,
    highlight: "#ECC94B",
    /**
     * "Other ways to do Seva": one hue per means, keyed by the page the row
     * links to. Fixed in both themes — the hue is what identifies the row, so
     * it is not a role and does not follow the mode. The disc behind each icon
     * is the same hue at 13%.
     */
    meansTints: {
      social: "#8B7CF6",
      coding: "#22B8CF",
      qa: "#37B24D",
      other: "#E0A93B",
    },
  },
  dark: {
    pageBg: "#041126",
    cardBg: "#062346",
    panelBg: "#0C2036",
    insetBg: "#12294A",
    brightBg: white,
    heading: offWhite,
    bodyText: "#A9B7C6",
    mutedText: "#A0AEC0",
    link: "#4299E1",
    border: "#1B3A5B",
    borderStrong: "#2D3748",
    selectedBg: brandRamp.base,
    selectedBorder: brandRamp.base,
    selectedText: white,
    noteBg: "#12294A",
    noteText: "#8496A9",
    badgeBg: "#1A365D",
    badgeText: "#FEFCBF",
    bannerBg: "#1A365D",
    bannerBorder: "#2B6CB0",
    bannerText: "#EBF8FF",
    radioRing: "#4299E1",
    highlight: "#ECC94B",
    /**
     * "Other ways to do Seva": one hue per means, keyed by the page the row
     * links to. Fixed in both themes — the hue is what identifies the row, so
     * it is not a role and does not follow the mode. The disc behind each icon
     * is the same hue at 13%.
     */
    meansTints: {
      social: "#8B7CF6",
      coding: "#22B8CF",
      qa: "#37B24D",
      other: "#E0A93B",
    },
  },
};

/**
 * The bani list restores ONLY its ground. Everything else on that screen — row
 * text, dividers, the header foreground — stays on the semantic roles.
 */
const baniList = {
  light: { surface: "rgba(255, 255, 255, 1)" },
  dark: { surface: "#041126" },
};

/**
 * Settings and the utility pages around it, in DARK MODE ONLY.
 *
 * Settings itself, Reminder Options, Edit Bani Order, Database Update, Manage
 * Downloads, About and Bookmarks. The routes that opt in are listed in one
 * place — the navigation graph.
 *
 * The same navy hierarchy the bani list and Seva use, so the app reads as one
 * surface system rather than a navy half and a neutral-grey half:
 *
 *   page   #041126  the ground, level with the bani list and the Seva page
 *   card   #062346  a raised block on it
 *   inset  #12294A  a plate, or a row's press state, inside a card
 *   edge   #1B3A5B  the hairline between rows
 *
 * Light mode is deliberately absent — it was never the half that looked out of
 * place, and the role function returns nothing for it, so the semantic layer
 * applies untouched.
 *
 * This is NOT the chooser sheet: that keeps its own grey (below), and its
 * provider nests inside this one, so the inner scope wins.
 */
const settings = {
  light: {},
  dark: {
    pageBg: "#041126",
    cardBg: "#062346",
    insetBg: "#12294A",
    border: "#1B3A5B",
    text: offWhite,
    mutedText: "#a1bee7ff",
    accent: "#4299E1",
  },
};

/**
 * The chooser sheet on the SETTINGS screen only.
 *
 * Not the Dashboard's sheets, not the audio player's, not the time picker —
 * those keep the shared `Sheet` presentation. Only the sheet that opens when a
 * settings row is tapped is overridden, which is why this is a palette rather
 * than a change to `Sheet` itself.
 */
const settingsSheet = {
  light: {
    surface: "#faf9f6",
    divider: "#eeeeee",
    title: "#121212",
    scrim: "rgba(0, 0, 0, 0.5)",
  },
  // Dark follows the Settings screen it opens from: the navy card on the navy
  // ground, with the same hairline between rows. The mid-grey it restored to
  // was faithful to the old build but read as a foreign surface once the screen
  // behind it went navy.
  dark: {
    surface: settings.dark.cardBg,
    divider: settings.dark.border,
    title: settings.dark.text,
    scrim: "rgba(0, 0, 0, 0.5)",
  },
};

export const screenPalettes = { dashboard, seva, baniList, settings, settingsSheet };

const paletteForInternal = (screen, mode) => {
  const palette = screenPalettes[screen];
  if (!palette) return {};
  return palette[mode === "dark" ? "dark" : "light"];
};

/**
 * Seva's palette expressed as ROLE overrides.
 *
 * Seva's stylesheet reads semantic roles throughout (`c.surface`, `c.border`,
 * `c.controlAccent`…), and that is worth keeping — it is the architecture every
 * other screen uses. So rather than rewriting a hundred call sites to read
 * palette keys, the screen resolves those same roles to its own values and
 * every existing `c.x` keeps working.
 *
 * Only the roles Seva actually draws with are overridden; anything else still
 * falls through to the semantic layer.
 */
/**
 * The Dashboard's palette expressed as ROLE overrides.
 *
 * Its components read semantic roles directly (`c.surface`, `c.textPrimary`,
 * `c.border`…) rather than the aliases `useDashboardTheme` returns, so changing
 * only those aliases left the screen looking exactly as it did. Overriding the
 * roles is what actually reaches every card, chart and list on the screen.
 */
export const dashboardRoles = (mode) => {
  const p = paletteForInternal("dashboard", mode);
  return {
    background: p.screenBg,
    backgroundAlt: p.screenBg,
    surface: p.cardBg,
    surfaceElevated: p.cardBg,
    surfaceSelected: p.cardBg,
    textPrimary: p.primaryText,
    textSecondary: p.mutedText,
    border: p.separator,
    borderStrong: p.separator,
    textBrand: p.accentBlue,
    accent: p.accentBlue,
    controlAccent: p.accentBlue,
    link: p.accentBlue,
    gold: p.gold,
    goldFill: p.gold,
  };
};

export const sevaRoles = (mode) => {
  const p = paletteForInternal("seva", mode);
  return {
    backgroundAlt: p.pageBg,
    surface: p.cardBg,
    surfaceElevated: p.panelBg,
    surfaceSelected: p.insetBg,
    surfaceBright: p.brightBg,
    textPrimary: p.heading,
    textSecondary: p.mutedText,
    border: p.border,
    borderStrong: p.borderStrong,
    controlAccent: p.selectedBg,
    controlAccentPressed: p.selectedBg,
    onControlAccent: p.selectedText,
    textBrand: p.link,
    accent: p.link,
    link: p.link,
    /** The retention banner: a warm badge in light, a deep blue one in dark. */
    goldSurface: p.bannerBg,
    gold: p.bannerBorder,
  };
};

/**
 * Settings' role overrides. Dark only — light returns nothing and falls
 * straight through to the semantic layer.
 */
export const settingsRoles = (mode) => {
  if (mode !== "dark") return {};
  const p = paletteForInternal("settings", mode);
  return {
    background: p.pageBg,
    backgroundAlt: p.pageBg,
    surface: p.cardBg,
    surfaceElevated: p.cardBg,
    surfaceSelected: p.insetBg,
    border: p.border,
    borderStrong: p.border,
    textPrimary: p.text,
    textSecondary: p.mutedText,
    accent: p.accent,
    controlAccent: p.accent,
    link: p.accent,
    textBrand: p.accent,
    // The call-to-action pair — its OWN roles, never `primary`, which is what
    // the bottom nav bar paints itself with.
    //
    // WITHOUT these a primary Button kept the semantic
    // navy (#113979) while the card under it became this palette's own navy
    // (#062346) — 1.41:1, so the button had no visible background at all. It is
    // why OK on the reminder sheets and Create/Rename on the pothi sheets read
    // as bare text.
    //
    // The accent measures 5.14:1 on the card, and the page navy 6.18:1 as the
    // label on it; white would have been 3.05:1 and failed.
    ctaFill: p.accent,
    ctaFillPressed: mix(p.accent, p.pageBg, 0.2),
    onCtaFill: p.pageBg,
  };
};

/**
 * The Settings chooser sheet's palette expressed as ROLE overrides.
 *
 * The sheet's contents are shared primitives — `Row`, `Text`, the checkmark —
 * and they read roles like everything else. Overriding the roles for the
 * subtree is therefore what restores the old look without any of them growing
 * a colour prop. See `ScreenRolesProvider`.
 */
export const settingsSheetRoles = (mode) => {
  const p = paletteForInternal("settingsSheet", mode);
  return {
    background: p.surface,
    backgroundAlt: p.surface,
    surface: p.surface,
    surfaceElevated: p.surface,
    /** No pressed-state fill: the old rows gave opacity feedback, not a tint. */
    surfaceSelected: p.surface,
    border: p.divider,
    borderStrong: p.divider,
    textPrimary: p.title,
    /** The checkmark was the title colour, not the app accent. */
    accent: p.title,
    controlAccent: p.title,
    scrim: p.scrim,
  };
};

/**
 * The one registry of screen role overrides.
 *
 * A screen never reaches for its own palette keys in a stylesheet — it resolves
 * the SAME semantic roles the rest of the app reads, to its own values. That is
 * what keeps a screen swap to a future theme a one-line change here rather than
 * an edit at every call site.
 */
const screenRoles = {
  dashboard: dashboardRoles,
  seva: sevaRoles,
  settings: settingsRoles,
  settingsSheet: settingsSheetRoles,
};

/** The role overrides a screen applies, or {} for a screen that has none. */
export const rolesFor = (screen, mode) => (screenRoles[screen] ? screenRoles[screen](mode) : {});

/**
 * Layout overrides, applied the same way the colour ones are.
 *
 * A screen-scoped look is not only colour: the Settings chooser's rows were
 * padding around their text with no height floor, and its panel ended at the
 * safe area rather than 24pt above it. Those are the numbers that made it the
 * compact sheet it was.
 *
 * These are applied AFTER the tokens are resolved, so they land as the exact
 * numbers written here. That is deliberate: the old sheet used flat 16/24
 * padding that never scaled, and letting the device scale multiply them is
 * what made this sheet noticeably taller than the one it replaces. Nothing is
 * clipped by it — the row height floor is 0, so a row still grows with its
 * text at any font size.
 */
const screenLayouts = {
  settingsSheet: (layout) => ({
    ...layout,
    row: {
      ...layout.row,
      // The rows were sized BY their content: no floor, just even padding.
      minHeight: 0,
      minHeightTwoLine: 0,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    sheet: {
      ...layout.sheet,
      // The last row ran to the safe area; the panel added nothing below it.
      paddingBottom: 0,
      /** The title block: even padding all round, as it was. */
      titlePadding: 24,
    },
  }),
};

/** A screen's layout overrides applied over the theme's, or it unchanged. */
export const layoutFor = (screen, layout) =>
  screenLayouts[screen] ? screenLayouts[screen](layout) : layout;

/** A designed theme with one screen's own role adjustments, or it unchanged. */
const designedThemeForScreen = (theme, screen) => {
  const roles = designedRolesFor(screen, theme.c);
  return roles ? { ...theme, c: { ...theme.c, ...roles } } : theme;
};

/**
 * A theme with one screen's roles applied over it.
 *
 * This is the single entry point for a screen-scoped stylesheet:
 *
 *   const { c } = themeForScreen(theme, "seva");
 *
 * Every "c.x" below that line keeps working and only the VALUES differ, so no
 * stylesheet carries a literal colour and none of them has to change when user
 * themes land — only "screenRoles" above does.
 */
export const themeForScreen = (theme, screen) =>
  // A DESIGNED reading theme wins. Its `app` group has already recoloured
  // `theme.c` in ThemeProvider, and layering a screen palette on top would
  // paint the app's navy straight back over it — Dashboard and Seva would be
  // the only screens a theme never reached.
  //
  // The guard lives HERE rather than in useTheme() because most of these
  // screens never go through the ScreenRolesProvider: Dashboard, Seva and their
  // twenty-odd components call themeForScreen() directly from their own style
  // factories, which is exactly how the first attempt at this missed them.
  //
  // Their hierarchy is not lost. A theme's own background / surface /
  // surfaceElevated carry the same recessed-raised-lifted ladder, derived from
  // its five primitives instead of hand-written per screen.
  //
  // A designed theme still takes that screen's own small adjustments, where the
  // derived ladder does not suit the screen's layout — see
  // `designedRolesFor()`. There are none for most screens, which return the
  // theme untouched.
  theme.designedTheme
    ? designedThemeForScreen(theme, screen)
    : {
        ...theme,
        c: { ...theme.c, ...rolesFor(screen, theme.mode) },
      };

/**
 * Resolves a screen's palette for the active mode.
 *
 * @param {"dashboard"|"seva"|"baniList"} screen Which palette to read.
 * @param {"light"|"dark"} mode The active theme mode.
 */
export const paletteFor = (screen, modeOrTheme) => {
  // Accepts either a mode string or the whole theme.
  //
  // Every call site already had the theme in scope and was passing `theme.mode`,
  // and a designed theme cannot be seen through a mode string — these keys are
  // the reason Dashboard and Seva stayed navy under Puratan. Taking the theme
  // is what lets them be re-derived; passing a bare mode still works and still
  // means "no designed theme", which is what every test and every light/dark
  // path relies on.
  const isTheme = modeOrTheme !== null && typeof modeOrTheme === "object";
  const mode = isTheme ? modeOrTheme.mode : modeOrTheme;
  const base = paletteForInternal(screen, mode);
  const designed = isTheme && modeOrTheme.designedTheme;
  return designed ? themedScreenPalette(base, modeOrTheme.c) : base;
};

export default screenPalettes;
