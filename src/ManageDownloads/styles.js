import { Platform } from "react-native";
import { androidLineHeight } from "@theme/lineHeight";
// ManageDownloads styles, on the design tokens.
//
// The previous version carried a comment admitting the header design gambled on
// string length: "we accept they may overlap the title on very short locales;
// the title is never long enough to collide in practice." That header is gone —
// the screen uses the shared `ScreenHeader`, whose columns cannot overlap.
//
// Everything here now comes from resolved tokens, so paddings and row heights
// scale with the device width and the user's text-size setting.

// BalooPaaji2's own metrics, measured from the shipped file: 1000upem, hhea
// ascent 1157, OS/2 sCapHeight 602. A digit has no ascender and no descender,
// so its optical centre is half a cap height above the baseline.
const BALOO_ASCENT_EM = 1.157;
const BALOO_CAP_HEIGHT_EM = 0.602;

/**
 * How far to LIFT a digit so its cap-height box lands on the middle of a
 * `boxHeight` circle — on iOS, the one platform that does not centre it.
 *
 * iOS gets no `lineHeight` (see @theme/lineHeight), so it measures the digit
 * against the badge's own height and RCTTextShadowView clamps what it returns
 * to that maximum. Baloo asks for a 1.771em box — 21.3pt at 12pt — so a 16pt
 * badge hands back a frame 5.3pt shorter than the line inside it. The frame
 * shrinks; the glyph does not move with it. TextKit still puts the baseline one
 * ascent below the frame's top, which leaves the digit's centre 10.3pt down a
 * 16pt circle instead of 8 — sitting on the bottom of the disc.
 *
 * Android is given 0. There `androidLineHeight` is honoured, so the line box IS
 * the badge height and CustomLineHeightSpan centres the font's box in it.
 */
const badgeDigitOffset = (fontSize, boxHeight) =>
  Platform.OS === "ios"
    ? boxHeight / 2 - (BALOO_ASCENT_EM - BALOO_CAP_HEIGHT_EM / 2) * fontSize
    : 0;

const createStyles = ({ c, space, layout, radii, type }) => ({
  // ── Section headings ───────────────────────────────────────────────────
  // Same shape as a Settings group heading: quiet label OUTSIDE and above the
  // card, not a banner across the list.
  sectionHeader: {
    ...type.label,
    marginTop: space.xl,
    marginHorizontal: space.md,
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    color: c.textSecondary,
  },
  // The first heading sits directly under the selection bar, which already
  // supplies its own padding — the full group gap on top of that read as a
  // hole before the list began.
  sectionHeaderFirst: {
    marginTop: space.sm,
  },

  // ── The card each bani's tracks sit in ─────────────────────────────────
  // SectionList cannot wrap a section in a single view, so the corners are
  // carried by the first and last row of each section instead.
  cardTop: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: layout.borderWidth.hairline,
  },
  cardBottom: {
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    borderBottomWidth: layout.borderWidth.hairline,
  },
  rowSeparator: {
    height: layout.borderWidth.hairline,
    backgroundColor: c.border,
    // Full bleed across the card, exactly like a Settings row's divider — that
    // one is a `borderBottomWidth` ON the row, so it spans the card's whole
    // width. Insetting this by the row's own padding as well produced the
    // gap-at-each-end treatment the bani list uses, which is what made this
    // screen read as a mix of the two. Matching the card inset alone also keeps
    // the card's side edges unbroken, since the separator is the full width of
    // the rows above and below it.
    marginHorizontal: space.md,
  },

  // ── Selection toolbar ──────────────────────────────────────────────────
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: space.sm,
    paddingHorizontal: layout.row.paddingHorizontal,
    paddingVertical: space.sm,
    backgroundColor: c.backgroundAlt,
  },
  selectAllControl: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: layout.touchTarget,
    flexShrink: 1,
  },
  selectAllLabel: {
    ...type.body,
    color: c.textPrimary,
    flexShrink: 1,
  },
  selectionSummary: {
    ...type.caption,
    color: c.textSecondary,
    flexShrink: 1,
    textAlign: "right",
  },

  // Invisible, always-mounted spotlight target used by the downloads coachmark
  // when there's no completed-downloads summary to point at (empty list or a
  // download still in progress). Transparent so it never changes what the user
  // sees.
  spotlightAnchor: {
    height: space.xxl,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },

  // ── Track rows ─────────────────────────────────────────────────────────
  // Inside the card, so they carry the card's horizontal inset and no border
  // of their own — separation is the inset hairline between them.
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surface,
    marginHorizontal: space.md,
    // The card edge, matching a Settings group exactly.
    borderLeftWidth: layout.borderWidth.hairline,
    borderRightWidth: layout.borderWidth.hairline,
    borderColor: c.border,
    paddingVertical: layout.row.paddingVertical,
    paddingHorizontal: layout.row.paddingHorizontal,
    // A minimum, so a long track name in any language makes the row taller
    // rather than clipping.
    minHeight: layout.row.minHeight,
  },
  trackRowChecked: {
    backgroundColor: c.surfaceSelected,
  },
  inProgressRow: {
    opacity: 0.7,
  },

  // ── Checkbox ───────────────────────────────────────────────────────────
  // Previously branched on `theme.mode === "dark"` in three places because the
  // brand navy is invisible on a dark ground. `c.accent` already resolves per
  // theme, so the branch is gone.
  checkbox: {
    width: space.xl,
    height: space.xl,
    borderRadius: radii.sm,
    borderWidth: layout.borderWidth.thick,
    borderColor: c.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: c.accent,
    borderColor: c.accent,
  },

  // ── Track text ─────────────────────────────────────────────────────────
  trackInfo: {
    flex: 1,
  },
  trackName: {
    ...type.body,
    color: c.textPrimary,
  },
  trackMeta: {
    ...type.caption,
    color: c.textSecondary,
    marginTop: space.xxs,
  },
  trackSize: {
    ...type.caption,
    color: c.textSecondary,
    marginLeft: space.sm,
    flexShrink: 0,
  },

  // ── List ───────────────────────────────────────────────────────────────
  list: {
    flex: 1,
    backgroundColor: c.backgroundAlt,
  },
  listContent: {
    paddingBottom: layout.screenPaddingBottom,
  },

  // ── Empty state ────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xxl,
    gap: space.lg,
    backgroundColor: c.backgroundAlt,
  },
  emptyTitle: {
    ...type.subheading,
    color: c.textPrimary,
    textAlign: "center",
  },
  emptyHint: {
    ...type.bodySmall,
    color: c.textSecondary,
    textAlign: "center",
  },

  // ── Delete action in the header ────────────────────────────────────────
  deleteButton: {
    width: layout.header.actionSize,
    height: layout.header.actionSize,
    alignItems: "center",
    justifyContent: "center",
  },
  // Wraps the icon alone, so the badge below has the icon's box to anchor to.
  deleteIconWrap: { position: "relative" },
  // Sits ON the icon's top-right corner. The offsets are negative because the
  // anchor is the icon wrapper (24pt), not the 48pt touch target — measured
  // from the button, `right: 2` put the badge clear of the icon's right edge
  // entirely, which is the gap it used to float in.
  deleteBadge: {
    position: "absolute",
    // A corner badge sits MOSTLY outside its icon — roughly half on, half off.
    // At -4 it landed across the middle of the bin instead, obscuring the glyph
    // it is meant to annotate. Half the badge width clears the corner properly.
    top: -space.sm,
    right: -space.sm,
    minWidth: layout.icon.xs,
    // A FIXED height, not `minHeight`. Caption is 12pt at a 1.4 line height, so
    // the glyph box is ~17pt and a `minHeight: 16` box grew to fit it — one pt
    // taller than it was wide, which is why a single digit rendered as a slight
    // oval instead of a circle. Pinning the height keeps it square, and
    // `radii.pill` then makes it round. A 2+ digit count still widens into a
    // stadium, which is the conventional shape for that.
    height: layout.icon.xs,
    borderRadius: radii.pill,
    backgroundColor: c.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xxs,
  },
  deleteBadgeText: {
    ...type.caption,
    // Was fontSize 9 — below any readable minimum, and it did not scale with
    // the user's text-size setting either.
    //
    // Matching the line box to the badge height centres the digit on Android,
    // which splits a too-small line box evenly. iOS may not be pinned the same
    // way — it takes the whole shortfall off the ascent and clips — so it is
    // handed `undefined` and draws the face's own 21.3pt box. See
    // @theme/lineHeight. That box does not centre itself, which is what the
    // offset below is for.
    lineHeight: androidLineHeight(layout.icon.xs),
    color: c.onError,
    textAlign: "center",
    // The flex centring on the badge cannot place this: iOS clamps the digit's
    // frame to the badge height while leaving the glyph on a baseline measured
    // for the taller box, so the "2" came to rest on the bottom of the circle.
    // `badgeDigitOffset` is that gap, and a `transform` pays it at paint time
    // rather than in layout — the circle keeps its 16pt box, and a two-digit
    // count still widens it into a stadium. A constant is safe because the
    // digit is one: `maxFontSizeMultiplier={1}` at the call site pins it at
    // 12pt, so there is no scaled size for the offset to track.
    transform: [{ translateY: badgeDigitOffset(type.caption.fontSize, layout.icon.xs) }],
  },
});

export default createStyles;
