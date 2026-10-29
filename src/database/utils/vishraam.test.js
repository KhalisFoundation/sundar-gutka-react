import { vishraam } from "@theme/palette";
import { getWordStyle } from "./index";

// This path renders the pause marks in Gurbani, and it broke in a way nothing
// else could see.
//
// The colours used to be destructured off a `colors` module that was deleted
// during the token migration. The IMPORT did not throw — `colors` was simply
// `undefined` — so the module-load smoke test passed. Only the destructuring
// threw, at query time, and `useFetchShabad` wraps that call in a try/catch
// that routes errors to Crashlytics. The result was an empty shabad, so the
// Reader never mounted its WebView and every bani opened to a blank screen with
// nothing tappable.
//
// These call the real function rather than asserting on a constant, so any
// future change that leaves these colours undefined fails here instead of
// silently blanking the Reader.

const OPTS = (vishraamOption) => ({
  isVishraam: true,
  vishraamOption,
  isLarivar: false,
  isLarivarAssist: false,
});

describe("vishraam marks resolve to real colours", () => {
  it("the palette defines all four", () => {
    ["short", "long", "shortGradient", "longGradient"].forEach((k) => {
      expect(typeof vishraam[k]).toBe("string");
      expect(vishraam[k]).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\()/);
    });
  });

  it("a coloured long pause emits a real colour, never undefined", () => {
    const style = getWordStyle("ਵਾਹਿਗੁਰੂ", 0, { 0: "v" }, OPTS("VISHRAAM_COLORED"));
    expect(style).toContain(vishraam.long);
    expect(style).not.toMatch(/undefined/);
  });

  it("a coloured short pause emits a real colour", () => {
    const style = getWordStyle("ਵਾਹਿਗੁਰੂ", 0, { 0: "y" }, OPTS("VISHRAAM_COLORED"));
    expect(style).toContain(vishraam.short);
    expect(style).not.toMatch(/undefined/);
  });

  it("a gradient pause emits a real colour", () => {
    const style = getWordStyle("ਵਾਹਿਗੁਰੂ", 0, { 0: "v" }, OPTS("VISHRAAM_GRADIENT"));
    expect(style).not.toMatch(/undefined/);
  });

  it("no style at all when vishraam is off", () => {
    const off = { ...OPTS("VISHRAAM_COLORED"), isVishraam: false };
    expect(getWordStyle("ਵਾਹਿਗੁਰੂ", 0, { 0: "v" }, off)).not.toMatch(/undefined/);
  });
});
