import { useMemo } from "react";
import { StyleSheet } from "react-native";
import useTheme from "@common/context";
import useReaderTheme from "./useReaderTheme";

// Repoints a slice of the Reader's React Native chrome from the APP appearance
// onto the READING theme.
//
// The audio player, its dialogs, the mini pill and the bottom navigation all sit
// ON the Reader beside the Bani. A parchment page under a navy player reads as
// broken. But rewriting a dozen components' style rules onto new token names
// would be a large diff over working playback code, and the brief was explicitly
// appearance only — no behaviour.
//
// So this is the same seam `screenPalettes.js` already uses for the Dashboard
// and Seva: the theme is returned with its `c` (semantic colour) map OVERRIDDEN,
// and the role names stay exactly what they were. Every existing
// `theme.c.surface` in those components keeps working and simply resolves to a
// themed value. Not one style rule changes, and nothing that is not a colour is
// touched.
//
// Two properties make this safe:
//
//   1. The light and dark reading records fill these groups FROM the app's own
//      light and dark palettes (see bases/appBase.js), so when the reading theme
//      agrees with the app appearance the override is the IDENTITY. "Follow app
//      theme" — the default — is therefore provably unchanged, not merely
//      hand-matched.
//   2. `mode` follows the reading theme's base, so the handful of places that
//      branch on it (blur type, iOS indicator style) follow the page rather than
//      the app: a dark player on Blue, a light one on Puratan, whichever
//      appearance the app itself is in.
//
// `error` is deliberately never remapped — a failed download stays red.

const buildScopedTheme = (appTheme, roles, base) => ({
  ...appTheme,
  mode: base,
  c: { ...appTheme.c, ...roles },
});

/**
 * The active theme with one reading-theme group merged over its colour roles.
 *
 * @param {"audio"|"nav"} group Which group of the record to apply.
 * @param {boolean} [enabled=true] Pass false to opt out and get the app theme
 *   untouched — Settings opened from the Reader keeps the reader BUTTONS while
 *   staying on the app appearance.
 */
export const useReaderScopedTheme = (group, enabled = true) => {
  const { theme: appTheme } = useTheme();
  const { theme: readerTheme } = useReaderTheme();

  return useMemo(
    () => ({
      theme: enabled ? buildScopedTheme(appTheme, readerTheme[group], readerTheme.base) : appTheme,
    }),
    [appTheme, readerTheme, group, enabled]
  );
};

/**
 * `useThemedStyles`, but against a reading-theme-scoped theme. A drop-in for
 * the components covered by the group.
 */
export const useReaderScopedStyles = (create, group, enabled = true) => {
  const { theme } = useReaderScopedTheme(group, enabled);
  return useMemo(() => StyleSheet.create(create(theme)), [create, theme]);
};

export { buildScopedTheme };
export default useReaderScopedTheme;
