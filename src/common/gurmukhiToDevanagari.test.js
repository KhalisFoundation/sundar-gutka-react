/* eslint-env jest */
import { gurmukhiToDevanagari as g } from "./gurmukhiToDevanagari";

describe("gurmukhiToDevanagari", () => {
  it("converts the word-of-day sample and curated fallback words", () => {
    expect(g("ਸੰਤ")).toBe("संत"); // Sant — the tippi → anusvara case
    expect(g("ਸੂਰਮਾ")).toBe("सूरमा"); // Soorma
    expect(g("ਦੀਪਕ")).toBe("दीपक"); // Deepak
    expect(g("ਚਿੰਤਾ")).toBe("चिंता"); // Chinta
    expect(g("ਧਨੁ")).toBe("धनु"); // Dhan
  });

  it("handles halant consonant clusters", () => {
    expect(g("ਕ੍ਰਿਪਾਨ")).toBe("क्रिपान"); // Kirpaan (virama cluster)
    expect(g("ਚਾਤ੍ਰਿਕ")).toBe("चात्रिक"); // Chatrik
  });

  it("maps addak to gemination (halant-doubled consonant)", () => {
    expect(g("ਪੱਕਾ")).toBe("पक्का"); // pakka
  });

  it("maps the ਸ਼ nukta to श", () => {
    expect(g("ਸ਼ਬਦ")).toBe("शबद"); // shabad
  });

  it("passes spaces/punctuation and non-Gurmukhi through unchanged", () => {
    expect(g("ਸੰਤ ਜੀ")).toBe("संत जी");
    expect(g("Sant")).toBe("Sant");
    expect(g("")).toBe("");
    expect(g(null)).toBe("");
  });
});
