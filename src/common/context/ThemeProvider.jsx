import React, { useState, useEffect, useMemo } from "react";
import { Appearance } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { appearanceFor } from "@theme/reader/resolve";
import useThemeRegistry from "@theme/reader/useThemeRegistry";
import PropTypes from "prop-types";
import { lightTheme, darkTheme } from "@theme";
import { setTheme } from "../actions";
import constant from "../constant";
import ThemeContext from "./ThemeContext";

const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme);
  // Bundled themes plus the backend's — a theme served remotely pairs its
  // appearance and recolours the app exactly as a bundled one does.
  const { byId } = useThemeRegistry();
  const fontFace = useSelector((state) => state.fontFace);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  // Use useMemo to prevent infinite re-renders
  const theme = useMemo(() => {
    // A designed theme carries the appearance it is meant to be read in — Blue
    // pairs with dark, Puratan and Kesari with light — so picking one sets both
    // axes at once and the app can never end up dark-chromed around a cream
    // page. The pairing lives in the theme record, not here.
    const paired = appearanceFor(themeMode, byId);
    if (paired) {
      const base = paired === "dark" ? darkTheme : lightTheme;
      // A designed theme recolours the WHOLE app, not just the Reader. Its
      // `app` group holds the same semantic role names `base.c` does, so every
      // screen's existing style rules keep working and simply resolve to themed
      // values — no screen had to change.
      //
      // `designedTheme` is the flag the per-screen palettes read: Dashboard,
      // Seva and Settings each override a dozen roles of their own, and left
      // active they would paint their navy straight back over the theme.
      const record = byId[themeMode];
      return { ...base, c: { ...base.c, ...record.app }, designedTheme: themeMode };
    }
    if (themeMode === constant.Light) {
      return lightTheme;
    }
    if (themeMode === constant.Dark) {
      return darkTheme;
    }
    // Default — and anything the registry cannot resolve, which is what a theme
    // withdrawn by the backend leaves behind until the setting is healed.
    // Falling through to light instead would put someone who was reading in a
    // withdrawn dark theme into a white app without being asked.
    return systemColorScheme === "dark" ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme, byId]);

  const value = useMemo(
    () => ({ theme, fontFace, setThemeMode: (mode) => dispatch(setTheme(mode)) }),
    [theme, fontFace, dispatch]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ThemeProvider;
