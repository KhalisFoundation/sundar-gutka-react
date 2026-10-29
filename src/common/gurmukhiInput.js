// Gurmukhi input rules.
//
// The layout comes from `simple-keyboard-layouts` (MIT) — the standard InScript
// Punjabi arrangement, the same one Android and iOS use, so anyone who already
// types Punjabi recognises it. That package ships DATA only; its renderer is
// DOM-based, so the keys are drawn by our own component.
//
// A layout alone is not enough. Nothing in it stops a dependent sign being typed
// where there is no letter to attach to, which is how "ਅਨੀਾਾਿਿੀੁੁ" happened —
// vowel signs stacked on vowel signs with no base. These are the rules that make
// the field only accept writable Punjabi.
//
// Every rule below is taken from a published source, not from recall:
// - The Unicode Standard 15.0, ch. 12, §12.3 "Gurmukhi"
//   (https://www.unicode.org/versions/Unicode15.0.0/ch12.pdf), cited by table
//   or paragraph name.
// - The Unicode Character Database: the character classes match
//   IndicSyllabicCategory.txt, the nukta letters' decompositions UnicodeData.txt.
// - HarfBuzz, the shaper Android uses to draw Indic text: its syllable grammar
//   (src/hb-ot-shaper-indic-machine.rl) decides which sequences it draws with a
//   dotted circle, i.e. as broken text.
//
// Ranges are from the Unicode Gurmukhi block (U+0A00–U+0A7F).

/** Consonants, including the nukta-composed set (ਲ਼ ਸ਼ ਖ਼ ਗ਼ ਜ਼ ੜ ਫ਼). */
const CONSONANT = /[ਕ-ਹਖ਼-ਫ਼]/;
/** Independent vowels and Ura/Aira/Iri, which can start a syllable. */
const VOWEL_LETTER = /[ਅ-ਔੲੳ]/;
/** Dependent vowel signs (matras) — must attach to something. */
const MATRA = /[ਾ-ੌ]/;
/** Halant/virama — joins two consonants. */
const VIRAMA = "੍";
/** Addak — doubles the consonant AFTER it. */
const ADDAK = "ੱ";
/** Bindi, tippi, addhak: nasal and gemination marks. */
const NASAL_OR_ADDHAK = /[ਁਂੰੱ]/;
/** Nukta — modifies the consonant before it. */
const NUKTA = "਼";
/** The consonants whose single code point already includes a nukta. */
const NUKTA_LETTER = /[\u0A33\u0A36\u0A59-\u0A5B\u0A5E]/;

const isBase = (ch) => Boolean(ch) && (CONSONANT.test(ch) || VOWEL_LETTER.test(ch));

/**
 * A consonant and a nukta that together are one of the additional consonants.
 *
 * UnicodeData.txt gives each of these letters exactly this decomposition, so
 * both spellings are canonically the same letter. The app's bani database
 * writes every one of them as the single code point, and search compares text
 * as written — so ਜ then ਼ becomes one letter, or typing it could
 * never find ਸ਼ਬਦ ਹਜ਼ਾਰੇ. Not String.prototype.normalize: NFC
 * deliberately leaves these decomposed (CompositionExclusions.txt).
 */
const NUKTA_LETTERS = {
  "\u0A32\u0A3C": "\u0A33", // lalla + nukta
  "\u0A38\u0A3C": "\u0A36", // sassa + nukta
  "\u0A16\u0A3C": "\u0A59", // khakha + nukta
  "\u0A17\u0A3C": "\u0A5A", // gagga + nukta
  "\u0A1C\u0A3C": "\u0A5B", // jajja + nukta
  "\u0A2B\u0A3C": "\u0A5E", // phapha + nukta
};

/**
 * A carrier letter and a matra that together ARE a vowel letter.
 *
 * Unicode encodes these vowels atomically and says the two-part sequence must
 * not be used — The Unicode Standard, ch. 12, Table 12-16 "Gurmukhi Vowel
 * Letters". Typed as ਅ then ਾ, the text held <ਅ, ਾ>, which fonts draw with a
 * dotted circle because it is not writable Punjabi. So the pair becomes the
 * letter it spells, which is also what a phone's own Punjabi keyboard does.
 */
const VOWEL_LETTERS = {
  "\u0A05\u0A3E": "\u0A06", // ਅ + ਾ = ਆ
  "\u0A72\u0A3F": "\u0A07", // ੲ + ਿ = ਇ
  "\u0A72\u0A40": "\u0A08", // ੲ + ੀ = ਈ
  "\u0A73\u0A41": "\u0A09", // ੳ + ੁ = ਉ
  "\u0A73\u0A42": "\u0A0A", // ੳ + ੂ = ਊ
  "\u0A72\u0A47": "\u0A0F", // ੲ + ੇ = ਏ
  "\u0A05\u0A48": "\u0A10", // ਅ + ੈ = ਐ
  "\u0A73\u0A4B": "\u0A13", // ੳ + ੋ = ਓ
  "\u0A05\u0A4C": "\u0A14", // ਅ + ੌ = ਔ
};

/**
 * Whether `next` may follow `text`.
 *
 * Independent letters, digits, spaces and punctuation are always allowed; the
 * rules only constrain the marks that have no meaning on their own.
 *
 * @param {string} text  what is already typed
 * @param {string} next  the single character being added
 * @returns {boolean}
 */
export const canAppend = (text, next) => {
  const prev = text.slice(-1);
  const beforePrev = text.slice(-2, -1);
  // A consonant, or one written as consonant + nukta (ਕ਼ has no single code point).
  const onConsonant = CONSONANT.test(prev) || (prev === NUKTA && CONSONANT.test(beforePrev));

  // Virama and addak both point FORWARD, so only a consonant may follow them.
  // Virama joins its consonant to the next one — ਪ੍ਰ, and the pairin ਹ ਵ ਰ and
  // addha ਯ of Table 12-17 "Gurmukhi Conjuncts"; in HarfBuzz's grammar a matra
  // after a virama is a broken cluster. Addak "is a special sign to indicate
  // that the following consonant is geminate" (§12.3), as in <ਪ, ੱ, ਗ> ਪੱਗ.
  if (prev === VIRAMA || prev === ADDAK) return CONSONANT.test(next);

  // A matra needs a consonant, or a consonant already carrying a nukta. One
  // matra per letter: a second, or one after a nasal mark, draws a dotted circle.
  if (MATRA.test(next)) {
    // A vowel letter takes no matra — except the few pairs that spell another
    // vowel letter, which appendGurmukhi turns into that letter.
    if (VOWEL_LETTER.test(prev)) return Boolean(VOWEL_LETTERS[prev + next]);
    return onConsonant;
  }

  // Virama joins consonants; it is meaningless after a vowel sign or nothing.
  if (next === VIRAMA) return onConsonant;

  // Nukta modifies the consonant immediately before it, and never doubles —
  // including on a letter whose code point already includes one.
  if (next === NUKTA) return CONSONANT.test(prev) && !NUKTA_LETTER.test(prev);

  // A nasal mark or addak attaches to a letter or a completed matra, and does
  // not repeat. Which of bindi and tippi is not enforced: §12.3 gives the
  // present practice (bindi with ਾ ੀ ੇ ੈ ੋ ੌ and ਆ ਈ ਏ ਐ ਓ ਔ ਉ ਊ, tippi elsewhere)
  // but says "Older texts may depart from this requirement" — and Gurbani does.
  if (NASAL_OR_ADDHAK.test(next)) {
    if (NASAL_OR_ADDHAK.test(prev)) return false;
    return onConsonant || isBase(prev) || MATRA.test(prev);
  }

  return true;
};

/** Every pair that is written as one code point — see the two tables above. */
const COMPOSED = { ...VOWEL_LETTERS, ...NUKTA_LETTERS };

/**
 * Appends `next` if the rules allow it, otherwise returns `text` unchanged.
 * The caller can compare identity to know whether the key was rejected.
 *
 * A matra that completes a vowel letter, or a nukta that completes one of the
 * additional consonants, replaces the letter before it rather than being
 * appended — see VOWEL_LETTERS and NUKTA_LETTERS.
 */
export const appendGurmukhi = (text, next) => {
  if (!canAppend(text, next)) return text;
  const letter = COMPOSED[text.slice(-1) + next];
  return letter ? text.slice(0, -1) + letter : text + next;
};

/** Strips any character that could not legally have been typed, left to right. */
export const sanitizeGurmukhi = (text) =>
  [...String(text ?? "")].reduce((acc, ch) => appendGurmukhi(acc, ch), "");

export default appendGurmukhi;
