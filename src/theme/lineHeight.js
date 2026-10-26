// TIER 1 — why a pinned `lineHeight` is an ANDROID-ONLY instruction here.
//
// The two platforms implement the property differently, and only one of them
// can honour a value smaller than the face's own line box.
//
// ── iOS takes the whole shortfall off the ASCENT ────────────────────────────
//
// `lineHeight` becomes NSParagraphStyle's min/maximumLineHeight
// (RCTTextAttributes.mm). RCTTextShadowView's `postprocessAttributedText` then
// re-centres the glyphs inside that box — but only when there is room for it:
//
//     if (maximumLineHeight < maximumFontLineHeight) { return; }
//     baseLineOffset = maximumLineHeight / 2.0 - maximumFontLineHeight / 2.0;
//
// Below the font's own box it returns WITHOUT adding the offset, so TextKit
// lays the line out from the bottom: the baseline sits `lineHeight - descent`
// under the top edge and every missing point comes off the ascent. That is the
// half of the line Gurmukhi lagaa and Devanagari matras live in, so they are
// sliced off while Latin — whose caps stop well short of the ascender — comes
// through intact. It is why one style reads fine in English and broken in
// Hindi and Punjabi.
//
// Android splits the same shortfall between ascent and descent instead
// (CustomLineHeightSpan), which tightens the leading without cutting glyphs.
// Every pinned value this app ships was chosen against that behaviour and is
// correct there, so Android is handed it untouched.
//
// ── Why iOS gets nothing rather than a bigger number ────────────────────────
//
// A floor would have to be recomputed, and could not hold:
//   - It cannot be outgrown. React Native scales `fontSize` with the OS
//     text-size setting but leaves an explicit `lineHeight` exactly as written,
//     so any pinned box starts clipping again as soon as someone turns their
//     text up.
//   - It survives font fallback. BalooPaaji2 carries no Devanagari at all, so
//     Hindi is drawn by a system face RN never measured — a floor derived from
//     Baloo would not cover it.
//   - Unset is already the app's answer everywhere else: no role in the type
//     scale pins one, for the same reason. See the note in type.js.
//
// Measured from the shipped files in android/app/src/main/assets/fonts:
// BalooPaaji2 is 1000upem, hhea 1157/-614, USE_TYPO_METRICS — a 1.771em box.
// GurbaniAkharTrue is 2000upem, hhea 1856/-801 — a 1.329em box.

import { Platform } from "react-native";

/**
 * The line box each bundled face asks for, as a multiple of `fontSize`.
 *
 * A `lineHeight` at or above this is safe on both platforms; anything under it
 * clips on iOS and squashes on Android.
 */
export const NATURAL_LINE_BOX = {
  baloo: 1.771,
  gurbani: 1.329,
};

/**
 * A `lineHeight` only Android is given.
 *
 * Android keeps `value`; iOS gets `undefined` and draws each run in its own
 * face's metrics. Wrap any pinned line height that sits under
 * `fontSize * NATURAL_LINE_BOX` — which, in practice, is all of them.
 */
export const androidLineHeight = (value) => (Platform.OS === "ios" ? undefined : value);

export default androidLineHeight;
