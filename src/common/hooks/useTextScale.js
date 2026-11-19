import { useSelector } from "react-redux";
import constant from "../constant";

/**
 * Multipliers for the in-app Font Size setting.
 * XS 0.85×, S 1.0× (today's size), M 1.15×, L 1.3×, XL 1.5×.
 */
export const FONT_SIZE_MULTIPLIERS = {
  [constant.EXTRA_SMALL]: 0.85,
  [constant.SMALL]: 1.0,
  [constant.MEDIUM]: 1.15,
  [constant.LARGE]: 1.3,
  [constant.EXTRA_LARGE]: 1.5,
};

/** Combined with the phone's text size, cap at 2×. */
export const MAX_COMBINED_SCALE = 2.0;

/**
 * Pure function: maps a Redux fontSize setting key to its multiplier.
 * Defaults to 1.0 (SMALL / today's size).
 */
export const scaleForFontSize = (fontSize) => FONT_SIZE_MULTIPLIERS[fontSize] ?? 1.0;

/**
 * Pure function: combines the app multiplier with the phone's text size,
 * capped at 2.0×.
 */
export const combinedScale = (fontSize, fontScale = 1) =>
  Math.min(MAX_COMBINED_SCALE, scaleForFontSize(fontSize) * (fontScale || 1));

/**
 * Hook that turns Redux `state.fontSize` into the in-app multiplier.
 * Safe to call outside a Redux Provider (falls back to 1.0).
 */
const useTextScale = () => {
  try {
    const fontSize = useSelector((state) => state?.fontSize);
    return scaleForFontSize(fontSize);
  } catch (_e) {
    return 1.0;
  }
};

export default useTextScale;
