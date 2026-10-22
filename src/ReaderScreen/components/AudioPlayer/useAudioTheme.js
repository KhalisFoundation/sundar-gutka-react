import { useReaderScopedTheme, useReaderScopedStyles } from "@theme/reader";

// The audio UI's theme.
//
// The player, the mini pill, the track dialog and the settings sheet all sit ON
// the Reader beside the Bani, so they follow the READING theme rather than the
// app appearance — a parchment page under a navy player reads as broken.
//
// These are drop-in replacements for `useTheme()` and `useThemedStyles()`: the
// theme comes back with its semantic colour roles remapped, so every existing
// `theme.c.surface` in these components keeps working and simply resolves to a
// themed value. Not one style rule in this folder changed, and nothing that is
// not a colour was touched. See useReaderScopedTheme for why that is safe.
//
// Wrapped here rather than importing @theme/reader in eleven components so the
// group name ("audio") is written once and cannot drift between them.

export const useAudioTheme = () => useReaderScopedTheme("audio");

export const useAudioThemedStyles = (create) => useReaderScopedStyles(create, "audio");

export default useAudioTheme;
