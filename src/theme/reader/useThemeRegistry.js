import { useMemo } from "react";
import { useSelector } from "react-redux";
import { mergeThemeRegistry } from "./registry";

/**
 * The live theme registry — bundled themes with the backend's additions,
 * corrections and withdrawals applied — memoised on the persisted slice, so
 * the merge (and the derivation of every remote theme) runs once per fetch,
 * not once per render.
 */
const useThemeRegistry = () => {
  const remoteThemes = useSelector((state) => state.remoteThemes);
  return useMemo(() => mergeThemeRegistry(remoteThemes), [remoteThemes]);
};

export default useThemeRegistry;
