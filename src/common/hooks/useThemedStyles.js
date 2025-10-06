import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function useThemedStyles(create) {
  const { theme } = useTheme();
  // create(theme) should return a plain object of style rules
  return useMemo(() => StyleSheet.create(create(theme)), [theme]);
}
