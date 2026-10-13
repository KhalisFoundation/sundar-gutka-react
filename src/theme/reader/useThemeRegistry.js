import { useMemo } from "react";
import { useSelector } from "react-redux";
import { mergeThemeRegistry } from "./registry";

/**
 * The live theme registry — bundled themes with the backend's additions,
 * corrections and withdrawals applied — memoised on the served rows alone, so
 * the merge (and the derivation of every remote theme) runs only when the
 * catalogue changes: not once per render, and not on a refresh that only moved
 * `fetchedAt` (the sync keeps the same array when nothing changed).
 */
const useThemeRegistry = () => {
  const themes = useSelector((state) => state.remoteThemes?.themes);
  return useMemo(() => mergeThemeRegistry({ themes }), [themes]);
};

export default useThemeRegistry;
