import { useCallback } from "react";
import { useSelector } from "react-redux";
import constant from "@common/constant";
import { convertToUnicode, STRINGS } from "@common";

/**
 * A pothi's display name, and the type face it must be drawn in.
 *
 * ONLY a bundled Sundar Gutka folder needs converting: its name comes from the
 * Banis table as GurbaniAkhar ASCII with no Unicode column, which renders as
 * mojibake ("sv`Xy") under Baloo. That is the same fallback the bani list
 * applies.
 *
 * A user pothi must never go through the converter. Its name is either typed by
 * the user or a localised string (the two default Nitnem pothis), and running a
 * Gurmukhi transliterator over real text mangles it — which is exactly what
 * turned Morning Nitnem into broken Punjabi once before.
 *
 * `variantFor` goes with it because the two cannot be decided apart: the
 * GurbaniAkhar face is right for a bundled folder's ASCII name and wrong for a
 * name somebody typed.
 *
 * MORNING AND EVENING NITNEM ARE NAMED BY ROLE, NOT BY THEIR STORED NAME.
 *
 * The account's pair is stored in English — the API seeds it that way, and the
 * English name is also how a device with no recorded pointer finds the pair
 * (see resolveDefaultId), which is why a default cannot be renamed. So what is
 * stored and what is shown are deliberately two different things: the stored
 * name stays English and in sync on every device, and each device shows the
 * pair in its own language. Keyed on the id the pointer records, so it follows
 * the pothi rather than whatever name it happens to carry.
 */
const usePothiTitle = () => {
  const fontFace = useSelector((state) => state.fontFace);
  const isUnicode = fontFace === constant.BALOO_PAAJI;
  // The two ids as plain strings, so the callback is not rebuilt on every edit
  // to the slice — only when the pair itself is re-pointed.
  const morningId = useSelector((state) => state.pothis?.defaultIds?.morning ?? null);
  const eveningId = useSelector((state) => state.pothis?.defaultIds?.evening ?? null);
  // STRINGS switches language in place, so it cannot be a dependency; the
  // setting that switches it is, or a changed language would leave the old
  // translation in any memoised caller.
  const language = useSelector((state) => state.language);

  const titleFor = useCallback(
    (pothi) => {
      if (!pothi) return "";
      if (pothi.id && pothi.id === morningId) return STRINGS.POTHI_DEFAULT_MORNING;
      if (pothi.id && pothi.id === eveningId) return STRINGS.POTHI_DEFAULT_EVENING;
      if (pothi.titleUni) return pothi.titleUni;
      return pothi.system && isUnicode ? convertToUnicode(pothi.name) : pothi.name;
    },
    // `language` is not read inside; it is the trigger, see above.
    [isUnicode, morningId, eveningId, language]
  );

  /** The ScreenHeader title variant a pothi's name should be rendered with. */
  const variantFor = useCallback(
    (pothi) => (pothi?.system && !pothi?.titleUni && !isUnicode ? "baniTitle" : "heading"),
    [isUnicode]
  );

  return { titleFor, variantFor };
};

export default usePothiTitle;
