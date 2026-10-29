import baniItemTitle from "./itemTitle";

// Stored verbatim and read back by every client, so it is the Unicode name
// whatever this device displays.
describe("baniItemTitle", () => {
  it("is the Unicode name when the row has one", () => {
    expect(baniItemTitle({ gurmukhi: "jpujI swihb", gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ" })).toBe(
      "ਜਪੁਜੀ ਸਾਹਿਬ"
    );
  });

  it("converts the ASCII name when it has none, rather than storing ASCII", () => {
    const title = baniItemTitle({ gurmukhi: "jpujI swihb" });
    expect(title).not.toBe("jpujI swihb");
    expect(title).toMatch(/[਀-੿]/);
  });

  it("ignores the transliteration", () => {
    expect(
      baniItemTitle({
        gurmukhi: "jpujI swihb",
        gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ",
        translit: "Japji Sahib",
      })
    ).toBe("ਜਪੁਜੀ ਸਾਹਿਬ");
  });
});
