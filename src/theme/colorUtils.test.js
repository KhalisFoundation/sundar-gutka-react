import { hexToRgb, mix, withAlpha } from "./colorUtils";

describe("hexToRgb", () => {
  it("reads 6- and 3-digit hex, with or without the hash", () => {
    expect(hexToRgb("#113979")).toBe("17,57,121");
    expect(hexToRgb("113979")).toBe("17,57,121");
    expect(hexToRgb("#fff")).toBe("255,255,255");
  });

  it("returns null for anything it cannot parse", () => {
    // A caller can then fall back rather than render rgba(NaN,NaN,NaN,0.5),
    // which paints nothing — invisible to look at, very visible as a gap.
    ["", "not-a-colour", "#12", "#1234567", null, undefined, 42].forEach((bad) =>
      expect(hexToRgb(bad)).toBeNull()
    );
  });
});

describe("withAlpha", () => {
  it("produces an rgba string at the requested strength", () => {
    expect(withAlpha("#113979", 0.5)).toBe("rgba(17,57,121,0.5)");
  });

  it("falls back to transparent rather than emitting NaN", () => {
    expect(withAlpha("nope", 0.5)).toBe("transparent");
  });
});

describe("mix", () => {
  it("returns each end at t=0 and t=1", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("blends linearly per channel", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#ff0000", "#0000ff", 0.5)).toBe("#800080");
  });

  it("pads each channel to two digits", () => {
    // Without padStart a channel below 16 emits one digit and the whole string
    // becomes a 5-character hex that renders as nothing.
    expect(mix("#000000", "#0a0a0a", 1)).toBe("#0a0a0a");
    expect(mix("#000000", "#101010", 0.5)).toBe("#080808");
  });

  it("is OPAQUE, unlike withAlpha", () => {
    // The distinction the reading themes depend on: a derived translation colour
    // must look the same over a background texture as it does over flat paper.
    expect(mix("#000000", "#ffffff", 0.5)).not.toContain("rgba");
  });

  it("returns the first colour unchanged when either end is unparseable", () => {
    expect(mix("#123456", "nope", 0.5)).toBe("#123456");
    expect(mix("nope", "#123456", 0.5)).toBe("nope");
  });
});
