import constant from "@common/constant";
import { baseFontSize, logError, logMessage } from "@common";
import htmlTemplate from "./gutkahtml";
import script from "./gutkaScript";

// Everything below is fixed for the life of the module and used once per DIV —
// a long bani emits thousands of them, and these were all being rebuilt inside
// that loop. Nothing here changes what is emitted; it is the same values,
// computed once instead of per line.
//
// `constant` is imported from its own module rather than the @common barrel for
// exactly this reason: the barrel reaches back to this file, so at module-scope
// time its `constant` is still undefined and reading it here would throw while
// the app was still starting up — see moduleLoad.test.js.
const GURMUKHI_LC = constant.GURMUKHI.toLowerCase();
const TRANSLITERATION_LC = constant.TRANSLITERATION.toLowerCase();
const TRANSLATION_LC = constant.TRANSLATION.toLowerCase();
// The reverse of the `.toUpperCase()` each div used to do on its own type.
const TYPE_TO_ROLE = {
  [GURMUKHI_LC]: constant.GURMUKHI,
  [TRANSLITERATION_LC]: constant.TRANSLITERATION,
  [TRANSLATION_LC]: constant.TRANSLATION,
};
// Header 1 is the only Gurmukhi level with a colour of its own. Kept as a
// lookup rather than `header === 1` so a header arriving as a string keys
// exactly as it did when this was an object literal built per call.
const GURMUKHI_HEADING_LEVELS = { 1: true };
const TEXT_ALIGN_BY_HEADER = { 0: "left", 1: "center", 2: "center" };

// The Gurmukhi fallback chain, built once, matching the one the stylesheet
// gives `.gurmukhi`.
//
// It has to be repeated here because the inline font-family below OVERRIDES
// that rule, so the chain never applied to the line it was written for: a
// character the chosen font lacks fell through to the WebView's own default
// instead of to another Gurmukhi face. That went unnoticed while every
// choosable font covered the whole of the bundled text. Puratan Hathlikhat
// does not — it has no glyph for the ❁ ornament that separates some sections,
// which a system font draws as a low quote.
const GURMUKHI_FALLBACKS = [
  constant.GURBANI_AKHAR_HEAVY_TRUE,
  constant.GURBANI_AKHAR_TRUE,
  constant.GURBANI_AKHAR_THICK_TRUE,
  constant.ANMOL_LIPI,
]
  .map((face) => `'${face}'`)
  .join(", ");

/**
 * The inline font-family for one div.
 *
 * Only a Gurmukhi div is given a face (the caller passes one); transliteration
 * and translation pass none and are left EXACTLY as they were, chain included,
 * so this change cannot move a line it was not meant to touch.
 */
const fontFamilyFor = (fontFace) =>
  fontFace ? `${fontFace}, ${GURMUKHI_FALLBACKS}` : `${fontFace}`;

// `readerTheme` is a resolved READING-theme record (src/theme/reader), not the
// app theme. The light and dark records are derived from the app's own palette,
// so "Follow app theme" resolves to exactly the roles this used to read
// directly — `c.textBrand` for headings and transliteration, `c.textPrimary`
// for everything else.
export const fontColorForReader = (header, readerTheme, text) => {
  const { GURMUKHI, TRANSLATION, TRANSLITERATION } = constant;

  // Header level 1 uses the theme's heading colour. Everything else uses its
  // body Gurbani colour; header 2/6 are deliberately regular (not the heading
  // colour), and so is any other level.
  //
  // This used to build two objects and two closures on every call, for a value
  // that is one of three colours. Branching instead allocates nothing, and each
  // branch keeps the `|| defaultColor` the map lookup ended with — so a theme
  // that leaves a slot empty still falls back exactly as it did.
  const defaultColor = readerTheme.text.gurbani.color;

  if (text === GURMUKHI) {
    if (GURMUKHI_HEADING_LEVELS[header]) {
      return readerTheme.text.gurbaniHeading.color || defaultColor;
    }
    return defaultColor;
  }
  // Their own slots, so a theme can separate translation from body Gurbani.
  if (text === TRANSLITERATION) return readerTheme.text.transliteration.color || defaultColor;
  if (text === TRANSLATION) return readerTheme.text.translation.color || defaultColor;
  return defaultColor;
};

// `themeFontScale` is a MULTIPLIER on the user's font-size setting, never an
// override — a reading theme can offer its own comfortable reading size without
// taking the user's accessibility control away from them.
export const fontSizeForReader = (
  fontSizeString,
  headerLevel,
  hasTransliteration,
  themeFontScale = 1
) => {
  const SCALE_FACTOR = 0.9;
  const fontSize =
    baseFontSize(fontSizeString, hasTransliteration) * SCALE_FACTOR * (themeFontScale || 1);
  switch (headerLevel) {
    case 6:
      return fontSize * 0.75;
    case 2:
      return fontSize * 1.1;
    case 1:
      return fontSize * 1.2;
    default:
      return fontSize;
  }
};

// ── Puratan Hathlikhat headroom ─────────────────────────────────────────────
//
// This face draws a few glyphs far taller than it declares, so a line holding
// one overlaps the line above it. Measured from the shipped file,
// android/app/src/main/assets/fonts/Puratan_Hastlikhat.ttf:
//
//   760 upem, hhea ascent 1369 / descent -455, USE_TYPO_METRICS off
//   -> the face asks for a 2.400em line box
//
// Puratan's theme pins `lineHeightRatio: 1.72`, which leaves 1111 units above
// the baseline. Seven mapped characters rise past that — and the worst of them
// is the one that matters, the Ik Onkar:
//
//   >  Â  ∆   yMax 2217   2.92em above the baseline
//   å         yMax 2199
//   O         yMax 1346
//   9         yMax 1333
//   E         yMax 1154
//
// (The text is the legacy ASCII encoding these faces are drawn for, not
// Unicode, so those are the codes a bani actually contains.)
//
// Ik Onkar needs a 4.63 line-height to clear, which is well past even the
// face's own 2.400 box — `line-height: normal` would still overlap. And raising
// the line-height of the div it starts would space out every wrapped line
// inside it, which is not what is wrong.
//
// So the shortfall is added as padding ABOVE the div instead: only the gap that
// is missing, only on a line that has a glyph needing it, and only for this
// face. A div with none of these characters is emitted exactly as before.
const PURATAN_UPEM = 760;
const PURATAN_ASCENT = 1369;
const PURATAN_DESCENT = 455;
/** The line box this face asks for, used when a theme pins no ratio. */
const PURATAN_NATURAL_RATIO = (PURATAN_ASCENT + PURATAN_DESCENT) / PURATAN_UPEM;
/** yMax of every glyph that rises above the ascent the face declares. */
const PURATAN_TALL = { ">": 2217, Â: 2217, "∆": 2217, å: 2199, O: 1346, 9: 1333, E: 1154 };
// One pass in native code rather than a char-by-char loop: a long bani emits
// thousands of divs and almost none of them contain any of these.
const PURATAN_TALL_RE = /[>Â∆åO9E]/g;

/**
 * The padding, in em, a Puratan line needs so its tallest glyph clears the line
 * above. Zero when nothing in it rises past the baseline room it already has.
 */
export const puratanHeadroom = (content, lineHeightRatio) => {
  let tallest = 0;
  // `lastIndex` is reset because the regex is global and shared.
  PURATAN_TALL_RE.lastIndex = 0;
  let hit = PURATAN_TALL_RE.exec(content);
  while (hit !== null) {
    const y = PURATAN_TALL[hit[0]];
    if (y > tallest) tallest = y;
    hit = PURATAN_TALL_RE.exec(content);
  }
  if (!tallest) return 0;
  const ratio = lineHeightRatio || PURATAN_NATURAL_RATIO;
  // Leading is split evenly above and below, so this is the room above the
  // baseline the line already has.
  const above = PURATAN_ASCENT + (ratio * PURATAN_UPEM - (PURATAN_ASCENT + PURATAN_DESCENT)) / 2;
  const shortfall = tallest - above;
  return shortfall > 0 ? shortfall / PURATAN_UPEM : 0;
};

export const createDiv = (
  content,
  header,
  type,
  textAlign,
  fontSize,
  readerTheme,
  isLarivaar,
  punjabiTranslation = "",
  fontFace = null
) => {
  const fontClass = type === GURMUKHI_LC || punjabiTranslation !== "" ? GURMUKHI_LC : type;
  // Optional per-theme text treatment. Emitted ONLY when the theme sets it, so
  // the light/dark records — which set none of it — produce byte-identical
  // markup to the Reader's original. The shadow applies to Gurmukhi alone; on a
  // translation line it would just blur the reading.
  const { lineHeightRatio, letterSpacing } = readerTheme.typography;
  const gurbaniSlot = header === 1 ? readerTheme.text.gurbaniHeading : readerTheme.text.gurbani;
  const shadow = type === GURMUKHI_LC ? gurbaniSlot.shadow : null;
  // Concatenated rather than built as an array and joined: same string, one
  // fewer array per div, and a long bani emits thousands of them.
  let extraStyle = "";
  if (lineHeightRatio) extraStyle += `line-height: ${lineHeightRatio};`;
  if (letterSpacing) extraStyle += `letter-spacing: ${letterSpacing}px;`;
  // Only this face, and only a line whose glyphs actually overflow.
  if (fontFace === constant.PURATAN_HASTLIKHAT) {
    const headroom = puratanHeadroom(content, lineHeightRatio);
    if (headroom) extraStyle += `padding-top: ${headroom.toFixed(3)}em;`;
  }
  if (shadow) extraStyle += `text-shadow: ${shadow};`;
  // data-type carries the semantic role: the Punjabi translation div shares the
  // gurmukhi CSS CLASS (for its font), so class alone can't identify the main
  // Gurmukhi line — the sync-scroll enlargement targets [data-type="gurmukhi"].
  // The size is baked as the --fs custom property (font-size: var(--fs)) so the
  // .sync-enlarged CSS rule can derive the enlarged size as calc(var(--fs) * scale)
  // without any JS px bookkeeping.
  return `
    <div class="content-item ${fontClass} ${textAlign}" data-type="${type}" style="--fs: ${fontSizeForReader(
    fontSize,
    header,
    type === TRANSLITERATION_LC || type === TRANSLATION_LC,
    readerTheme.typography.fontScale
  )}px; font-size: var(--fs); font-family: ${fontFamilyFor(fontFace)}; color: ${fontColorForReader(
    header,
    readerTheme,
    // The role this type maps to. `type.toUpperCase()` built a throwaway string
    // per div for one of three known constants.
    TYPE_TO_ROLE[type] || type.toUpperCase()
  )};${extraStyle}">
      ${content}
    </div>
  `;
};

export const loadHTML = (
  shabad,
  isTransliteration,
  fontSize,
  fontFace,
  isEnglishTranslation,
  isPunjabiTranslation,
  isSpanishTranslation,
  readerTheme,
  isLarivaar,
  pageTopMargin
) => {
  try {
    // The reading theme's ground. Its light/dark records take this from
    // `c.backgroundAlt`, the same role the Reader header and every other screen
    // use — so following the app keeps the page, its chrome and the rest of the
    // app in agreement, exactly as before.
    const backColor = readerTheme.background.color;
    const content = shabad
      .map((item) => {
        let textAlign = TEXT_ALIGN_BY_HEADER[item.header];
        if (textAlign === undefined) {
          textAlign = "right";
        }
        // Use pipe delimiters for easy CSS selector matching
        const paragraphId = item.sequences ? item.sequences[0] : item.sequence;
        const sequencesData = item.sequences
          ? ` data-sequences='|${item.sequences.join("|")}|'`
          : "";
        const sequenceData = ` data-sequence='${paragraphId}'`;
        let contentHtml = `<div id="${item.id}" class='text-item'${sequenceData}${sequencesData}>`;
        contentHtml += createDiv(
          fontFace === constant.BALOO_PAAJI ? item.gurmukhiUni : item.gurmukhi,
          item.header,
          GURMUKHI_LC,
          textAlign,
          fontSize,
          readerTheme,
          isLarivaar,
          "",
          fontFace
        );

        if (isTransliteration) {
          contentHtml += createDiv(
            item.translit,
            item.header,
            TRANSLITERATION_LC,
            textAlign,
            fontSize,
            readerTheme,
            isLarivaar
          );
        }

        if (isEnglishTranslation) {
          contentHtml += createDiv(
            item.englishTranslations,
            item.header,
            TRANSLATION_LC,
            textAlign,
            fontSize,
            readerTheme,
            isLarivaar
          );
        }

        if (isPunjabiTranslation) {
          contentHtml += createDiv(
            item.punjabiTranslations,
            item.header,
            TRANSLATION_LC,
            textAlign,
            fontSize,
            readerTheme,
            isLarivaar,
            GURMUKHI_LC,
            constant.GURBANI_AKHAR_TRUE
          );
        }

        if (isSpanishTranslation) {
          contentHtml += createDiv(
            item.spanishTranslations,
            item.header,
            TRANSLATION_LC,
            textAlign,
            fontSize,
            readerTheme,
            isLarivaar
          );
        }

        contentHtml += `</div>`;
        return contentHtml;
      })
      .join("");
    const htmlContent = htmlTemplate(backColor, fontFace, content, readerTheme, pageTopMargin);
    return htmlContent;
  } catch (error) {
    logError(error);
    logMessage("loadHTML: Failed to load HTML");
    throw new Error(error);
  }
};
export { script, htmlTemplate };
