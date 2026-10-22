import { useMemo } from "react";
import { useSelector } from "react-redux";
import useTheme from "@common/context";
import resolveReaderTheme, { isDesignedTheme } from "./resolve";
import useThemeRegistry from "./useThemeRegistry";

/**
 * The single entry point for reading-theme values.
 *
 * Returns:
 *   theme        the resolved record (never null)
 *   selectedId   the stored setting, so Settings can mark the right tile
 *   isDesigned   whether that setting is a designed theme rather than a plain
 *                Default/Light/Dark appearance
 *
 * There is ONE setting behind this — `state.theme`. When it names a designed
 * theme, ThemeProvider has already put the app into that theme's paired
 * appearance, so `appTheme.mode` below agrees with the record by construction.
 * When it does not, the Reader follows the app exactly as it always has.
 */
const useReaderTheme = () => {
  const selectedId = useSelector((state) => state.theme);
  const { theme: appTheme } = useTheme();
  const appIsDark = appTheme.mode === "dark";
  const { byId } = useThemeRegistry();

  return useMemo(
    () => ({
      theme: resolveReaderTheme(selectedId, appIsDark, byId),
      selectedId,
      isDesigned: isDesignedTheme(selectedId, byId),
    }),
    [selectedId, appIsDark, byId]
  );
};

export default useReaderTheme;
