import punjabiLayout from "simple-keyboard-layouts/build/commonjs/layouts/punjabi";

// The full Gurmukhi character set, laid out the way it is taught.
//
// The InScript layout from `simple-keyboard-layouts` is the right INVENTORY but
// the wrong ARRANGEMENT for this: it is a typist's layout that splits the
// alphabet across two layers, so only about half the letters are on screen and
// the rest hide behind shift. Naming a pothi is not touch-typing — the letters
// need to be visible and findable.
//
// So the characters come from the package (see `gurmukhiKeys.test.js`, which
// fails if any key here is absent from its layers — the inventory is verified,
// not remembered) and are arranged in varnamala order, the order every Punjabi
// speaker learns.

/** The 35 akhar, in the traditional five-per-row varga order. */
export const AKHAR = [
  ["ੳ", "ਅ", "ੲ", "ਸ", "ਹ"],
  ["ਕ", "ਖ", "ਗ", "ਘ", "ਙ"],
  ["ਚ", "ਛ", "ਜ", "ਝ", "ਞ"],
  ["ਟ", "ਠ", "ਡ", "ਢ", "ਣ"],
  ["ਤ", "ਥ", "ਦ", "ਧ", "ਨ"],
  ["ਪ", "ਫ", "ਬ", "ਭ", "ਮ"],
  ["ਯ", "ਰ", "ਲ", "ਵ", "ੜ"],
];

// The six nukta letters (pairin bindi), each as its single code point.
//
// Every one of them can also be written consonant + nukta (U+0A3C) —
// UnicodeData.txt gives each that canonical decomposition. The single code
// point is used because it is how the app's bani database spells all six, and
// search compares text as written: ਜ + ਼ would never find ਸ਼ਬਦ ਹਜ਼ਾਰੇ. It is
// also how the package's InScript layout gives the two it has, ਸ਼ and ਲ਼.
export const NUKTA_LETTERS = [
  "\u0A36", // sha
  "\u0A59", // khha
  "\u0A5A", // ghha
  "\u0A5B", // za
  "\u0A5E", // fa
  "\u0A33", // lla
];

/** Independent vowels — needed to start a word with a vowel sound. */
export const VOWELS = ["ਆ", "ਇ", "ਈ", "ਉ", "ਊ", "ਏ", "ਐ", "ਓ", "ਔ"];

/** Dependent vowel signs, in the order they are recited (kanna, sihari, …). */
export const MATRAS = ["ਾ", "ਿ", "ੀ", "ੁ", "ੂ", "ੇ", "ੈ", "ੋ", "ੌ"];

/** Nasal marks, addhak, halant and nukta. */
export const MARKS = ["ੰ", "ਂ", "ੱ", "੍", "਼"];

/**
 * Danda and double danda. Unicode encodes both once, in the Devanagari block,
 * for every script that uses them (The Unicode Standard, ch. 12, §12.3
 * "Punctuation").
 */
export const PUNCTUATION = ["।", "॥"];

/**
 * Gurmukhi digits U+0A66–U+0A6F, in a phone number row's order, 1 to 0.
 * Bani titles are numbered in them — ਮਹਲਾ ੫, ਪਾਤਿਸ਼ਾਹੀ ੧੦ — so search needs them.
 */
export const DIGITS = ["੧", "੨", "੩", "੪", "੫", "੬", "੭", "੮", "੯", "੦"];

/** Rows of ten, which is what fits a phone at a real tap size. */
const inRowsOfTen = (keys) => {
  const rows = [];
  for (let i = 0; i < keys.length; i += 10) rows.push(keys.slice(i, i + 10));
  return rows;
};

const [TIPPI, DODAIKAR, ADDHAK, HALANT, NUKTA] = MARKS;

/**
 * The keyboard's two pages, the way a phone keyboard splits letters from
 * symbols.
 *
 * Page one is the whole alphabet, every letter visible and findable — the
 * reason the InScript layout was not used — followed by the danda and double
 * danda, which end a line the way a phone's letter page keeps its full stop.
 * Page two is everything that goes WITH a letter, grouped the way it is used:
 * the matras (with tippi, which sits on them), the independent vowels, the
 * nukta letters with the remaining marks, and the digits.
 */
export const KEY_PAGES = [
  inRowsOfTen([...AKHAR.flat(), ...PUNCTUATION]),
  [[...MATRAS, TIPPI], VOWELS, [...NUKTA_LETTERS, DODAIKAR, ADDHAK, HALANT, NUKTA], DIGITS],
];

/** Every row of both pages, in order. */
export const KEY_ROWS = KEY_PAGES.flat();

/** Every key the keyboard offers — used by the test to check the inventory. */
export const ALL_KEYS = KEY_ROWS.flat();

/** Every single character the package's layout contains, across both layers. */
export const packageCharacters = () => {
  const layers = punjabiLayout.default?.layout ?? punjabiLayout.layout ?? {};
  const chars = new Set();
  Object.values(layers).forEach((rows) => {
    rows.forEach((row) => {
      row.split(" ").forEach((key) => {
        // Skip the control tokens and the multi-character conjunct keys.
        if (!key || key.startsWith("{")) return;
        [...key].forEach((ch) => chars.add(ch));
      });
    });
  });
  return chars;
};

export default KEY_ROWS;
