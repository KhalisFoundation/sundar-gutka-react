// TIER 1 — spacing. A strict 4pt grid.
//
// Every step is a multiple of 4 and the names ascend with the values, so a name
// communicates size without a lookup. That was not true of the old `spacing`
// scale, where `xl_20` (20) sorted below `xl` (24) and `md_12` (12) sat between
// `md` (8) and `lg` (16).
//
// This ships ALONGSIDE the old `theme.spacing`, which is deprecated. It is not
// a rename: `spacing.md` is 8 and `space.md` is 12, so redefining the old keys
// in place would have silently shifted every screen in the app at once. Screens
// migrate `theme.spacing.*` -> `theme.space.*` one at a time, each verified,
// and `spacing.js` is deleted when the last one lands.
//
// If a layout needs a value that is not on this grid, the layout is wrong, not
// the grid — reach for the adjacent step.

const space = {
  none: 0,
  xxs: 2, // hairline nudges only, not a layout step
  xs: 4,
  sm: 8,
  md: 12, // default gap between related elements
  lg: 16, // default screen gutter
  xl: 24, // between distinct groups
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

export default space;
