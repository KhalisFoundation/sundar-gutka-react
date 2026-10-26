// Reading-theme registry — the themes the APP SHIPS WITH.
//
// Light and dark only, deliberately. Every other theme is served from the
// backend (`reader_themes`) and merged over these at runtime by
// mergeThemeRegistry, so the catalogue can grow, be retuned or be withdrawn
// without an app release. The five that used to live here — blue, kesari,
// puratan, white, sanjh — are database rows now; each derives to exactly the
// theme it replaced.
//
// These two stay bundled because they are the FALLBACK: a first launch with no
// network still needs a reading surface, and `mergeThemeRegistry` refuses to
// let a remote row remove either of them.
//
// Adding a theme here is three things: one file next to these, one import plus
// one array entry, and one `reader_theme_<id>` string per language in
// src/common/localization.js — but prefer a database row unless the theme has
// to work offline on a fresh install.

import dark from "./dark";
import light from "./light";

export const READER_THEMES = [light, dark].sort((a, b) => a.order - b.order);

export const READER_THEMES_BY_ID = READER_THEMES.reduce((acc, theme) => {
  acc[theme.id] = theme;
  return acc;
}, {});

export default READER_THEMES;
