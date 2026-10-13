import { constant } from "@common";
import darkTheme from "./darkTheme";
import lightTheme from "./lightTheme";

// The test that would have caught the Hindi/Punjabi misalignment.
//
// Every role in the scale used to pin a lineHeight on a 4pt grid — body 16/24,
// caption 12/16, heading 20/28 — and every one of them was smaller than the box
// the font actually asks for. That is what shifted Devanagari and Gurmukhi
// glyphs vertically on Realme (ColorOS) and on Android tablets while leaving
// Latin looking fine.
//
// Measured from the shipped TTFs:
//
//   BalooPaaji2-Regular / -SemiBold   1000upem, hhea 1157/-614   -> 1.771em
//   GurbaniAkharTrue                  2000upem, hhea 1856/-801   -> 1.329em
//
// When `lineHeight` is under the natural box, RN's CustomLineHeightSpan removes
// the shortfall from the line — ceil(leading/2) off the ascent, floor(leading/2)
// off the descent. The box still measures exactly `lineHeight`, so the ROW keeps
// its height and only the baseline moves; scripts that draw above the headline
// then read as pushed up with a gap underneath.
//
// Nothing in the previous 119-file suite noticed, because every type assertion
// was self-referential (`expect(style.lineHeight).toBe(theme.type.X.lineHeight)`)
// and there are no snapshots. Hence this file.
const NATURAL_LINE_BOX = {
  [constant.BALOO_PAAJI]: 1.771,
  [constant.BALOO_PAAJI_SEMI_BOLD]: 1.771,
  [constant.GURBANI_AKHAR_TRUE]: 1.329,
};

// Roles that carry real metrics. `inherit` is deliberately `{}` — it exists so
// CustomText can render through the same primitive without a role imposing a
// size — and `fonts`/`weights` are not roles at all.
const NON_ROLE_KEYS = ["fonts", "weights", "inherit"];

const rolesOf = (theme) =>
  Object.entries(theme.type).filter(
    ([key, value]) =>
      !NON_ROLE_KEYS.includes(key) && value && typeof value === "object" && value.fontSize
  );

describe.each([
  ["light", lightTheme],
  ["dark", darkTheme],
])("[%s] type scale line metrics", (_name, theme) => {
  it("gives every role a size and a real designed face", () => {
    const roles = rolesOf(theme);
    expect(roles.length).toBeGreaterThan(0);
    roles.forEach(([key, role]) => {
      expect(`${key}:${typeof role.fontSize}`).toBe(`${key}:number`);
      expect(`${key}:${role.fontFamily in NATURAL_LINE_BOX}`).toBe(`${key}:true`);
    });
  });

  // The regression guard. A role may leave lineHeight unset (preferred — the
  // face's own spacing is exact and follows the OS text-size setting), but if it
  // sets one it must clear that face's natural box. Anything in between is the
  // squeeze this whole file exists to prevent.
  it("never pins a line height below the font's own line box", () => {
    rolesOf(theme).forEach(([key, role]) => {
      if (role.lineHeight === undefined) return;
      const required = role.fontSize * NATURAL_LINE_BOX[role.fontFamily];
      expect(`${key}:${role.lineHeight >= required}`).toBe(`${key}:true`);
    });
  });

  // The Baloo roles specifically: they are the ones that were wrong, and the
  // fix was to remove the value rather than raise it. Pinned by name so the old
  // numbers cannot quietly come back.
  it("leaves the Baloo UI roles unset rather than hand-picking a number", () => {
    ["display", "title", "heading", "subheading", "body", "bodySmall", "label", "caption"].forEach(
      (key) => {
        expect(`${key}:${theme.type[key].lineHeight}`).toBe(`${key}:undefined`);
      }
    );
  });

  // baniTitle is the exception and stays that way: 40 over a 1.329em face at
  // 28pt needs 37.2, so it was always correct. Dropping it would tighten the
  // title for no reason.
  it("keeps baniTitle's line height, which was already above its own floor", () => {
    const { fontSize, lineHeight, fontFamily } = theme.type.baniTitle;
    expect(fontFamily).toBe(constant.GURBANI_AKHAR_TRUE);
    expect(lineHeight).toBe(40);
    expect(lineHeight).toBeGreaterThanOrEqual(fontSize * NATURAL_LINE_BOX[fontFamily]);
  });

  // `inherit` carries no metrics, which is what keeps CustomText's ~59 call
  // sites out of the blast radius of any change here.
  it("keeps inherit free of metrics", () => {
    expect(theme.type.inherit).toEqual({});
  });
});
