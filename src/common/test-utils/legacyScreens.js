// Screens not yet moved onto the design system, relative to src/.
//
// The app-wide checks (every sheet, every overlay, every surface) skip these,
// the same way .eslintrc.json exempts them from the token guard. Each one moves
// over with its own feature, and its line here goes with it: the audio player
// with the audio PR, the folder screen and its AppBar with My Pothi, the
// reminders screen with Reminders, and the audio settings row with Downloads.
export const LEGACY_SCREEN_PATHS = [
  "ReaderScreen/components/AudioPlayer/",
  "common/components/AppBar/",
  "FolderScreen/",
  "Settings/components/reminders/",
  "Settings/components/audio.jsx",
];

/** True for a src/-relative path that is still on the legacy styling. */
export const isLegacyScreen = (rel) =>
  LEGACY_SCREEN_PATHS.some((prefix) => rel.split("\\").join("/").startsWith(prefix));
