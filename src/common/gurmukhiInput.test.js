import { appendGurmukhi, canAppend, sanitizeGurmukhi } from "./gurmukhiInput";

// The rules that stop the field accepting things nobody can read. The bug these
// exist for produced "ਅਨੀਾਾਿਿੀੁੁ" — vowel signs stacked on vowel signs with no
// letter under them.

describe("matras need something to attach to", () => {
  it("rejects a matra at the very start", () => {
    expect(canAppend("", "ਾ")).toBe(false);
    expect(canAppend("", "ਿ")).toBe(false);
  });

  it("accepts a matra after a consonant", () => {
    expect(canAppend("ਕ", "ਾ")).toBe(true);
  });

  // Only where the pair spells a vowel letter — see the "vowel letters" suite.
  it("accepts a matra on a carrier only where the two spell a vowel letter", () => {
    expect(canAppend("ਅ", "ਾ")).toBe(true);
    expect(canAppend("ਅ", "ਿ")).toBe(false);
    expect(canAppend("ਆ", "ਾ")).toBe(false);
  });

  it("refuses to stack two matras — the exact defect", () => {
    expect(canAppend("ਕਾ", "ਿ")).toBe(false);
    expect(canAppend("ਨੀ", "ਾ")).toBe(false);
  });

  it("accepts a matra on a nukta-modified consonant", () => {
    expect(canAppend("ਜ਼", "ਾ")).toBe(true);
  });
});

describe("virama, nukta, nasal marks", () => {
  it("allows a virama only after a consonant", () => {
    expect(canAppend("ਕ", "੍")).toBe(true);
    expect(canAppend("", "੍")).toBe(false);
    expect(canAppend("ਕਾ", "੍")).toBe(false);
  });

  it("allows a nukta only on a consonant", () => {
    expect(canAppend("ਜ", "਼")).toBe(true);
    expect(canAppend("ਅ", "਼")).toBe(false);
  });

  it("allows tippi/bindi/addhak on a letter or a completed matra", () => {
    expect(canAppend("ਕ", "ੰ")).toBe(true);
    expect(canAppend("ਕਾ", "ਂ")).toBe(true);
    expect(canAppend("", "ੰ")).toBe(false);
  });

  it("does not double a nasal mark", () => {
    expect(canAppend("ਕੰ", "ੰ")).toBe(false);
  });
});

describe("everything else passes", () => {
  it("allows letters, spaces, digits and Latin", () => {
    ["ਕ", " ", "1", "A", "।"].forEach((ch) => expect(canAppend("ਮੇਰੀ", ch)).toBe(true));
  });
});

describe("appendGurmukhi", () => {
  it("returns the SAME string when the key is rejected", () => {
    const text = "ਕਾ";
    expect(appendGurmukhi(text, "ਿ")).toBe(text);
  });

  it("appends when the key is allowed", () => {
    expect(appendGurmukhi("ਕ", "ਾ")).toBe("ਕਾ");
  });
});

describe("sanitizeGurmukhi", () => {
  it("cleans the monstrosity the old keyboard allowed", () => {
    // Every stacked matra goes; the readable letters survive.
    expect(sanitizeGurmukhi("ਅਨੀਾਾਿਿੀੁੁੁੁੋੋੈੈ")).toBe("ਅਨੀ");
  });

  it("leaves well-formed Punjabi untouched", () => {
    ["ਮੇਰੀ ਪੋਥੀ", "ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ", "ਸੁਖਮਨੀ ਸਾਹਿਬ"].forEach((s) =>
      expect(sanitizeGurmukhi(s)).toBe(s)
    );
  });

  it("leaves Latin and mixed text untouched", () => {
    expect(sanitizeGurmukhi("Morning Nitnem")).toBe("Morning Nitnem");
  });
});

// The Unicode Standard, ch. 12, Table 12-16 "Gurmukhi Vowel Letters": these
// vowels are single code points, and the carrier + matra sequence that looks
// the same must not be used. Fonts draw that sequence with a dotted circle.
describe("vowel letters", () => {
  const TABLE_12_16 = [
    ["ਅ", "ਾ", "ਆ"],
    ["ੲ", "ਿ", "ਇ"],
    ["ੲ", "ੀ", "ਈ"],
    ["ੳ", "ੁ", "ਉ"],
    ["ੳ", "ੂ", "ਊ"],
    ["ੲ", "ੇ", "ਏ"],
    ["ਅ", "ੈ", "ਐ"],
    ["ੳ", "ੋ", "ਓ"],
    ["ਅ", "ੌ", "ਔ"],
  ];

  it.each(TABLE_12_16)("writes %s + %s as the single letter %s", (carrier, matra, letter) => {
    expect(appendGurmukhi(carrier, matra)).toBe(letter);
    expect([...appendGurmukhi(carrier, matra)]).toHaveLength(1);
  });

  it("composes mid-word, on the letter before the matra only", () => {
    expect(appendGurmukhi("ਕਅ", "ਾ")).toBe("ਕਆ");
    expect(appendGurmukhi("ਅਕ", "ਾ")).toBe("ਅਕਾ");
  });

  it("gives a carrier no matra that does not spell a vowel letter", () => {
    expect(appendGurmukhi("ਅ", "ਿ")).toBe("ਅ");
    expect(appendGurmukhi("ੳ", "ਾ")).toBe("ੳ");
  });

  it("repairs the dotted-circle sequences when cleaning text", () => {
    expect(sanitizeGurmukhi("ਅਾਹ ਅੌਕ")).toBe("ਆਹ ਔਕ");
  });
});

// The Unicode Standard, ch. 12, §12.3: addak marks "that the following consonant
// is geminate", and a virama joins its consonant to the next (Table 12-17). In
// HarfBuzz's Indic grammar a matra straight after a virama is a broken cluster.
describe("virama and addak point at the next consonant", () => {
  it("takes a consonant after either", () => {
    expect(appendGurmukhi("ਪ੍", "ਰ")).toBe("ਪ੍ਰ");
    expect(appendGurmukhi("ਪੱ", "ਗ")).toBe("ਪੱਗ");
  });

  it("refuses a matra after a virama — the dotted-circle case", () => {
    expect(canAppend("ਕ੍", "ਾ")).toBe(false);
  });

  it("refuses anything but a consonant after either", () => {
    ["ਾ", "ੰ", "਼", "ਅ", " ", "੧", "।"].forEach((ch) => {
      expect(canAppend("ਕ੍", ch)).toBe(false);
      expect(canAppend("ਪੱ", ch)).toBe(false);
    });
  });

  it("puts addak after a matra, before the doubled consonant", () => {
    expect(["ਕ", "ਿ", "ੱ", "ਤ", "ਾ"].reduce(appendGurmukhi, "")).toBe("ਕਿੱਤਾ");
  });
});

// UnicodeData.txt decomposes each of these letters to consonant + nukta, and the
// bani database spells all six as the single code point.
describe("nukta letters", () => {
  const LETTERS = [
    ["ਲ", "LLA"],
    ["ਸ", "SHA"],
    ["ਖ", "KHHA"],
    ["ਗ", "GHHA"],
    ["ਜ", "ZA"],
    ["ਫ", "FA"],
  ];

  it.each(LETTERS)("writes %s + nukta as its single code point (%s)", (base) => {
    const letter = appendGurmukhi(base, "਼");
    expect([...letter]).toHaveLength(1);
    expect(letter.normalize("NFD")).toBe(`${base}਼`);
  });

  it("matches the database's spelling of ਸ਼ਬਦ ਹਜ਼ਾਰੇ when typed letter by letter", () => {
    const typed = ["ਸ", "਼", "ਬ", "ਦ", " ", "ਹ", "ਜ", "਼", "ਾ", "ਰ", "ੇ"].reduce(
      appendGurmukhi,
      ""
    );
    expect(typed).toBe("\u0A36\u0A2C\u0A26 \u0A39\u0A5B\u0A3E\u0A30\u0A47");
  });

  it("does not add a second nukta to a letter that has one", () => {
    ["\u0A36", "\u0A5B", "\u0A33"].forEach((letter) => expect(canAppend(letter, "਼")).toBe(false));
  });

  it("leaves a nukta with no single code point as consonant + nukta", () => {
    expect(appendGurmukhi("ਕ", "਼")).toBe("ਕ਼");
    expect(canAppend("ਕ਼", "ਾ")).toBe(true);
    expect(canAppend("ਕ਼", "ੰ")).toBe(true);
  });
});

describe("digits and punctuation", () => {
  it("accepts Gurmukhi digits and both dandas after a word", () => {
    ["੧", "੦", "।", "॥"].forEach((ch) => expect(canAppend("ਮਹਲਾ ", ch)).toBe(true));
  });
});
