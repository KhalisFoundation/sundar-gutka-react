import { PAGE_TOP_MARGIN, readerTopLayout, WEBVIEW_TOP_MARGIN } from "./topLayout";

// The fixed header clearance every phone that does not fold uses.
const HEADER_TOP_CLEARANCE = 48;

const layoutFor = (foldableInsetTop) =>
  readerTopLayout({ foldableInsetTop, headerTopClearance: HEADER_TOP_CLEARANCE });

// Where a freshly opened bani's first line lands, relative to the top of the
// header's row. The foldable header moves up by min(inset, 48); the first line
// must move with it, or a bani opens with its first line under the header.
const firstLineBelowHeaderTop = ({ webViewTop, pageTopMargin }, inset) =>
  webViewTop + pageTopMargin - Math.min(inset, HEADER_TOP_CLEARANCE);
const FIXED_GAP = WEBVIEW_TOP_MARGIN + PAGE_TOP_MARGIN - HEADER_TOP_CLEARANCE;

describe("readerTopLayout", () => {
  it("keeps the fixed margins on a phone that does not fold", () => {
    [null, undefined].forEach((inset) => {
      expect(layoutFor(inset)).toEqual({
        webViewTop: WEBVIEW_TOP_MARGIN,
        pageTopMargin: PAGE_TOP_MARGIN,
      });
    });
  });

  describe("on a foldable", () => {
    it("starts the page at a shallow inset", () => {
      expect(layoutFor(32).webViewTop).toBe(32);
      expect(layoutFor(0).webViewTop).toBe(0);
    });

    it("never starts the page lower than the fixed margin", () => {
      [60, 80, 136].forEach((inset) => {
        expect(layoutFor(inset).webViewTop).toBe(WEBVIEW_TOP_MARGIN);
      });
    });

    it("keeps the first line the same distance below the header", () => {
      [0, 24, 32, 48, 56, 60, 80].forEach((inset) => {
        expect(firstLineBelowHeaderTop(layoutFor(inset), inset)).toBe(FIXED_GAP);
      });
    });

    it("opens the first line exactly where the fixed layout does when the inset is deep", () => {
      // The Pixel 10 Pro Fold's inner display: a 56dp cutout. The header keeps
      // its 48, so the first line must land where it always has.
      const { webViewTop, pageTopMargin } = layoutFor(56);
      expect(webViewTop + pageTopMargin).toBe(WEBVIEW_TOP_MARGIN + PAGE_TOP_MARGIN);
    });

    it("treats a bad inset as zero", () => {
      [NaN, -10].forEach((inset) => {
        expect(layoutFor(inset).webViewTop).toBe(0);
      });
    });
  });
});
