/* eslint-env jest */
import { Platform } from "react-native";
import { androidLineHeight, NATURAL_LINE_BOX } from "./lineHeight";

// The regression this exists for: Gurmukhi and Devanagari losing the tops of
// their glyphs on iPhone while the same screen read correctly on Android.
//
// Both platforms are handed the same `lineHeight`, and both are asked for a box
// smaller than the face's own. Android splits the shortfall between ascent and
// descent (CustomLineHeightSpan) and squashes the leading. iOS adds a centring
// baseline offset ONLY when there is room for one —
//
//   if (maximumLineHeight < maximumFontLineHeight) { return; }
//
// (RCTTextShadowView.mm, `postprocessAttributedText`) — and below the font's box
// it returns without one, so TextKit puts the baseline at `lineHeight - descent`
// and every missing point comes off the ascent. That is where a lagaa or a matra
// lives, which is why one style looks right in English and cut in Punjabi.
//
// Measured from the shipped TTFs in android/app/src/main/assets/fonts:
//
//   BalooPaaji2-Regular / -SemiBold   1000upem, hhea 1157/-614   -> 1.771em
//   GurbaniAkharTrue                  2000upem, hhea 1856/-801   -> 1.329em
//
// and, from the same files' glyph bounding boxes, the smallest ratio Baloo can
// actually be given before iOS starts cutting ink:
//
//   Latin caps and digits      1.24em
//   Latin accents (fr/it/es)   1.45em
//   Gurmukhi                   1.52em
//
// Devanagari has no entry because BalooPaaji2 does not cover it at all — Hindi
// is drawn by a system face React Native never measured, so no floor computed
// from Baloo would be trustworthy. Handing iOS nothing is what covers that case.

const setPlatform = (os) => {
  Platform.OS = os;
};

afterEach(() => setPlatform("ios"));

describe("androidLineHeight", () => {
  it("passes the pinned value through on Android, whose layout was tuned to it", () => {
    setPlatform("android");
    expect(androidLineHeight(18)).toBe(18);
  });

  it("gives iOS nothing, so the run keeps its own face's metrics", () => {
    setPlatform("ios");
    expect(androidLineHeight(18)).toBeUndefined();
  });

  it("drops the value on iOS however it was computed", () => {
    setPlatform("ios");
    expect(androidLineHeight(Math.round(16 * 1.4))).toBeUndefined();
  });

  it("keeps 0 meaningful on Android rather than treating it as absent", () => {
    setPlatform("android");
    expect(androidLineHeight(0)).toBe(0);
  });
});

describe("NATURAL_LINE_BOX", () => {
  it("matches the hhea metrics of the shipped faces", () => {
    expect(NATURAL_LINE_BOX.baloo).toBeCloseTo((1157 + 614) / 1000, 3);
    expect(NATURAL_LINE_BOX.gurbani).toBeCloseTo((1856 + 801) / 2000, 3);
  });

  it("is the bar every pinned line height in the app fell under", () => {
    // 22 on a 16pt Baloo label — the audio player's Audios/Options pill, and
    // typical of the values this app ships. It needs 28.3.
    expect(22).toBeLessThan(16 * NATURAL_LINE_BOX.baloo);
  });
});
