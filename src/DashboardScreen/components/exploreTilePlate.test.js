import { brandMarks } from "@theme/palette";
import { plateFor } from "./tilePlate";

// The plate behind an Explore tile's artwork.
//
// Most tiles take the screen's own plate, which follows the theme like every
// other surface on the card. Two do NOT, and must not: Sehaj Path's mark is a
// navy app icon and Sri Darbar Sahib's is gold, so each needs a ground chosen
// for the artwork rather than derived from the page. A themed plate takes its
// value from the page ground, which on the dark-based designed themes is
// exactly what these marks disappear into — the shared plate is a white wash,
// and on a near-black card it composites to near-black.
//
// So these assert the opposite of the usual rule: the fixed plates must come
// back UNCHANGED under every theme, designed ones included.

const themeFor = (mode, designedTheme = false) => ({ mode, designedTheme });

const DESIGNED = [themeFor("light", true), themeFor("dark", true)];

describe("plateFor", () => {
  it("hands an ordinary tile the screen's own plate, whatever the theme", () => {
    const themed = "#whatever-the-screen-resolved";
    [themeFor("light"), themeFor("dark"), ...DESIGNED].forEach((theme) => {
      expect(plateFor({ id: "search" }, theme, themed)).toBe(themed);
    });
  });

  it("gives the gold darbar mark one deep ground in every theme", () => {
    const tile = { id: "hukamnama", plate: "deep" };
    const everywhere = [themeFor("light"), themeFor("dark"), ...DESIGNED].map((theme) =>
      plateFor(tile, theme, "#ignored")
    );
    expect(new Set(everywhere).size).toBe(1);
    expect(everywhere[0]).toBe(brandMarks.appIconPlates.deep);
  });

  it("keeps the navy Sehaj Path mark on a light plate in every theme", () => {
    const tile = { id: "sehaj-path", plate: "pale" };
    // Per mode — the pale tint is stepped down on a dark card — but never
    // derived from the theme, so a designed theme gets the same pair.
    expect(plateFor(tile, themeFor("light"), "#ignored")).toBe(brandMarks.appIconPlates.pale.light);
    expect(plateFor(tile, themeFor("dark"), "#ignored")).toBe(brandMarks.appIconPlates.pale.dark);
    expect(plateFor(tile, themeFor("light", true), "#ignored")).toBe(
      brandMarks.appIconPlates.pale.light
    );
    expect(plateFor(tile, themeFor("dark", true), "#ignored")).toBe(
      brandMarks.appIconPlates.pale.dark
    );
  });

  it("never returns the themed fallback for a tile that named a plate", () => {
    ["deep", "pale"].forEach((plate) => {
      DESIGNED.forEach((theme) => {
        expect(plateFor({ plate }, theme, "#themed")).not.toBe("#themed");
      });
    });
  });
});
