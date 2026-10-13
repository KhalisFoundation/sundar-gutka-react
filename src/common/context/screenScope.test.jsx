import React from "react";
import { Text } from "react-native";

import { render, screen } from "@testing-library/react-native";
import lightTheme from "@theme/lightTheme";
import { remoteThemeRows } from "@theme/reader/__fixtures__/remoteThemes";
import { contrastRatio } from "@theme/reader/contrast";
import { mergeThemeRegistry } from "@theme/reader/registry";
import { designedRolesFor } from "@theme/reader/screenPalette";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";

import ThemeContext, { useTheme } from "./ThemeContext";

// `useTheme` is where a screen's role overrides are actually applied. It used
// to short-circuit on `designedTheme`, so a designed theme received NO screen
// adjustment at all — which is why the settings call-to-action pair, correct in
// isolation, never reached the button and Rename stayed invisible on Sanjh.
//
// Everything else was verified by calling `themeForScreen` directly, which
// bypasses this exact line. These go through the hook.

const Probe = () => {
  const { theme } = useTheme();
  const cta = theme.c.ctaFill ?? theme.c.primary;
  return <Text testID="probe">{`${cta}|${theme.c.surfaceElevated}`}</Text>;
};

// The designed themes are served from the backend now, so they reach the app
// through the merge rather than through an import. Same records, same result.
const DESIGNED = mergeThemeRegistry({ themes: remoteThemeRows }).byId;

const renderScoped = (themeId, scope) => {
  const record = DESIGNED[themeId];
  const value = {
    theme: { ...lightTheme, c: { ...lightTheme.c, ...record.app }, designedTheme: themeId },
  };
  render(
    <ThemeContext.Provider value={value}>
      {scope ? (
        <ScreenRolesProvider screen={scope}>
          <Probe />
        </ScreenRolesProvider>
      ) : (
        <Probe />
      )}
    </ThemeContext.Provider>
  );
  const [cta, surfaceElevated] = screen.getByTestId("probe").props.children.split("|");
  return { cta, surfaceElevated };
};

describe("a designed theme still receives its screen adjustments", () => {
  it.each(["sanjh", "blue", "puratan", "kesari", "white"])(
    "%s: the settings-scoped button is visible on the sheet",
    (id) => {
      const { cta, surfaceElevated } = renderScoped(id, "settings");
      // 3:1 is WCAG's floor for a filled control against its background.
      expect([id, contrastRatio(cta, surfaceElevated) >= 3]).toEqual([id, true]);
    }
  );

  it("never overrides `primary` — that is the bottom nav bar's colour", () => {
    // The regression this guards: the CTA fix originally overrode `primary`
    // inside the settings scope, and the nav bar reads that same role through
    // useReaderScopedTheme -> useTheme, so the whole bar took the toggle
    // colour. No screen override may contain it.
    const FORBIDDEN = ["primary", "onPrimary", "primaryPressed"];
    ["settings", "settingsSheet", "seva"].forEach((scope) => {
      Object.values(DESIGNED).forEach((theme) => {
        const roles = designedRolesFor(scope, theme.app) ?? {};
        const leaked = Object.keys(roles).filter((k) => FORBIDDEN.includes(k));
        expect([scope, theme.id, leaked]).toEqual([scope, theme.id, []]);
      });
    });
  });
});
