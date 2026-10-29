import { bundledRegistry, remoteThemeName } from "@theme/reader/registry";
import constant from "@common/constant";

// The theme picker's contents, in order.
//
// There is ONE setting — `state.theme` — holding either an appearance keyword
// or a designed theme's id, so a tile has to carry both what it STORES and
// which record to draw its preview from. The two are not the same string: the
// appearance keywords are capitalised and long-persisted ("Light"), while a
// record's id is its lowercase key ("light"). Keeping the mapping here means
// the storage format never has to change and no screen has to know about it.
//
// Split out of the screen so a new theme appears in the grid by being added to
// the registry, and nothing here needs editing.

/** Stored value for the tile that follows the device's own light/dark setting. */
export const SYSTEM = constant.Default;


const APPEARANCE_RECORD_IDS = new Set(["light", "dark"]);

/**
 * @param {{ list: object[], byId: object }} [registry] the merged registry from
 *   useThemeRegistry; the bundled one when omitted.
 * `[{ value, record, labelKey }]` — System first, then the two plain
 * appearances, then every designed theme in registry order.
 *
 * `record` is null only for System, which has no single appearance to preview.

 */
export const themeOptions = (registry = bundledRegistry()) => [
  { value: SYSTEM, record: null, labelKey: "default" },
  // The appearance tiles preview from whatever light and dark currently are —
  // the backend may have corrected either.
  { value: constant.Light, record: registry.byId.light, labelKey: "light" },
  { value: constant.Dark, record: registry.byId.dark, labelKey: "dark" },
  ...registry.list
    .filter((t) => !APPEARANCE_RECORD_IDS.has(t.id))
    .map((t) => ({
      value: t.id,
      record: t,
      labelKey: t.nameKey,
    })),
];

/**
 * What to call a tile, in the app's language.
 *
 * A remote theme's OWN names win. The backend defines the theme, so it defines
 * what the theme is called — in all six languages — and the localisation file
 * cannot know about a theme added after the release. Reading the file first
 * meant any id that happened to have a leftover string there was named from
 * app code and the `names` column was ignored, which made a renamed row look
 * like it had not been served at all.
 *
 * Bundled themes carry no `names`, so they fall straight through to the
 * localisation file, which is where their names live. A stored id nothing can
 * name any more shows as the raw id rather than an empty row.
 *
 * @param option    one entry from themeOptions.
 * @param language  `state.language`.
 * @param strings   the active STRINGS table.
 */
export const themeLabel = (option, language, strings) =>
  remoteThemeName(option?.record, language) || strings[option?.labelKey] || option?.value;

export default themeOptions;
