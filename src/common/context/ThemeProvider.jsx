import React, { useState, useEffect, useMemo } from "react";
import { Appearance } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import ThemeContext from "./ThemeContext";
import { lightTheme, darkTheme } from "../theme";
import constant from "../constant";
import { setTheme } from "../actions";

const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  // Use useMemo to prevent infinite re-renders
  const theme = useMemo(() => {
    if (themeMode === constant.Default) {
      return systemColorScheme === "dark" ? darkTheme : lightTheme;
    }
    if (themeMode === constant.Dark) {
      return darkTheme;
    }
    return lightTheme;
  }, [themeMode, systemColorScheme]);

  const value = useMemo(
    () => ({ theme, setThemeMode: (mode) => dispatch(setTheme(mode)) }),
    [theme, dispatch]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ThemeProvider;
