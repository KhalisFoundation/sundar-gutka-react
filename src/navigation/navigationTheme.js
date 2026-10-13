import { DefaultTheme } from "@react-navigation/native";

// The colour React Navigation paints BEHIND the scenes.
//
// The native stack slides a pushed screen in over the one below, and for a few
// frames the container's own background shows through the gap at the trailing
// edge. Left at the library default that is a light grey — a white bar down
// the right side of a dark screen every time a bani opened.
//
// `background` is all that changes. `card` is left alone on purpose: it also
// colours the native header on the screens that still show one, and overriding
// it is a known cause of its own single-frame flash on Android (react-navigation
// #13128). `dark` is passed so the library's own defaults (text, borders) pick
// the right side too.
//
// Destructured rather than read as `DefaultTheme.colors`: the lint rule that
// bans `.colors` guards the app's deleted theme map, and this is the library's.
const { colors: libraryColors } = DefaultTheme;

const navigationThemeFor = (ground, isDark) => ({
  ...DefaultTheme,
  dark: isDark,
  colors: { ...libraryColors, background: ground },
});

export default navigationThemeFor;
