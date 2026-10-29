import {
  AKHAR,
  ALL_KEYS,
  DIGITS,
  KEY_PAGES,
  KEY_ROWS,
  MATRAS,
  NUKTA_LETTERS,
  packageCharacters,
  PUNCTUATION,
} from "./gurmukhiKeys";

// The keyboard shows the whole alphabet. The InScript layout the package ships
// is a typist's layout that hides half the letters behind shift, so only about
// twenty were on screen — this is the arrangement that fixes that, and these
// check the inventory is complete and not invented.

describe("the alphabet is complete", () => {
  it("has all 35 akhar, five to a varga", () => {
    expect(AKHAR).toHaveLength(7);
    AKHAR.forEach((row) => expect(row).toHaveLength(5));
    expect(AKHAR.flat()).toHaveLength(35);
  });

  it("starts with Ura, Aira, Iri and ends the vargas at Rara", () => {
    expect(AKHAR[0].slice(0, 3)).toEqual(["ੳ", "ਅ", "ੲ"]);
    expect(AKHAR[6][4]).toBe("ੜ");
  });

  it("adds the six nukta letters, each as the one code point the bani database uses", () => {
    expect(NUKTA_LETTERS).toEqual(["\u0A36", "\u0A59", "\u0A5A", "\u0A5B", "\u0A5E", "\u0A33"]);
    NUKTA_LETTERS.forEach((letter) => expect([...letter]).toHaveLength(1));
  });

  it("offers all nine matras", () => {
    expect(MATRAS).toHaveLength(9);
  });

  it("shows far more than the twenty-odd InScript put on its first layer", () => {
    expect(ALL_KEYS.length).toBeGreaterThan(60);
  });

  it("repeats no character", () => {
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length);
  });

  it("offers the ten Gurmukhi digits, 1 to 0 as on a number row", () => {
    expect(DIGITS).toEqual([..."\u0A67\u0A68\u0A69\u0A6A\u0A6B\u0A6C\u0A6D\u0A6E\u0A6F\u0A66"]);
    DIGITS.forEach((digit) => expect(ALL_KEYS).toContain(digit));
  });

  it("offers the danda and the double danda, with the letters", () => {
    expect(PUNCTUATION).toEqual(["\u0964", "\u0965"]);
    PUNCTUATION.forEach((mark) => expect(KEY_PAGES[0].flat()).toContain(mark));
  });
});

describe("the inventory comes from the package, not from memory", () => {
  it("every key exists somewhere in simple-keyboard-layouts' Punjabi layout", () => {
    // The arrangement is ours; the CHARACTERS are the package's. Anything here
    // that the package does not contain would be a character invented from
    // recall, which is how a wrong glyph would reach a user.
    // Per CODEPOINT: a key can be two (base + nukta), and both halves have to
    // be characters the package actually contains.
    const known = packageCharacters();
    // The justified additions, each named:
    // - Ura (U+0A73), one of the 35 akhar. The InScript layout carries Aira
    //   (U+0A72) and the independent vowel Oora-with-aunkar (U+0A09) but not the
    //   bare carrier, and an alphabet cannot be missing its first letter.
    // - The Gurmukhi digits U+0A66–U+0A6F. InScript's number row is 1–0 in
    //   European digits; bani titles are numbered in Gurmukhi ones.
    // - Double danda (U+0965), the verse end of Gurbani. InScript has the danda
    //   only.
    const EXCEPTIONS = new Set(["\u0A73", ...DIGITS, "\u0965"]);
    // A nukta letter the package lacks is still no invention if its canonical
    // decomposition is made of characters the package has.
    const fromKnownParts = (ch) => {
      const parts = [...ch.normalize("NFD")];
      return parts.length > 1 && parts.every((part) => known.has(part));
    };
    const invented = ALL_KEYS.filter((key) =>
      [...key].some((ch) => !known.has(ch) && !EXCEPTIONS.has(ch) && !fromKnownParts(ch))
    );
    expect(invented).toEqual([]);
  });
});

describe("rows fit a phone", () => {
  it("is at most ten keys wide", () => {
    // Twelve was the InScript row width, and at that count the keys came out
    // ~25pt wide and unhittable.
    KEY_ROWS.forEach((row) => expect(row.length).toBeLessThanOrEqual(10));
  });

  it("loses nothing in the split into rows", () => {
    expect(KEY_ROWS.flat()).toEqual(ALL_KEYS);
  });

  it("gives both pages the same number of rows", () => {
    expect(KEY_PAGES[1]).toHaveLength(KEY_PAGES[0].length);
  });
});
