// TIER 1 — typography, expressed as roles rather than t-shirt sizes.
//
// A call site asks for `type.body` and gets a size and a weight that were
// designed together. The old `sizes` scale gave a number only, so every call
// site invented its own metrics — which is why line spacing was inconsistent
// across the app, and why several places computed `lineHeight: sizes.sm +
// spacing.md`, an arithmetic coincidence rather than a decision.
//
// ── No role sets a lineHeight, and that is load-bearing ────────────────────
//
// The scale used to pin one per role, all on a 4pt grid: body 16/24, caption
// 12/16, heading 20/28, and so on. Every one of them was too small for the face
// they were sized against, and that is what misaligned Hindi and Punjabi text on
// Realme and on Android tablets.
//
// BalooPaaji2 (Regular and SemiBold are identical) is a 1000upem face with hhea
// ascent/descent 1157/-614 and USE_TYPO_METRICS set, so its natural line box is
// 1.771em. `body` therefore wants 28.3pt and was given 24. When lineHeight is
// under the natural box, RN's CustomLineHeightSpan takes the shortfall out of
// the line:
//
//   leading = lineHeight - ((-fm.ascent) + fm.descent)     // negative
//   fm.ascent  -= ceil(leading / 2)                        // ceil above,
//   fm.descent += floor(leading / 2)                       // floor below
//
// The box still ends up exactly `lineHeight` tall — which is why the rows kept
// their height and only the glyphs moved — but the baseline lands at a different
// depth, and the split is deliberately asymmetric. Scripts that use the space
// above the headline (Devanagari matras, Gurmukhi lagaa) then read as pushed up,
// with the untouched space below showing as a gap.
//
// Leaving it unset is both the fix and the more correct answer: the face's own
// spacing is exact, needs no maintenance if the font changes, and scales with
// the OS text-size setting instead of being frozen at a hand-picked number. The
// Reader header and HomeScreen's title reached the same conclusion separately —
// see the note in `headerAndSheet.test.js`.
//
// Do not reintroduce a `lineHeight` here without checking it against
// `fontSize * 1.771`. `includeFontPadding` is not an alternative: the span above
// ends by setting fm.top = fm.ascent and fm.bottom = fm.descent, which are the
// only values that flag controls, so it has no effect next to a lineHeight.
//
// These are UNSCALED base values. The OS text-size setting is applied by the
// `Text` primitive at render time via `allowFontScaling` — do not pre-multiply
// here, and do not bake a user font-size preference into these numbers.
//
// Gurbani is NOT covered by this scale. Its sizing is driven by the user's own
// font-size setting and is a separate system with its own correctness rules;
// see the Reader.

import { constant } from "@common";

// Font families. On Android a numeric `fontWeight` cannot synthesise a real
// bold from a Regular file without looking wrong, so weight is expressed by
// picking the actual designed face. `weight` below stays for the few places RN
// handles it natively (system font, iOS).
const fonts = {
  regular: constant.BALOO_PAAJI,
  semiBold: constant.BALOO_PAAJI_SEMI_BOLD,
  gurbaniPrimary: constant.GURBANI_AKHAR_TRUE,
  gurbaniThick: constant.GURBANI_AKHAR_THICK_TRUE,
  gurbaniHeavy: constant.GURBANI_AKHAR_HEAVY_TRUE,
};

// Size and face only — see the note above for why no line height.
const role = (fontSize, family = fonts.regular) => ({
  fontSize,
  fontFamily: family,
});

const type = {
  fonts,

  /**
   * No metrics at all — size, line height and face come entirely from the
   * caller's own style.
   *
   * For text that is positioned by a style rather than by a role. It exists so
   * `CustomText` can render through the same primitive as everything else
   * without a role silently imposing a size the call site never asked for.
   * New code should name a real role below instead.
   */
  inherit: {},

  /** Screen-dominating numerals and hero figures. Sparing use. */
  display: role(32, fonts.semiBold),
  /** Screen title inside content (not the app bar). */
  title: role(24, fonts.semiBold),
  /** Section heading within a screen. */
  heading: role(20, fonts.semiBold),
  /** Card title, list group header. */
  subheading: role(18, fonts.semiBold),
  /** Default reading size for UI copy. */
  body: role(16),
  /** Secondary copy, list row subtitles. */
  bodySmall: role(14),
  /** Buttons and control labels. */
  label: role(14, fonts.semiBold),
  /** Timestamps, footnotes, metadata. Never for anything essential. */
  caption: role(12),

  /**
   * A bani or folder title rendered in Gurmukhi, as screen chrome — the folder
   * header, the bani-list header. This is a UI label that happens to be in
   * Gurmukhi, NOT scripture body text: the latter is sized by the user's own
   * font-size setting inside the Reader and is not part of this scale.
   */
  // The one role that keeps a line height, because it is the one role that has
  // always been large enough. GurbaniAkharTrue is a 2000upem face with hhea
  // ascent/descent 1856/-801 — a 1.329em box, so 28pt needs 37.2 and 40 clears
  // it with room to spare. Dropping it would TIGHTEN this title to 37.2 for no
  // reason, so the number stays. Any change to it must be checked against
  // 28 * 1.329, not against Baloo's 1.771.
  baniTitle: { ...role(28, fonts.gurbaniPrimary), lineHeight: 40 },

  /** Native weights, for the rare place RN resolves a face itself. */
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

export default type;
