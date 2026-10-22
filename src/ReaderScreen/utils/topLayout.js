import foldableTopSpace from "@common/foldableTopSpace";

// Where the Reader's page begins, and how far its first line sits below that.
//
// Two numbers make up the space above the bani:
//   • WEBVIEW_TOP_MARGIN — the WebView's own top margin, and therefore where the
//     scrollable viewport actually begins. ReaderScrollbar's track must start at
//     the SAME line or its thumb travel no longer matches the page's. This is
//     NOT the header overlay height: the header floats OVER the page, while this
//     is where the page itself starts.
//   • PAGE_TOP_MARGIN — the body's top margin inside the page. It scrolls away
//     with the text, and together with the viewport's start it puts the first
//     line of a freshly opened bani clear of the floating header.
//
// The viewport margin never scrolls, so once reading is under way it shows as
// a band of flat ground above the text whenever the header is hidden.
export const WEBVIEW_TOP_MARGIN = 60;
export const PAGE_TOP_MARGIN = 50;

/**
 * The Reader's top spacing.
 *
 * With no foldable inset (every phone that does not fold) the two fixed
 * margins above are returned untouched, exactly as they have always been.
 *
 * A foldable gives back whatever of each fixed band its cutout does not need
 * (see `foldableTopSpace`): the page starts at the inset, capped at the fixed
 * margin, so the text runs up to the top of the screen mid-bani. The page
 * margin then puts the first line of a freshly opened bani the same distance
 * below the header's top as on every other phone — the header having moved up
 * by the same rule.
 *
 * @param {{ foldableInsetTop: number | null, headerTopClearance: number }} args
 *   `headerTopClearance` is the FIXED header clearance token.
 * @returns {{ webViewTop: number, pageTopMargin: number }}
 */
export const readerTopLayout = ({ foldableInsetTop, headerTopClearance }) => {
  if (foldableInsetTop === null || foldableInsetTop === undefined) {
    return { webViewTop: WEBVIEW_TOP_MARGIN, pageTopMargin: PAGE_TOP_MARGIN };
  }
  const webViewTop = foldableTopSpace(foldableInsetTop, WEBVIEW_TOP_MARGIN);
  const headerTop = foldableTopSpace(foldableInsetTop, headerTopClearance);
  // How far below the header's top the first line sits with the fixed margins.
  const firstLineBelowHeaderTop = WEBVIEW_TOP_MARGIN + PAGE_TOP_MARGIN - headerTopClearance;
  const pageTopMargin = Math.max(0, headerTop + firstLineBelowHeaderTop - webViewTop);
  return { webViewTop, pageTopMargin };
};
