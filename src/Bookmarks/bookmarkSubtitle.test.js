// The bookmark subtitle is the tuk line, or nothing.
//
// It renders in the user's bani font, so the old fallback chain produced two
// kinds of nonsense on banis that carry no tuk for a bookmark: under Baloo it
// fell through to the ASCII `tukGurmukhi`, which that font cannot draw (Mool
// Mantar showed a garbled "mool ma(n)tar" under a good Gurmukhi title), and
// failing that to `translit`, the Roman name, so Tav Prasad Sawaiye repeated
// "Pauree 1" under "ਪਉੜੀ ੧".

const BALOO = "BalooPaaji2-Regular";

/** Mirrors the resolution in Bookmarks/index.jsx. */
const subtitleFor = (item, fontFace) => {
  const isBaloo = fontFace === BALOO;
  return isBaloo ? item.tukGurmukhiUni || "" : item.tukGurmukhi || "";
};

describe("bookmark subtitle", () => {
  it("shows the Unicode tuk under Baloo", () => {
    expect(subtitleFor({ tukGurmukhiUni: "ਸਤਿ ਨਾਮੁ", tukGurmukhi: "siq nwmu" }, BALOO)).toBe(
      "ਸਤਿ ਨਾਮੁ"
    );
  });

  it("shows the ASCII tuk under the Gurbani face, which can draw it", () => {
    expect(
      subtitleFor({ tukGurmukhiUni: "ਸਤਿ ਨਾਮੁ", tukGurmukhi: "siq nwmu" }, "GurbaniAkharTrue")
    ).toBe("siq nwmu");
  });

  it("never falls back to ASCII under Baloo, which cannot render it", () => {
    // Mool Mantar's first bookmark.
    expect(subtitleFor({ tukGurmukhiUni: "", tukGurmukhi: "mool ma(n)qr" }, BALOO)).toBe("");
  });

  it("never falls back to the Roman transliteration", () => {
    // Tav Prasad Sawaiye — the title already says it in Gurmukhi.
    expect(subtitleFor({ translit: "Pauree 1" }, BALOO)).toBe("");
    expect(subtitleFor({ translit: "Pauree 1" }, "GurbaniAkharTrue")).toBe("");
  });

  it("renders no second line at all when empty", () => {
    // BaniList guards on truthiness, so "" means the row has one line.
    expect(Boolean(subtitleFor({}, BALOO))).toBe(false);
  });
});
