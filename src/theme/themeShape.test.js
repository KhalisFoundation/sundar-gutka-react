import darkTheme from "./darkTheme";
import lightTheme from "./lightTheme";
import { ROLES } from "./semanticColors";

// A theme is a CONTRACT: every screen reads keys off it without checking they
// exist, so a key present in one theme and missing from the other does not throw
// where it is defined — it throws, or silently renders `undefined`, in whichever
// screen happens to read it first, in whichever mode the reader is using.
//
// This caught a real one: deleting the deprecated `colors` map from both themes
// took `typography`, `spacing` and `components` out of the DARK theme only,
// because those keys sat after the deleted block there and before it in light.
// Light mode stayed perfectly fine. Nothing else in the suite noticed.

describe("the two themes are the same shape", () => {
  it("expose an identical set of top-level keys", () => {
    expect(Object.keys(lightTheme).sort()).toEqual(Object.keys(darkTheme).sort());
  });

  it("expose an identical set of colour roles", () => {
    expect(Object.keys(lightTheme.c).sort()).toEqual(Object.keys(darkTheme.c).sort());
  });

  it("define every role the contract lists, in both themes", () => {
    ROLES.forEach((role) => {
      expect(lightTheme.c[role]).toBeDefined();
      expect(darkTheme.c[role]).toBeDefined();
    });
  });

  it("carry no role that the contract does not list", () => {
    // Otherwise a role can be added to one theme, used by a component, and be
    // undefined in the other.
    Object.keys(lightTheme.c).forEach((role) => expect(ROLES).toContain(role));
    Object.keys(darkTheme.c).forEach((role) => expect(ROLES).toContain(role));
  });

  it("no longer carry the deprecated colour maps", () => {
    // Nothing in the app reads these. Leaving them would let new code reach for
    // a raw value that the token layer has already replaced.
    expect(lightTheme.colors).toBeUndefined();
    expect(darkTheme.colors).toBeUndefined();
    expect(lightTheme.staticColors).toBeUndefined();
    expect(darkTheme.staticColors).toBeUndefined();
  });
});

describe("native chrome is a token, not a branch", () => {
  it("gives both themes the same chrome keys", () => {
    expect(Object.keys(lightTheme.chrome).sort()).toEqual(Object.keys(darkTheme.chrome).sort());
  });

  it.each([
    ["statusBarStyle", "dark-content", "light-content"],
    ["scrollIndicator", "black", "white"],
    ["blurType", "light", "dark"],
  ])("%s is opposite in the two themes", (key, light, dark) => {
    // These are native prop ENUMS, not colours, which is why they cannot live in
    // `c`. They are still theme decisions, so components read them rather than
    // writing `mode === "dark" ? … : …` at five separate call sites.
    expect(lightTheme.chrome[key]).toBe(light);
    expect(darkTheme.chrome[key]).toBe(dark);
  });
});
