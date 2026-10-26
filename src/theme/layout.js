// TIER 3 — component dimensions. The heights and paddings that must be
// identical everywhere, resolved once.
//
// This exists because the same measurement is currently re-invented per screen:
// the Settings header, the Reader header, the Seva header and the Dashboard
// header are four different heights with four different paddings, and the row
// heights under them do not agree either. A screen should not get to have an
// opinion about how tall a header is.
//
// Deliberately platform-neutral. The app must look identical on iOS and
// Android, so nothing here branches on `Platform` — the only platform-specific
// values live in safe-area insets, which the OS supplies and which are added on
// top of these, never baked into them.
//
// Everything below is a MINIMUM where content can grow (`minHeight`), not a
// fixed height. A fixed height on anything text-bearing breaks the moment a
// translation runs long or the user raises their font size.

import space from "./space";

const layout = {
  // ── Touch ──────────────────────────────────────────────────────────────
  // 44pt is the floor from both Apple's HIG and WCAG 2.5.5; Android's own
  // guidance says 48dp. Take the larger so one number satisfies both.
  touchTarget: 48,
  /** Expands a small control's touch area without changing its visual size. */
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },

  // ── Screen ─────────────────────────────────────────────────────────────
  /** The horizontal gutter every screen's content aligns to. */
  screenGutter: space.lg,
  /** Breathing room above the first element and below the last. */
  screenPaddingTop: space.md,
  screenPaddingBottom: space.xxl,

  // ── Header (app bar) ───────────────────────────────────────────────────
  // One height for every screen. Safe-area top inset is added by the
  // ScreenHeader primitive; it is not included here.
  header: {
    /**
     * Space above a header's content, clearing the camera cutout and status bar.
     *
     * ONE value for every header in the app. The Reader's own header arrived at
     * the same clearance by hand — a fixed 80pt box with its content bottom
     * aligned — and every other screen used the raw safe-area inset instead,
     * which is a different number on every device and left a visible band above
     * the title. Neither is derived from the other any more; both read this.
     *
     * Deliberately NOT the safe-area inset. The inset describes where the system
     * bars MAY draw, and this app hides the status bar, so padding by it
     * reserved room for a bar that was not there. The cutout still must be
     * cleared either way, which is what this covers.
     */
    topClearance: 48,
    minHeight: 56,
    // The gutter every other screen uses. At space.xs the Seva close cross sat
    // almost against the right edge of the display.
    paddingHorizontal: space.lg,
    gap: space.sm,
    /** Leading/trailing icon button, square, meets `touchTarget`. */
    actionSize: 48,
    iconSize: 24,
    /**
     * The dismiss cross, wherever one appears in a header — Seva, the
     * Dashboard, the month/year picker. One number so the three cannot drift
     * apart; they were 28, 20 and 20. Slightly under `iconSize` because the
     * cross glyph is drawn inside a circle and reads larger than a bare icon at
     * the same nominal size.
     */
    closeIconSize: 22,
  },

  // ── List rows ──────────────────────────────────────────────────────────
  row: {
    /**
     * Single-line row.
     *
     * Sized to match a bani row on the home list at the default font: that row
     * is 2 x space.lg of padding around a 24pt title, about 66pt tall, while a
     * settings row wraps a 16/24 body line and stopped at 56. The two sat
     * visibly different heights on screens that are otherwise identical.
     */
    minHeight: 64,
    /** Row with a subtitle underneath. Same step above the single-line row. */
    minHeightTwoLine: 80,
    paddingHorizontal: space.lg,
    /** Matches the bani list on the home screen, which pads by the same step. */
    paddingVertical: space.lg,
    /** Space between a leading icon and the label. */
    gap: space.md,
    iconSize: 24,
  },

  // ── Cards ──────────────────────────────────────────────────────────────
  card: {
    padding: space.lg,
    gap: space.md,
    /** Vertical rhythm between stacked cards. */
    gapBetween: space.md,
  },

  // ── Sheets and dialogs ─────────────────────────────────────────────────
  sheet: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
    /** The drag handle at the top of a bottom sheet. */
    handleWidth: 36,
    handleHeight: 4,
    /** A sheet never covers the whole screen; the ground stays visible. */
    maxHeightRatio: 0.9,
    /**
     * The floor a sheet's scrolling body keeps when a footer is pinned below
     * it, so a tall footer — the Punjabi keyboard is eight rows — cannot shrink
     * the body to nothing and leave the sheet showing only its title.
     */
    listMinHeight: 120,
  },

  dialog: {
    padding: space.xl,
    gap: space.md,
    maxWidth: 400,
    /** Inset from the screen edge on narrow devices. */
    marginHorizontal: space.xl,
  },

  // ── Toast / snackbar ───────────────────────────────────────────────────
  toast: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    /** Matches the bani list on the home screen, which pads by the same step. */
    paddingVertical: space.lg,
    /** Distance from the bottom edge, above any bottom navigation. */
    offsetBottom: space.lg,
    marginHorizontal: space.lg,
    /** Auto-dismiss delay. Long enough to read a two-line message. */
    durationMs: 4000,
  },

  // ── Bottom navigation ──────────────────────────────────────────────────
  bottomNav: {
    minHeight: 64,
    iconSize: 24,
    paddingVertical: space.sm,
  },

  /**
   * A tick box in a multi-select row. Listed in scale.js CONTAINER_KEYS, so it
   * grows with the OS text size — it sits beside a label and would look wrong
   * staying put while that label got bigger.
   */
  checkbox: 22,

  // ── Icons ──────────────────────────────────────────────────────────────
  icon: {
    xs: 16,
    sm: 20,
    md: 24, // the default
    lg: 32,
    xl: 48,
  },

  // ── Borders ────────────────────────────────────────────────────────────
  borderWidth: {
    hairline: 1,
    thick: 2,
    /** Focus ring — thick enough to see without shifting layout. */
    focus: 2,
  },
};

export default layout;
