/* eslint-env jest */
import { renderHook } from "@testing-library/react-native";
import {
  glyphsForSurface,
  navBarGlyphsAreDark,
  resetNavBarGlyphs,
  useNavBarSurface,
} from "./systemBars";

// The navigation bar's glyphs have to contrast with whatever the app draws
// behind them, because the platform's own scrim cannot: it is tinted from the
// window, so over a white bani page it lands light grey and its white glyphs
// disappear into it.
//
// The precedence rule is the part worth pinning. A hidden tab bar is still
// mounted under the Reader and under the first-run length screen, and it
// renders AFTER screen content inside BottomTabView — so anything that let it
// register would let it decide for a screen it is not part of.

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  NativeModules: { SystemBars: { setNavigationBarLightGlyphs: jest.fn() } },
}));

beforeEach(() => {
  resetNavBarGlyphs();
});

describe("system navigation bar glyphs", () => {
  it("claims nothing until a screen describes its surface", () => {
    expect(navBarGlyphsAreDark()).toBeNull();
  });

  it("goes dark over a light surface and light over a dark one", () => {
    const light = renderHook(() => useNavBarSurface(true));
    expect(navBarGlyphsAreDark()).toBe(true);
    light.unmount();

    renderHook(() => useNavBarSurface(false));
    expect(navBarGlyphsAreDark()).toBe(false);
  });

  it("follows a screen that changes surface under it", () => {
    // The Reader: navy nav while its chrome is up, white page once it hides.
    const { rerender } = renderHook(({ light }) => useNavBarSurface(light), {
      initialProps: { light: false },
    });
    expect(navBarGlyphsAreDark()).toBe(false);

    rerender({ light: true });

    expect(navBarGlyphsAreDark()).toBe(true);
  });

  it("ignores a hidden bar that claims nothing", () => {
    // The Reader over a white page.
    renderHook(() => useNavBarSurface(true));
    // The tab bar underneath, hidden, mounting afterwards.
    renderHook(() => useNavBarSurface(null));

    expect(navBarGlyphsAreDark()).toBe(true);
  });

  it("hands back to the screen underneath when one is dismissed", () => {
    renderHook(() => useNavBarSurface(false));
    const front = renderHook(() => useNavBarSurface(true));
    expect(navBarGlyphsAreDark()).toBe(true);

    front.unmount();

    expect(navBarGlyphsAreDark()).toBe(false);
  });
});

describe("a screen pushed over the tab bar", () => {
  // The bug this fixes: the tab bar only treats itself as hidden for the bani
  // length selector, so it keeps claiming its navy while a pushed screen covers
  // it. White glyphs then sat over a light pothi list. Ordering is what settles
  // it - whatever mounted last is what the user is looking at.
  it("outranks the bar still mounted underneath it", () => {
    const bar = renderHook(() => useNavBarSurface(false));
    expect(navBarGlyphsAreDark()).toBe(false);

    const screen = renderHook(() => useNavBarSurface(glyphsForSurface("#F3F4F6")));
    expect(navBarGlyphsAreDark()).toBe(true);

    screen.unmount();
    // ...and hands back to the bar on pop rather than leaving it stale.
    expect(navBarGlyphsAreDark()).toBe(false);
    bar.unmount();
  });
});
describe("choosing glyphs by measurement", () => {
  it("picks whichever colour actually contrasts, not what the theme calls itself", () => {
    expect(glyphsForSurface("#FFFFFF")).toBe(true);
    expect(glyphsForSurface("#131416")).toBe(false);
  });

  it("resolves a mid-tone ground to whichever side actually reads", () => {
    // The case a light/dark guess gets wrong: a ground close in lightness to
    // the glyphs, where the buttons vanish. The crossover is not mid-hex —
    // #808080 already contrasts better with black, because luminance is not
    // linear in the channel value. Measuring finds that; guessing does not.
    expect(glyphsForSurface("#B0B0B0")).toBe(true);
    expect(glyphsForSurface("#808080")).toBe(true);
    expect(glyphsForSurface("#6E6E6E")).toBe(false);
    expect(glyphsForSurface("#4A4A4A")).toBe(false);
  });

  it("says nothing about a colour it cannot read", () => {
    expect(glyphsForSurface("not-a-colour")).toBe(null);
    expect(glyphsForSurface(undefined)).toBe(null);
  });
});
