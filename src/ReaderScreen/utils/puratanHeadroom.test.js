import { puratanHeadroom } from "./index";

// Puratan Hathlikhat draws a handful of glyphs far taller than the ascent it
// declares, so a line holding one runs into the line above it. Measured from
// the shipped file: 760 upem, hhea 1369/-455, and the Ik Onkar's yMax is 2217 —
// 2.92em above the baseline, past even the face's own 2.400em box.
//
// The fix is headroom above that one div, so these tests hold to the two things
// that make it safe: it is computed from what the line actually contains, and
// it is nothing at all for a line that contains none of those glyphs.

const RATIO = 1.72; // what the Puratan theme pins

describe("puratanHeadroom", () => {
  it("asks for nothing on an ordinary line", () => {
    expect(puratanHeadroom("hir jI AwpxI", RATIO)).toBe(0);
  });

  it("asks for nothing when the line is empty", () => {
    expect(puratanHeadroom("", RATIO)).toBe(0);
  });

  // 2217 yMax against 1110.4 units of room = 1106.6 units = 1.456em.
  it("clears the Ik Onkar, which overflows by nearly one and a half em", () => {
    expect(puratanHeadroom("<> siq nwmu", RATIO)).toBeCloseTo(1.456, 3);
  });

  it("treats every encoding of the Ik Onkar the same", () => {
    const expected = puratanHeadroom(">", RATIO);
    expect(puratanHeadroom("Â", RATIO)).toBe(expected);
    expect(puratanHeadroom("∆", RATIO)).toBe(expected);
  });

  // A line with two overflowing glyphs needs the room the TALLER one wants,
  // not the first one found.
  it("measures the tallest glyph on the line, wherever it sits", () => {
    expect(puratanHeadroom("O rest >", RATIO)).toBe(puratanHeadroom(">", RATIO));
    expect(puratanHeadroom("> rest O", RATIO)).toBe(puratanHeadroom(">", RATIO));
  });

  it("asks for less of a taller line box, because there is already more room", () => {
    expect(puratanHeadroom(">", 2.4)).toBeLessThan(puratanHeadroom(">", RATIO));
  });

  // The light and dark records pin no ratio, so the line box is the face's own
  // 2.400em. The Ik Onkar still overflows it, and still has to be cleared.
  it("falls back to the face's natural box when no ratio is pinned", () => {
    expect(puratanHeadroom(">", undefined)).toBe(puratanHeadroom(">", 2.4));
    expect(puratanHeadroom(">", undefined)).toBeGreaterThan(0);
  });

  // `E` overflows by only 43 units. It still gets exactly that and no more.
  it("gives a barely-overflowing glyph only the sliver it is missing", () => {
    const e = puratanHeadroom("E", RATIO);
    expect(e).toBeGreaterThan(0);
    expect(e).toBeLessThan(0.1);
  });

  // The regex is module-scoped and global, so a stale `lastIndex` would make
  // every other call miss.
  it("gives the same answer when called repeatedly", () => {
    const first = puratanHeadroom("<> siq nwmu", RATIO);
    expect(puratanHeadroom("<> siq nwmu", RATIO)).toBe(first);
    expect(puratanHeadroom("<> siq nwmu", RATIO)).toBe(first);
  });
});
