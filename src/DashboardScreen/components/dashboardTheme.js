import { rolesFor } from "@theme/screenPalettes";
import useScreenPalette from "@common/hooks/useScreenPalette";
import useTokens from "@common/hooks/useTokens";
import { accent, gold, navy } from "@theme/palette";

// The Dashboard's palette, now sourced entirely from the app's token layer.
//
// This file used to be the app's THIRD design system: it carried its own
// contrast-pinned navy ramp because `theme.colors` could not express what the
// Dashboard needed. Those tints were the most thought-through colours in the
// repo, so the token layer's `navy` ramp was generated to match them — and
// `BRAND` is now an alias onto it rather than sixteen separate literals.
//
// Two of the old steps are deliberately NOT mapped to their nearest neighbour:
//
//   tint40 was a control border, held to 3:1. The nearest ramp step (navy 400)
//   measures 2.99:1 on the light alt ground — just under. It maps to navy 500.
//
//   tint45 was used for placeholder and secondary TEXT at roughly 3.0:1 on
//   white, which never met the 4.5:1 that text requires. It also maps to
//   navy 500 (5.37:1 on white), so the mapping fixes a real contrast failure
//   rather than preserving it.
//
// New code should read semantic roles from `useTokens()` instead of BRAND.
export const BRAND = {
  base: navy[800],
  tint15: navy[600],
  tint25: navy[500],
  /** Control borders — 3:1. Not navy 400; see the note above. */
  tint40: navy[500],
  /** Secondary text — 4.5:1. Not navy 400; see the note above. */
  tint45: navy[500],
  tint60: navy[300],
  tint75: navy[200],
  tint88: navy[100],
  tint94: navy[50],
  accentOnDark: accent[400],
};

/** Brand gold, fixed by the client. Decorative fills and icons only. */
export const GOLD = gold[400];

/**
 * The Dashboard's one blue, for callers outside a component that cannot use the
 * hook. This is the light-mode value only — anything rendering in both themes
 * must take `accentBlue` from `useDashboardTheme()` instead, or it renders navy
 * on a near-black ground in dark mode.
 */
export const ACCENT_BLUE = navy[800];

// Every value here now delegates to a semantic role, so the Dashboard follows
// the app's theme (and any future user-selected theme) automatically. The keys
// are unchanged, so the components consuming this need no edit.
const useDashboardTheme = () => {
  const { c: roles, theme, isDark, layout } = useTokens();
  // The Dashboard's components read ROLES, not the aliases below, so the roles
  // themselves resolve to the Dashboard's colours. Anything it does not override
  // still falls through to the semantic layer.
  // A designed theme has already recoloured these roles app-wide, so the
  // Dashboard's own overrides stand down — layered on top they would paint the
  // app's navy straight back over the theme. Under Light and Dark they apply
  // exactly as before.
  const c = theme.designedTheme ? roles : { ...roles, ...rolesFor("dashboard", theme.mode) };
  // The Dashboard's OWN colours, restored. Structure, spacing and every other
  // role still come from the token layer above — only the values below are
  // screen-scoped. See `theme/screenPalettes.js`.
  const palette = useScreenPalette("dashboard");

  return {
    theme,
    isDark,
    /** The full semantic role map — prefer this over the aliases below. */
    c,
    /** Sizes and spacing, so the Dashboard stops inventing its own numbers. */
    layout,
    /** Decorative accent — the streak flame, chart highlights. */
    gold: palette.gold,
    // THE Dashboard blue — text, icons, chart bars, selected fills, the lot.
    //
    // It resolves to the same navy as the nav bar in light mode, and to a light
    // blue in dark mode that carries 4.5:1 as text and takes `c.onAccent` when
    // it is a fill. Three different blues used to appear on this one screen:
    // this alias (`c.accent`), a local `isDark ? enabledText : primary` copied
    // into eight components, and a hardcoded `ACCENT_BLUE` — which is why the
    // page looked like a different app in dark mode.
    accentBlue: palette.accentBlue,
    screenBg: palette.screenBg,
    cardBg: palette.cardBg,
    primaryText: palette.primaryText,
    mutedText: palette.mutedText,
    separator: palette.separator,
    /** Headline colour — a card's big number, and the header's Fateh. */
    brandText: palette.brandText,
    /**
     * The Dashboard's full palette, for the colours that are specific to one
     * card rather than a role the whole screen shares — the tinted icon
     * plates, the reminder switch, a card's own title line. They live in
     * `theme/screenPalettes` so no component writes a literal.
     */
    palette,
  };
};

export default useDashboardTheme;
