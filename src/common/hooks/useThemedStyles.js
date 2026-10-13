import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

// A stylesheet built from the active theme.
//
// The theme it receives is already resolved for whatever screen scope this is
// read in — see useTheme — so a scoped screen colours its stylesheets, not just
// the components that read tokens directly.
export default function useThemedStyles(create) {
  const { theme } = useTheme();
  // create(theme) should return a plain object of style rules
  return useMemo(() => StyleSheet.create(create(theme)), [theme]);
}
