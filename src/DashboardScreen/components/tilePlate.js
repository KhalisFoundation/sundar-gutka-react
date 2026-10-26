import { pickByMode } from "@theme/colorUtils";
import { brandMarks } from "@theme/palette";

/**
 * The plate under an Explore tile's artwork.
 *
 * A tile naming a `plate` carries its own fixed colours and needs a ground that
 * suits them in EVERY theme, not one derived from the page — see
 * `brandMarks.appIconPlates`. Everything else takes the screen's own plate,
 * which follows the theme like the rest of the card.
 *
 * A plate is either one colour for both modes or a `{ light, dark }` pair;
 * neither form is ever re-derived from a designed theme, which is the whole
 * point of it being here rather than in the screen palette.
 *
 * @param {{plate?: "pale"|"deep"}} tile the tile's config entry.
 * @param {{mode: "light"|"dark"}} theme the active theme.
 * @param {string} themed the screen's own plate, for tiles that want it.
 */
export const plateFor = (tile, theme, themed) => {
  if (!tile.plate) return themed;
  const plate = brandMarks.appIconPlates[tile.plate];
  return typeof plate === "string" ? plate : pickByMode(theme, plate);
};

export default plateFor;
