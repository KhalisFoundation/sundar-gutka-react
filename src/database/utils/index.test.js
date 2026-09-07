import constant from "@common/constant";
import { createFormattedText, getWordStyle } from "./index";

const positions = { 0: "y", 3: "v" };
const options = { isVishraam: true, vishraamOption: constant.VISHRAAM_COLORED };

test("both pause lengths use theme variables for Unicode and legacy text", () => {
  ["ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ", "socY soic n hoveI"].forEach((line) => {
    const html = createFormattedText(line.split(" "), positions, options);
    expect(html).toContain("var(--reader-vishraamShort)");
    expect(html).toContain("var(--reader-vishraamLong)");
    expect(html).not.toMatch(/#[a-f0-9]{6}/i);
  });
});

test("gradient output has a complete stop and uses the selected theme hue", () => {
  const style = getWordStyle("word", 3, positions, {
    ...options,
    vishraamOption: constant.VISHRAAM_GRADIENT,
  });
  expect(style).toContain("var(--reader-vishraamLongGradient) 100%)");
});

test("disabling vishraams keeps text unchanged; larivaar assist preserves pauses", () => {
  expect(createFormattedText(["one", "two"], positions, { ...options, isVishraam: false })).toBe(
    "one two"
  );
  const assist = { ...options, isLarivar: true, isLarivarAssist: true };
  const html = createFormattedText(["one", "two", "three", "four"], positions, assist);
  expect(html).toContain("&#8203;");
  expect(getWordStyle("two", 1, positions, assist)).toContain("var(--reader-larivaar, inherit)");
  expect(getWordStyle("four", 3, positions, assist)).not.toContain("color: var(--reader-larivaar,");
  expect(getWordStyle("four", 3, positions, { ...assist, vishraamOption: "unknown" })).toContain(
    "var(--reader-vishraamLong);"
  );
});
