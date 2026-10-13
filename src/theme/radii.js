// TIER 1 — corner radius. One scale.
//
// Replaces the two overlapping scales that shipped before: `theme.radius`
// (sm 6 / md 10 / lg 16) and `theme.borderRadius` (sm 15 / md 20 / lg 30 /
// xl 40). Both used the same key names for different values, so "md" meant
// either 10 or 20 depending on which object the author happened to reach for.
//
// Both old scales remain exported and deprecated while screens migrate.
//
// The steps are chosen by role, not by arithmetic — a chip and a card should
// not share a radius just because a formula says so.

const radii = {
  none: 0,
  sm: 8, // inputs, small controls, chips
  md: 12, // buttons, list rows, tiles
  lg: 16, // cards
  xl: 24, // sheets, modals, large surfaces
  pill: 999, // fully rounded — badges, toggles, avatars
};

export default radii;
