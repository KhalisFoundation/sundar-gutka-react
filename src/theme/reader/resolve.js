// Resolves the single stored theme setting into the two things the app needs
// from it: which APPEARANCE to wear, and which READING theme to render Bani in.
//
// There is one setting — `state.theme` — and it holds either an appearance
// keyword ("Default" | "Light" | "Dark") or a designed theme's id ("blue",
// "puratan", …). A designed theme carries its own appearance in `base`, so
// choosing Blue puts the whole app in dark and the Reader in Blue; choosing
// Puratan puts the app in light and the Reader on parchment. That pairing is
// declared once, in the theme record, and nothing else has to know about it.

import { READER_THEMES_BY_ID } from "./themes";

/**
 * Is this stored value one of the designed themes, rather than a plain
 * appearance keyword? Unknown values answer no, so a theme withdrawn in a later
 * release degrades to the app's normal light/dark handling instead of crashing.
 */
export const isDesignedTheme = (themeMode, byId = READER_THEMES_BY_ID) => Boolean(byId[themeMode]);

/**
 * The appearance a stored theme value implies, or null when the value is not a
 * designed theme and the caller should apply its own Default/Light/Dark rules.
 *
 * @returns {"light"|"dark"|null}
 */
export const appearanceFor = (themeMode, byId = READER_THEMES_BY_ID) =>
  byId[themeMode]?.base ?? null;

/**
 * The reading-theme record to render the Bani with.
 *
 * @param themeMode  `state.theme`.
 * @param byId       The registry to resolve against — the bundled map by
 *                   default, or the merged one (theme/reader/registry) which
 *                   carries the backend's themes too.
 * @param appIsDark  Whether the app is currently dark — already accounts for
 *                   "Default" following the OS. Used only when `themeMode` is
 *                   not a designed theme, where the Reader follows the app and
 *                   renders exactly as it did before this feature existed.
 */
const resolveReaderTheme = (themeMode, appIsDark, byId = READER_THEMES_BY_ID) =>
  byId[themeMode] ?? byId[appIsDark ? "dark" : "light"];

export default resolveReaderTheme;
