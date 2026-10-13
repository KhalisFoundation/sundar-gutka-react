// Every theme the app can show: the two it bundles, plus the five the backend
// serves. This is what a device sees once a theme sync has landed, and it is
// what most suites want — they test how a theme behaves, not where it came
// from. Use READER_THEMES directly only when the question really is "what does
// the app ship with".
import { mergeThemeRegistry } from "../registry";
import { remoteThemeRows } from "./remoteThemes";

const merged = mergeThemeRegistry({ themes: remoteThemeRows });

export const ALL_THEMES = merged.list;
export const ALL_THEMES_BY_ID = merged.byId;
export default ALL_THEMES;
