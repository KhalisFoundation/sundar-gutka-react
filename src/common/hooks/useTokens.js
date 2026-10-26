import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { resolveTokens } from "@theme/scale";
import { layoutFor } from "@theme/screenPalettes";
import { useScreenRolesScope } from "@theme/ScreenRolesProvider";
import { useTheme } from "../context/ThemeContext";

// The single entry point for design tokens in a component.
//
// Returns the theme's colours plus space/layout values already resolved for
// this device's width and the user's OS text-size setting, so a component never
// writes a measurement and never branches on screen size itself.
//
// `useWindowDimensions` is deliberate: it re-renders on rotation, split-screen
// and foldable unfold, which `Dimensions.get()` — used in four files today —
// does not, because it captures a value once at module load.
//
//   const { c, space, layout, type, radii } = useTokens();
//
const useTokens = () => {
  const { theme } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  // A subtree can be scoped to one screen's colours (see ScreenRolesProvider).
  // Outside a provider this is null and `c` is the semantic layer untouched, so
  // every existing caller is unaffected.
  const screen = useScreenRolesScope();

  return useMemo(() => {
    const { scale, space, layout } = resolveTokens({
      space: theme.space,
      layout: theme.layout,
      width,
      fontScale,
    });
    return {
      /** Colours for the active theme, already scoped by useTheme. */
      c: theme.c,
      /** Unscaled type roles — RN applies the user's text scale at render. */
      type: theme.type,
      radii: theme.radii,
      elevation: theme.elevation,
      /** Theme-dependent assets — the Khalis mark has a light and a dark file. */
      images: theme.images,
      space,
      // A scoped screen's layout overrides go on AFTER resolution, so they land
      // as the exact numbers they declare. The Settings sheet's padding was a
      // flat 16/24 that never scaled with the device — putting the override in
      // before resolution multiplied it and made the sheet visibly taller.
      // Row height still follows the text, because the height floor is 0.
      layout: layoutFor(screen, layout),
      scale,
      mode: theme.mode,
      isDark: theme.mode === "dark",
      /** Escape hatch for the deprecated maps, during migration only. */
      theme,
    };
  }, [theme, width, fontScale, screen]);
};

export default useTokens;
