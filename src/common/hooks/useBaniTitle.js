import { useCallback } from "react";
import { useSelector } from "react-redux";
import constant from "../constant";
import { baniName } from "../reminders/title";

/**
 * How a bani's name is displayed, and in which face.
 *
 * ONE implementation, and it lives in reminders/title as `baniName` so the
 * notification path can share it without pulling React in. This hook is that
 * rule plus the two settings it needs. My Pothi once grew a second, shorter
 * copy that skipped the transliteration branch entirely, so the same bani
 * appeared in Gurmukhi inside a pothi while the list behind it showed Latin.
 * Anything that renders a bani name reads this instead of re-deriving it.
 *
 * The order matters: transliteration WINS. It is an explicit user choice about
 * the script they read in, so it is checked before the Gurmukhi font question
 * is asked at all.
 *
 * `titleFontFamily` comes back with it because the two cannot be decided apart
 * — Gurmukhi text needs the bani face, and transliterated Latin must NOT get
 * it. Returning the string alone is what let callers draw Gurmukhi in the UI
 * font.
 */
const useBaniTitle = () => {
  const fontFace = useSelector((state) => state.fontFace);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isUnicode = fontFace === constant.BALOO_PAAJI;

  const titleFor = useCallback(
    (bani) => baniName(bani, { isTransliteration, unicode: isUnicode }),
    [isTransliteration, isUnicode]
  );

  return {
    titleFor,
    /** Null under transliteration — that is Latin, and the UI font is right. */
    titleFontFamily: isTransliteration ? null : fontFace,
    isTransliteration,
  };
};

export default useBaniTitle;
