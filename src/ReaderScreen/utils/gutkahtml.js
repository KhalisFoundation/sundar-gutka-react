import { Image, Platform } from "react-native";
import { constant } from "@common";
import script from "./gutkaScript";
import { PAGE_TOP_MARGIN } from "./topLayout";

const getFontFaceURL = (fontFace) => {
  const fileUri = Platform.select({
    ios: `${fontFace}.ttf`,
    android: `file:///android_asset/fonts/${fontFace}.ttf`,
  });
  return fileUri;
};

// Resolves whatever a reading theme put in `background.image` into something the
// WebView can load: a data URI or a remote URL passes through unchanged, while a
// require()d bundled asset is resolved to its runtime URI.
const resolveBackgroundImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image;
  return Image.resolveAssetSource(image)?.uri ?? null;
};

// A tiled or covering texture behind the text.
//
// Painted on a FIXED ::before pseudo-element rather than on `body`, for two
// reasons: CSS has no background-image-opacity, so honouring `imageOpacity` on
// the body itself would fade the Gurbani with it; and a fixed layer stays put
// instead of scrolling away from a long bani.
const backgroundImageCss = (background) => {
  const uri = resolveBackgroundImage(background.image);
  if (!uri) return "";
  return `
    body::before {
      content: "";
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('${uri}');
      background-repeat: ${background.imageRepeat};
      background-size: ${background.imageSize};
      opacity: ${background.imageOpacity};
      pointer-events: none;
      z-index: -1;
    }`;
};

// The theme's reading frame. `inset` holds it clear of the screen edge so it
// reads as a ruled page border rather than as window chrome, and it is fixed so
// it frames the viewport instead of scrolling away from a long bani.
//
// Four things this has to get right, each of which is a way it can look broken:
//
//  1. STACKING. Below the text, the rules paint BEHIND every line, so the Bani
//     draws straight over them. The frame sits above the text.
//
//  2. GUTTERS. With the UA's default body margin the text runs OUTSIDE a rule
//     sitting 10-12px in, and crosses it on both sides. The body is padded clear
//     of the rule's inner edge.
//
//  3. THE MARGIN STRIP. Stacking alone does not contain the text vertically: the
//     frame is fixed but the text scrolls, so the `inset` px between the viewport
//     edge and the rule is OUTSIDE the frame, and lines scrolling past the top or
//     bottom rule stay visible in it. Raising z-index cannot help — the text is
//     not under the rule, it is beyond it. So the frame also paints a matte: a
//     hard-edged outset box-shadow in the page ground that fills everything
//     outside and clips the text to the frame. Zero blur radius, so it is a solid
//     fill rather than an expensive gaussian on a scrolling page.
//
//  4. THE BAND BETWEEN TWO RULES. A CSS `double` border renders as
//     line / TRANSPARENT gap / line, and the matte only covers outside the border
//     box — so scrolling text shows through that gap on all four sides. A double
//     border cannot fix this; the gap is transparent by definition. So a two-rule
//     frame is not a `border-style` at all: it is built from concentric
//     box-shadow rings, every band of which is opaque. The element sits on the
//     INNER rule and paints outwards — opaque band, outer rule, then the matte.
//
// Only bordered themes get any of this. Light, Dark and White keep the UA's
// default margins, so their layout is byte-identical to the Reader's original.
// Resolves the frame's four independently colourable parts. Each falls back so
// that a theme stating only `{ width: 1 }` still gets a coherent frame, and a
// theme stating only `color` still gets a matching second rule:
//
//   inner  the rule the Bani sits inside          border.color
//   outer  the second rule, when gap > 0          border.outerColor ?? inner
//   band   the strip between the two rules        border.gapColor   ?? margin
//   margin everything from the outer rule to the  border.marginColor ?? the
//          screen edge — and the matte that       page ground
//          clips scrolling text to the frame
export const resolveBorder = (border, groundColor) => {
  const margin = border.marginColor ?? groundColor;
  return {
    width: border.width,
    // A manuscript frame is often thick-outer/thin-inner; unset, both rules
    // are the same weight.
    outerWidth: border.outerWidth ?? border.width,
    gap: border.gap ?? 0,
    inset: border.inset,
    radius: border.radius,
    style: border.style,
    inner: border.color,
    outer: border.outerColor ?? border.color,
    band: border.gapColor ?? margin,
    margin,
  };
};

const borderCss = (border, groundColor) => {
  if (!border?.width) return "";

  const b = resolveBorder(border, groundColor);
  const hasOuterRule = b.gap > 0;

  // Distances from the viewport edge, working inwards:
  //   inset -> outer rule -> band -> inner rule -> gutter -> text
  //
  // The element sits ON the inner rule, so with a second rule it is pushed in
  // past the outer rule and the band.
  const offset = hasOuterRule ? b.inset + b.outerWidth + b.gap : b.inset;

  // Text must clear the INNER edge of the innermost rule, at (offset + width).
  // The extra 10px keeps glyphs and their descenders from kissing the line —
  // Gurmukhi carries marks both above and below the baseline. This is what
  // guarantees the Bani never runs into the frame, whatever the rules cost.
  const gutter = offset + b.width + 10;

  // box-shadow spreads measure outward from the border box, and later shadows
  // paint BEHIND earlier ones, so increasing spreads stack into concentric rings
  // — each showing only the sliver the previous one did not cover. Every ring is
  // opaque, which is what keeps scrolling text out of the bands between rules.
  const rings = hasOuterRule
    ? [
        `0 0 0 ${b.gap}px ${b.band}`,
        `0 0 0 ${b.gap + b.outerWidth}px ${b.outer}`,
        `0 0 0 9999px ${b.margin}`,
      ]
    : [`0 0 0 9999px ${b.margin}`];

  return `
    body::after {
      content: "";
      position: fixed;
      top: ${offset}px;
      left: ${offset}px;
      right: ${offset}px;
      bottom: ${offset}px;
      /* border.style applies to the innermost rule. The outer rule comes from a
         box-shadow, which is always solid, so a non-solid style is fully
         honoured only on single-rule frames. */
      border: ${b.width}px ${b.style} ${b.inner};
      border-radius: ${b.radius}px;
      box-shadow: ${rings.join(", ")};
      pointer-events: none;
      z-index: 2;
    }
    body {
      /* padding-left/right only, never the padding shorthand: gutkaScript sets
         padding-bottom at runtime (setBottomInset) to clear the nav chrome, and
         the shorthand would wipe it out. */
      margin-left: 0;
      margin-right: 0;
      padding-left: ${gutter}px;
      padding-right: ${gutter}px;
    }`;
};

// `readerTheme` is a resolved reading-theme record, not the app theme.
// `pageTopMargin` is the body's top margin — see topLayout.js.
const htmlTemplate = (
  backColor,
  fontFace,
  content,
  readerTheme,
  pageTopMargin = PAGE_TOP_MARGIN
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name='viewport' content='width=device-width, user-scalable=no'>
  <style>
    /* Reading-theme tokens. Everything the theme controls is published here so
       markup baked ELSEWHERE can reference it by name — most importantly the
       vishraam spans, which are generated at DB-query time
       (src/database/utils/index.js) and would otherwise carry stale literal
       colours until the shabad happened to be refetched. Referencing var()
       defers the colour to render time, where the current theme always wins. */
    :root {
      --bg: ${backColor};
      --gurbani: ${readerTheme.text.gurbani.color};
      --gurbani-heading: ${readerTheme.text.gurbaniHeading.color};
      --translation: ${readerTheme.text.translation.color};
      --transliteration: ${readerTheme.text.transliteration.color};
      --teeka: ${readerTheme.text.teeka.color};
      --highlight: ${readerTheme.highlight.color};
      --vishraam-main: ${readerTheme.vishraam.main};
      --vishraam-yamki: ${readerTheme.vishraam.yamki};
      --vishraam-main-grad: ${readerTheme.vishraam.mainGradient ?? readerTheme.vishraam.main};
      --vishraam-yamki-grad: ${readerTheme.vishraam.yamkiGradient ?? readerTheme.vishraam.yamki};
      --larivaar-assist: ${readerTheme.typography.larivaarAssistOpacity};
    }
    body {
      background-color: ${backColor};
      word-break: break-word;
      margin-top:${pageTopMargin}px;
    }
    ${backgroundImageCss(readerTheme.background)}
    ${borderCss(readerTheme.border, backColor)}
    ::-webkit-scrollbar {
      width: ${readerTheme.scrollbar.width}px;
      height: ${readerTheme.scrollbar.width}px;
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${readerTheme.scrollbar.thumb};
      border-radius: ${readerTheme.scrollbar.width}px;
    }
    ::-webkit-scrollbar-track {
      background: ${readerTheme.scrollbar.track};
    }
    @font-face {
      font-family: '${constant.GURBANI_AKHAR_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKHAR_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKHAR_TRUE
}');
    }
    @font-face {
      font-family: '${constant.GURBANI_AKHAR_HEAVY_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKHAR_HEAVY_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKHAR_HEAVY_TRUE
}');
    }
    @font-face {
      font-family: '${constant.GURBANI_AKHAR_THICK_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKHAR_THICK_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKHAR_THICK_TRUE
}');
    }
    @font-face {
      font-family: '${constant.ANMOL_LIPI}';
      src: url('${getFontFaceURL(constant.ANMOL_LIPI)}') format('truetype'),local('${
  constant.ANMOL_LIPI
}');
    }
    @font-face {
      font-family: '${constant.PURATAN_HASTLIKHAT}';
      src: url('${getFontFaceURL(constant.PURATAN_HASTLIKHAT)}') format('truetype'),local('${
  constant.PURATAN_HASTLIKHAT
}');
    }
    @font-face {
      font-family: '${constant.BALOO_PAAJI}';
      src: url('${getFontFaceURL(constant.BALOO_PAAJI)}') format('truetype'),local('${
  constant.BALOO_PAAJI
}');
    }
    @font-face {
      font-family: '${constant.BALOO_PAAJI_SEMI_BOLD}';
      src: url('${getFontFaceURL(constant.BALOO_PAAJI_SEMI_BOLD)}') format('truetype'),local('${
  constant.BALOO_PAAJI_SEMI_BOLD
}');
    }

    .gurmukhi {
      padding: 0.2em;
      font-family: '${fontFace}', '${constant.GURBANI_AKHAR_HEAVY_TRUE}', '${
  constant.GURBANI_AKHAR_TRUE
}', '${constant.GURBANI_AKHAR_THICK_TRUE}', '${constant.ANMOL_LIPI}';
    }
    .transliteration, .translation {
      padding: 0.2em;
      font-family: '${constant.BALOO_PAAJI}';
    }
    * {
      -webkit-user-select: none;
    }
    /* Active sync-scroll line, toggled as a class by gutkaScript.js. The scale
       lives ONLY here, derived in CSS from the line's own base size (--fs on
       content-items, inherited size for .pline paragraph spans). Class-based on
       purpose: the old JS read getComputedStyle and wrote absolute px back, and
       under Android's textZoom (computed = specified × system font scale) that
       multiplied the line by the font scale on EVERY highlight/restore cycle —
       lines drifted permanently smaller (scale < 100%) or larger (> 100%).
       !important so the rule beats the baked inline font-size. */
    .content-item.sync-enlarged {
      font-size: calc(var(--fs) * 1.25) !important;
    }
    .pline.sync-enlarged {
      font-size: 125% !important;
    }
    .center{
      text-align:center
    }
    .left{
      text-align:left
    }
    .right{
      text-align:right
    }
  </style>
  <script>${script(readerTheme)}</script>
</head>
<body>
  ${content}
  <script>
    // Must run here, AFTER the content div above is in the DOM — not in the
    // <head> script (gutkaScript.js), which executes before body content
    // exists and would always measure an empty page as "not scrollable".
    // A bani short enough to fit on one screen never fires a scroll event,
    // so scrollFunc's progress report never runs for it; without this such
    // a bani could never register as "read" under the scroll-percentage
    // completion rule. Report 100% once, whenever there's nothing to scroll.
    //
    // The measurement must wait until the Gurmukhi @font-face files have loaded
    // and the text has reflowed to its true height. Measuring synchronously at
    // parse time uses fallback (or zero-height) metrics, so a LONG bani like
    // Sukhmani Sahib momentarily fits on one screen and would falsely report
    // 100% on first open. Defer until fonts + layout settle, then re-measure.
    (function reportInitialScrollProgressIfNotScrollable() {
      function check() {
        var sh = document.documentElement.scrollHeight;
        var ch = window.innerHeight;
        // Exclude the artificial bottom inset (body padding-bottom, set by the
        // RN setBottomInset message to clear the nav/audio chrome) so a bani
        // whose real content fits on one screen still counts as non-scrollable
        // regardless of whether the inset was applied before or after this runs.
        var pb = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
        // Only auto-complete a genuinely rendered, non-scrollable bani. Without the
        // items>0 guard, the empty placeholder page (rendered while the shabad is
        // still loading — scrollHeight == innerHeight, no content) measures as
        // "not scrollable" and falsely reports 100%, auto-marking long banis read.
        var items = document.querySelectorAll(".text-item").length;
        if (items > 0 && sh - ch - pb <= 0) {
          window.ReactNativeWebView.postMessage("scroll-progress-1.0000");
        }
      }
      // What fraction of the bani fits on screen (0-1]. Drives the size of the
      // themed scroll indicator's thumb, so it reads as a real scrollbar: the
      // thumb's length is the ratio of the visible viewport to the total
      // content, which is what tells a reader how long the bani is.
      //
      // Deliberately a SEPARATE function from check() above rather than another
      // line inside it — check() reports 100% completion, and re-running that on
      // every resize could mark a bani read that the user never scrolled.
      // Reported on layout and on resize only (font-size change, translation
      // toggle, rotation); never per scroll event, so scrolling costs nothing.
      function reportViewportRatio() {
        var sh = document.documentElement.scrollHeight;
        var ch = window.innerHeight;
        var pb = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
        var content = Math.max(sh - pb, 1);
        var visible = Math.min(ch / content, 1);
        window.ReactNativeWebView.postMessage("scroll-ratio-" + visible.toFixed(4));
      }
      window.addEventListener("resize", reportViewportRatio);

      function checkAfterLayout() {
        // Two rAFs: let the post-font-load reflow paint before measuring.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            check();
            reportViewportRatio();
          });
        });
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(checkAfterLayout);
      } else if (document.readyState === "complete") {
        checkAfterLayout();
      } else {
        window.addEventListener("load", checkAfterLayout);
      }
    })();
  </script>
</body>
</html>
`;

export default htmlTemplate;
