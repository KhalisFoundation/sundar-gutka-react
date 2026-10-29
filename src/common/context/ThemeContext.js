import { createContext, useContext, useMemo } from "react";
import { themeForScreen } from "@theme/screenPalettes";
import { useScreenRolesScope } from "@theme/ScreenRolesProvider";

const ThemeContext = createContext(null);

/**
 * The active theme, already resolved for whatever screen scope it is read in.
 *
 * The scope is applied HERE rather than in each consumer because this is the
 * one place every consumer goes through — useTokens, useThemedStyles, and the
 * many components that read theme.c inline all end up on the same object. A
 * scoped screen with an unscoped body was the symptom of applying it anywhere
 * further down.
 *
 * Outside a ScreenRolesProvider the scope is null and the context value is
 * returned exactly as the provider set it.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  const screen = useScreenRolesScope();
  // Always scoped when inside a provider.
  //
  // `themeForScreen` already knows what to do with a designed theme: it does
  // NOT layer the light/dark screen palettes on top — that would paint the
  // app's navy straight back over Puratan's parchment — and applies only that
  // screen's deliberate adjustments instead. See `designedRolesFor`.
  //
  // This used to short-circuit on `designedTheme`, so NO screen adjustment
  // reached a designed theme at all. That is why the settings-scoped
  // call-to-action pair never applied and Rename stayed invisible on Sanjh.
  const applyScreen = Boolean(screen);
  const scoped = useMemo(
    () =>
      context && applyScreen
        ? { ...context, theme: themeForScreen(context.theme, screen) }
        : context,
    [context, screen, applyScreen]
  );
  if (!scoped) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return scoped;
};

export default ThemeContext;
