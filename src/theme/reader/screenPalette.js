import { hexToRgb, mix, withAlpha } from "@theme/colorUtils";
import { readableOn } from "./derive";

// WCAG's floor for a meaningful non-text mark, such as a category icon.
const UI_CONTRAST = 3;
/** WCAG AA for text. */
const AA_CONTRAST = 4.5;

// Re-derives a SCREEN palette from a designed theme.
//
// Dashboard and Seva do not colour themselves from semantic roles alone. They
// read ~80 one-off keys — `sectionBg`, `flameBg`, `vaakTabActiveBg`,
// `switchOnTrack` — through `paletteFor()`, which is keyed by light/dark and so
// cannot see a theme at all. Overriding `theme.c` therefore reached neither
// screen, which is why they stayed navy under Puratan.
//
// So each key is mapped to a role by hand, grouped by what it IS. Grouping
// rather than one mapping per key keeps this readable at 80 entries and makes
// an unclassified key obvious — `screenPalette.test.js` fails on any colour key
// that appears in no group, so a key added to screenPalettes.js later cannot
// silently keep the app's navy on a themed screen.
//
// The two screens keep their SHAPE — three grounds, two border weights, a
// separate plate behind an icon. Only the values change.

// ── Grounds, page-outward ────────────────────────────────────────────────
// The page itself.
const PAGE = ["screenBg", "pageBg", "journeyBg", "surface"];
// A card lifted off the page. `sectionBg` belongs here, not with the recessed
// plates below: it is opaque in both stock modes (white / #041126) and is the
// ground for all seven Dashboard section cards AND the day-detail sheet. As a
// translucent fill it composited onto whatever sat behind — over the modal's
// scrim that made the sheet read dark while its ink stayed dark, so the whole
// sheet came up blank.
const CARD = ["cardBg", "panelBg", "vaakCardBg", "brightBg", "noteBg", "sectionBg", "insetBg"];
// A section or inset that sits BACK from a card rather than on top of it.
// Everything here is a small plate drawn ON a card, so a low-alpha ink wash
// composites to the same thing the stock tint did.
const RECESSED = [
  "insetBg",
  "neutralSurface",
  "iconPlate",
  "headerPill",
  "vaakTabBg",
  "shufflePillBg",
  "dayIconBg",
  "tileIconBg",
  "journeyFlameBg",
  "flameBg",
  "ringTrack",
  "chartBarInactive",
  "switchOffTrack",
];
// A faint brand TINT that ordinary ink is read against: an active tab, an
// accent surface behind a title.
const ACCENT_FILL = ["accentSurface", "vaakTabActiveBg", "playButtonBg", "goldSurface"];
// A SOLID brand fill, opaque in both stock modes, whose label is `onAccent`
// rather than ink. As a faint tint the label — the theme's ground colour —
// had nothing to sit against and disappeared.
const ACCENT_SOLID = ["selectedBg", "badgeBg", "bannerBg"];

// ── Ink ──────────────────────────────────────────────────────────────────
const INK = [
  "primaryText",
  "title",
  "heading",
  "bodyText",
  "cardTitle",
  "exploreTitle",
  "journeyTitle",
  "invocationText",
  "onVaakCard",
  "ink",
];
const INK_MUTED = [
  "mutedText",
  "subtleText",
  "cardMeta",
  "statLabel",
  "onVaakCardMuted",
  "noteText",
  "heroLabel",
];
// Ink sitting ON an accent-filled block. `bannerText` is here rather than with
// the muted ink because its ground is `bannerBg`, a solid accent.
const ON_ACCENT = [
  "onAccent",
  // The tick on a completed day. Stock Light and Dark set it explicitly,
  // because green[600] and green[300] need opposite ticks; a designed theme
  // has one accent and one partner for it, so it takes that.
  "onStreakDone",
  "selectedText",
  "badgeText",
  "bannerText",
  "switchOnThumb",
  "switchOffThumb",
];

// ── Accents ──────────────────────────────────────────────────────────────
const ACCENT = [
  "brandText",
  "accentBlue",
  "accentText",
  "sectionAccentBlue",
  "link",
  "tileIcon",
  "heroIcon",
  "chartBar",
  "flame",
  "gold",
  // A completed day in the week strip. Green in Light and Dark; under a
  // designed theme it follows that theme's accent, exactly as gold above it
  // does — a fixed green would sit outside a palette chosen by someone else.
  "streakDone",
  "switchOnTrack",
  "highlight",
  "radioRing",
];

// ── Lines ────────────────────────────────────────────────────────────────
const RULE = ["separator", "divider", "border", "listDivider", "bannerBorder"];
const RULE_STRONG = ["borderStrong", "selectedBorder"];
// A hairline that is translucent by design — it is meant to darken whatever it
// is drawn over, not to be a line in its own right. Given the solid `border`
// role these turned into hard outlines around the feature tiles and the
// reminder switch's thumb. Each keeps its OWN stock alpha (0.07 to 0.3, three
// deliberately different weights) and only takes its hue from the theme.
const HAIRLINE = ["tileBorder", "appTileBorder", "switchThumbBorder"];
const HAIRLINE_FALLBACK = 0.08;

/** The alpha of an rgba()/hsla() or 8-digit hex, or null if it is opaque. */
export const alphaOf = (value) => {
  if (typeof value !== "string") return null;
  if (/^(rgba|hsla)\(/i.test(value)) {
    const a = Number(value.split(",").pop().replace(")", "").trim());
    return Number.isFinite(a) ? a : null;
  }
  if (/^#[0-9a-f]{8}$/i.test(value)) return parseInt(value.slice(7), 16) / 255;
  return null;
};

// A faint accent tint, NOT the accent itself. `todayFill` is the disc behind
// today's date and is translucent in both stock modes (0.15 / 0.22); the day
// number drawn on top is the solid accent. Mapped to the solid accent the two
// became the same colour and the date vanished into its own circle.
const ACCENT_WASH = ["todayFill"];
export const ACCENT_WASH_ALPHA = 0.18;

// A wash rather than a solid: something dimmed against the page.
const WASH = ["missedFill"];

// The sheet's own dim. Kept a black wash rather than tinted — a scrim has to
// work over whatever is behind it, which is any screen in the app.
const SCRIM = ["scrim"];

// Keys that are NOT colours and must pass through untouched. `backdropOpacity`
// is a number and `appTileShadow` a shadow that stays black on every theme.
const PASSTHROUGH = ["backdropOpacity", "appTileShadow"];

// A MAP of category hues rather than a single colour — "Seva by other means"
// gives social, coding, QA and other a tint, used both for the icon and for the
// 13% disc behind it.
//
// Light and Dark keep their four hues. A designed theme collapses them onto ONE
// accent, so the megaphone, the coders, the clipboard and the star all share a
// single style rather than importing a violet, a cyan, a green and an amber
// onto a parchment page. Pulling each hue halfway to the accent was tried
// first and is what produced the purple/teal/olive/orange set that still read
// as four foreign colours on every theme.
const HUE_MAP = ["meansTints"];

// The activity heat ramp is an "r,g,b" triple rather than a hex — the calendar
// splices it straight into rgba() at each level. Handled on its own so the ramp
// follows the theme's accent instead of staying the app's navy.
const RGB_TRIPLE = ["heatRgb"];

const GROUPS = [
  [PAGE, (c) => c.background],
  [CARD, (c) => c.surface],
  [RECESSED, (c) => c.fillSubtle],
  [ACCENT_FILL, (c) => c.accentSubtle],
  [ACCENT_SOLID, (c) => c.accent],
  [INK, (c) => c.textPrimary],
  [INK_MUTED, (c) => c.textSecondary],
  [ON_ACCENT, (c) => c.onAccent],
  [ACCENT, (c) => c.accent],
  [ACCENT_WASH, (c) => withAlpha(c.accent, ACCENT_WASH_ALPHA)],
  [RULE, (c) => c.border],
  [RULE_STRONG, (c) => c.borderStrong],
  [HAIRLINE, (c, base) => withAlpha(c.textPrimary, alphaOf(base) ?? HAIRLINE_FALLBACK)],
  [WASH, (c) => withAlpha(c.textSecondary, 0.35)],
  [SCRIM, (_c, base) => base],
];

// One accent for every category, held to 3:1 against the card it is drawn on —
// WCAG's floor for a meaningful non-text mark. The key set is preserved because
// the screen looks each category up by name.
const themedHues = (hues, c) => {
  const tint = readableOn(c.accent, c.textPrimary, c.surface, UI_CONTRAST);
  return Object.fromEntries(Object.keys(hues).map((name) => [name, tint]));
};

// Role adjustments applied ONLY under a designed theme, per screen. Light and
// Dark never reach this — they keep going through `rolesFor()` exactly as
// before.
//
// Seva draws its amount card, every "other ways to do Seva" row, the donate
// card and the inner Means rows on `surfaceElevated`, one rung above the
// `surface` its page uses. Under Light that rung is the gap between a pale-blue
// page and a white card, which is most of what separates them. A designed theme
// derives the whole ladder from one ground, so the three rungs land within a
// few percent of each other and the screen stacks near-identical tints of the
// same colour — three muddy browns on Puratan.
//
// Settings has the same problem and solves it with ONE card colour plus a
// hairline (`SettingsSection`: `c.surface` + `c.border`), which is why that
// list stays crisp on every theme. Seva borrows it: the extra rung collapses,
// so every card is `surface` on the page ground and the border does the
// separating. Nothing on the screen nests one of these inside another, so no
// card loses its edge.
// A filled call-to-action that is legible on the surface it sits on.
//
// `primary` is the NAV BAR's colour — the bottom bar reads `theme.c.primary`
// directly, and a designed theme derives it from the page ground on purpose so
// the bar matches the page. That makes it a poor button fill: on the dark-based
// themes it measures 1.0-1.3:1 against a sheet surface, so Create, Rename and
// the reminder OK button had no visible background at all.
//
// It cannot simply be changed, because that same value is what keeps Blue's nav
// bar pinned to the dark-mode navy. So the CTA pair is overridden HERE, per
// screen, where the nav bar never reaches.
const ctaPair = (c) => {
  const fill = readableOn(c.accent, c.textPrimary, c.surfaceElevated, UI_CONTRAST);
  return {
    // Its OWN roles. Overriding `primary` here repainted the bottom nav bar,
    // which reads that same role — see Button.
    ctaFill: fill,
    ctaFillPressed: mix(fill, c.textPrimary, 0.18),
    // The label ON that fill, held to text contrast rather than the 3:1 the
    // fill itself needs against the sheet.
    onCtaFill: readableOn(c.background, c.textPrimary, fill, AA_CONTRAST),
  };
};

const DESIGNED_SCREEN_ROLES = {
  seva: (c) => ({ surfaceElevated: c.surface }),
  settings: ctaPair,
  settingsSheet: ctaPair,
};

/** A designed theme's per-screen role adjustments, or null if it has none. */
export const designedRolesFor = (screen, c) => {
  const adjust = DESIGNED_SCREEN_ROLES[screen];
  return adjust ? adjust(c) : null;
};

/** Which group a key belongs to, or null if nobody classified it. */
export const groupFor = (key) => {
  if (PASSTHROUGH.includes(key)) return "passthrough";
  if (RGB_TRIPLE.includes(key)) return "rgbTriple";
  if (HUE_MAP.includes(key)) return "hueMap";
  const hit = GROUPS.find(([keys]) => keys.includes(key));
  return hit ? hit[0] : null;
};

/**
 * The screen's palette re-derived from a designed theme's app roles.
 *
 * @param {object} basePalette The screen's own light/dark palette — its key set
 *   is the contract, so a key nobody mapped still comes back with a value.
 * @param {object} c The designed theme's resolved colour roles.
 */
export const themedScreenPalette = (basePalette, c) =>
  Object.fromEntries(
    Object.keys(basePalette).map((key) => {
      if (PASSTHROUGH.includes(key)) return [key, basePalette[key]];
      if (RGB_TRIPLE.includes(key)) return [key, hexToRgb(c.accent) ?? basePalette[key]];
      if (HUE_MAP.includes(key)) return [key, themedHues(basePalette[key], c)];
      const hit = GROUPS.find(([keys]) => keys.includes(key));
      // An unmapped key keeps the app's value rather than crashing. The test is
      // what stops that reaching a device.
      return [key, hit ? hit[1](c, basePalette[key]) : basePalette[key]];
    })
  );

export default themedScreenPalette;
