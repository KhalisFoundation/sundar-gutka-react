import { useMemo } from "react";
import { StyleSheet } from "react-native";
import useTokens from "./useTokens";

// The design-system counterpart to `useThemedStyles`.
//
// `useThemedStyles` hands the style factory the raw theme, so a screen using it
// reads `theme.spacing.md` — a fixed number that ignores screen width and the
// user's text-size setting. This passes the RESOLVED tokens instead, so every
// measurement in the returned stylesheet is already scaled for this device.
//
//   const styles = useTokenStyles(({ c, space, layout, radii, type }) => ({
//     row: { padding: space.lg, backgroundColor: c.surface },
//   }));
//
// The factory re-runs when the theme, the window width or the font scale
// changes, and `StyleSheet.create` keeps the result cheap to apply.
const useTokenStyles = (create) => {
  const tokens = useTokens();
  return useMemo(() => StyleSheet.create(create(tokens)), [create, tokens]);
};

export default useTokenStyles;
