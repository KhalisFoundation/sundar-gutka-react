// Screens not yet moved onto the design system, relative to src/.
//
// The app-wide checks (every sheet, every overlay, every surface) skip these,
// the same way .eslintrc.json exempts them from the token guard. Each one moves
// over with its own feature, and its line here goes with it: the folder screen
// and its AppBar with My Pothi, and the reminders screen with Reminders.
export const LEGACY_SCREEN_PATHS = [
  "common/components/AppBar/",
  "FolderScreen/",
  "Settings/components/reminders/",
];

/** True for a src/-relative path that is still on the legacy styling. */
export const isLegacyScreen = (rel) =>
  LEGACY_SCREEN_PATHS.some((prefix) => rel.split("\\").join("/").startsWith(prefix));
