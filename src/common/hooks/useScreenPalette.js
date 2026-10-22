import { paletteFor } from "@theme/screenPalettes";
import { useTheme } from "../context/ThemeContext";

/**
 * The screen-scoped palette for the active mode.
 *
 * Only the Dashboard, Seva and the bani list have one — see
 * `theme/screenPalettes.js` for why these colours sit outside the semantic
 * layer and must not be read anywhere else.
 *
 * @param {"dashboard"|"seva"|"baniList"} screen Which palette to read.
 */
const useScreenPalette = (screen) => {
  const { theme } = useTheme();
  return paletteFor(screen, theme);
};

export default useScreenPalette;
