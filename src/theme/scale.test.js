import layout from "./layout";
import {
  breakpointFor,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  resolveScale,
  resolveTokens,
  scaleLayout,
} from "./scale";
import space from "./space";

// The scaling layer is what lets the app drop hardcoded measurements, so its
// behaviour at the extremes matters more than at the reference device: a 320dp
// phone at the largest OS font is the case that used to break layouts.

describe("breakpoints", () => {
  it("classifies the widths the app actually has to support", () => {
    expect(breakpointFor(320)).toBe("compact"); // the small-device floor
    expect(breakpointFor(359)).toBe("compact");
    expect(breakpointFor(360)).toBe("regular"); // most phones
    expect(breakpointFor(414)).toBe("regular");
    expect(breakpointFor(600)).toBe("expanded"); // tablet / unfolded foldable
    expect(breakpointFor(1024)).toBe("expanded");
  });

  it("defaults to regular when width is unknown", () => {
    expect(resolveScale({}).breakpoint).toBe("regular");
  });
});

describe("font scale clamping", () => {
  it("clamps below the floor and above the ceiling", () => {
    expect(resolveScale({ width: 360, fontScale: 0.2 }).fontScale).toBe(FONT_SCALE_MIN);
    expect(resolveScale({ width: 360, fontScale: 4 }).fontScale).toBe(FONT_SCALE_MAX);
  });

  it("passes through a scale inside the range untouched", () => {
    expect(resolveScale({ width: 360, fontScale: 1.3 }).fontScale).toBeCloseTo(1.3);
  });

  it("treats a missing scale as 1", () => {
    expect(resolveScale({ width: 360 }).fontScale).toBe(1);
  });
});

describe("spacing is damped relative to text", () => {
  it("grows more slowly than the font scale", () => {
    const { scale } = resolveTokens({ space, layout, width: 360, fontScale: 1.5 });
    // Text is 50% larger; spacing must grow, but by noticeably less, or the
    // gaps eat the screen exactly when there is least room for them.
    expect(scale.space).toBeGreaterThan(1);
    expect(scale.space).toBeLessThan(1.5);
    expect(scale.container).toBe(1.5);
  });

  it("tightens on compact screens and relaxes on expanded ones", () => {
    const at = (width) => resolveTokens({ space, layout, width, fontScale: 1 }).space.lg;
    expect(at(320)).toBeLessThan(at(390));
    expect(at(390)).toBeLessThan(at(800));
  });
});

describe("resolved tokens stay renderable", () => {
  const cases = [
    ["small phone, default font", 320, 1],
    ["small phone, largest font", 320, 1.5],
    ["typical phone", 390, 1],
    ["tablet, largest font", 800, 1.5],
  ];

  it.each(cases)("%s: every space value is a whole number > 0", (_label, width, fontScale) => {
    const t = resolveTokens({ space, layout, width, fontScale });
    Object.entries(t.space).forEach(([key, value]) => {
      expect(Number.isInteger(value)).toBe(true);
      if (space[key] > 0) expect(value).toBeGreaterThan(0);
    });
  });

  it.each(cases)("%s: touch targets never fall below 44pt", (_label, width, fontScale) => {
    const { layout: l } = resolveTokens({ space, layout, width, fontScale });
    // 44 is the WCAG 2.5.5 / Apple HIG floor. Scaling must never push a target
    // under it, including on the smallest supported screen.
    expect(l.touchTarget).toBeGreaterThanOrEqual(44);
    expect(l.header.actionSize).toBeGreaterThanOrEqual(44);
    expect(l.row.minHeight).toBeGreaterThanOrEqual(44);
  });

  it("grows text containers at the full font rate so text still fits", () => {
    const base = resolveTokens({ space, layout, width: 390, fontScale: 1 }).layout;
    const large = resolveTokens({ space, layout, width: 390, fontScale: 1.5 }).layout;
    expect(large.row.minHeight).toBe(Math.round(base.row.minHeight * 1.5));
    expect(large.row.minHeightTwoLine).toBeGreaterThan(base.row.minHeightTwoLine);
  });

  it("leaves ratios, durations and border widths unscaled", () => {
    const { layout: l } = resolveTokens({ space, layout, width: 800, fontScale: 1.5 });
    // A ratio is not a measurement; a hairline is 1px at every font size.
    expect(l.sheet.maxHeightRatio).toBe(layout.sheet.maxHeightRatio);
    expect(l.toast.durationMs).toBe(layout.toast.durationMs);
    expect(l.borderWidth.hairline).toBe(1);
    expect(l.borderWidth.focus).toBe(2);
  });

  it("keeps the 4pt grid recognisable at the reference device", () => {
    const { space: s } = resolveTokens({ space, layout, width: 390, fontScale: 1 });
    // At the reference width and scale the tokens should come back as designed.
    expect(s.md).toBe(space.md);
    expect(s.lg).toBe(space.lg);
    expect(s.xl).toBe(space.xl);
  });
});

// The header clearance is a DEVICE fact — the camera cutout and status-bar strip
// — not a piece of layout. Two things go wrong if it scales:
//
//   • raising the text size pushes every header further down the screen, and
//   • the same token resolves to two different numbers, because the shared
//     header reads it through `useTokens` (scaled) while the Reader's own header
//     reads the raw theme. That is precisely how the two headers drifted apart
//     after they were supposedly unified on one token.
describe("header top clearance is a device fact, not layout", () => {
  const headerLayout = { header: { topClearance: 48, minHeight: 56 } };

  it("is identical at every font scale", () => {
    const small = scaleLayout(headerLayout, { space: 1, container: 1 });
    const large = scaleLayout(headerLayout, { space: 1.5, container: 1.5 });

    expect(small.header.topClearance).toBe(48);
    expect(large.header.topClearance).toBe(48);
  });

  it("does not freeze the rest of the header with it", () => {
    // Only the clearance is exempt; row heights still grow so text fits.
    const large = scaleLayout(headerLayout, { space: 1.5, container: 1.5 });
    expect(large.header.minHeight).toBeGreaterThan(56);
  });
});
