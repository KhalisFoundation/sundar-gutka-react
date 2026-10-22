import readerStyles from "../ReaderScreen/styles";
import darkTheme from "./darkTheme";
import lightTheme from "./lightTheme";

// The whole app uses exactly TWO greys, and which one a thing gets is decided by
// what the thing IS, not by which screen it happens to live on:
//
//   background  — the ground a SCREEN sits on. Dashboard, Settings, and the
//                 Reader page and its header.
//   surface     — a CARD sitting on that ground. Settings and Dashboard cards,
//                 and every box in the audio player: the bar, the full player,
//                 the expansion behind Audios/Options, the settings panel, and
//                 the loading and error panels that stand in for the player.
//
// The Reader used to take `surface` for its page and header, which made the one
// screen people spend the most time in a step lighter than everything else in
// dark mode. The audio boxes drifted the other way onto `surfaceElevated`, a
// third grey that matched nothing.
//
// Asserted as EQUALITY between roles rather than against hex values, so retuning
// the ladder cannot make this pass while the screens disagree.
//
// The audio player's boxes and the Dashboard join these checks with their own
// PRs, once those screens are on the token layer.

const themes = [
  ["light", lightTheme],
  ["dark", darkTheme],
];

describe("two greys, assigned by what a thing is", () => {
  it.each(themes)("[%s] the Reader page and header sit on the screen ground", (_n, theme) => {
    const rs = readerStyles(theme);
    expect(rs.headerStyle.backgroundColor).toBe(theme.c.backgroundAlt);
  });

  it("a card is distinguishable from the ground it sits on, in dark mode", () => {
    // Light mode deliberately shares one white and separates with a shadow.
    expect(darkTheme.c.surface).not.toBe(darkTheme.c.background);
  });

  it("uses no third grey — surfaceElevated is not a screen role", () => {
    const rs = readerStyles(darkTheme);
    expect(rs.headerStyle.backgroundColor).not.toBe(darkTheme.c.surfaceElevated);
  });
});

// Both headers start their content at the same height. They are separate
// components — the Reader animates its own in and out — so nothing but a shared
// token keeps them together.
describe("every header starts at one height", () => {
  it.each(themes)("[%s] Reader clearance equals the shared header's", (_n, theme) => {
    const rs = readerStyles(theme);
    expect(rs.headerStyle.paddingTop).toBe(theme.layout.header.topClearance);
    expect(rs.headerWrapper.minHeight).toBe(theme.layout.header.minHeight);
  });

  it("keeps the clearance and the row height on SEPARATE views", () => {
    // React Native measures minHeight against the border box, so padding is
    // counted inside it: both on one view lets a 48pt clearance swallow a 56pt
    // minimum and collapse the row onto its content. That is what made the
    // Reader's title sit ~15pt higher than every other screen's.
    const rs = readerStyles(lightTheme);
    expect(rs.headerWrapper.paddingTop).toBeUndefined();
    expect(rs.headerStyle.minHeight).toBeUndefined();
  });
});

// Each theme uses exactly ONE blue for everything a user can act on or that
// carries emphasis. Dark mode was collapsed first; light mode still had three —
// navy for chrome and controls, a brighter accent, and a third for links — with
// no rule to tell them apart and no counterpart in dark mode.
//
// `primary` is deliberately excluded: it is brand CHROME (the bottom navigation)
// and stays navy in BOTH themes, which is why dark mode legitimately shows two
// values overall while everything interactive shows one.
describe("one blue per theme", () => {
  const INTERACTIVE = ["textBrand", "controlAccent", "accent", "link", "focusRing"];

  it.each(themes)("[%s] every interactive blue is the same value", (_n, theme) => {
    const distinct = new Set(INTERACTIVE.map((r) => theme.c[r]));
    expect([...distinct]).toHaveLength(1);
  });

  it("light mode's blue is the navigation bar's own navy", () => {
    // So the accents agree with the bar at the bottom of every screen.
    expect(lightTheme.c.accent).toBe(lightTheme.c.primary);
  });

  it("dark mode lifts the interactive blue off the chrome navy", () => {
    // The navy measures ~1.3:1 on the dark ground — fine behind white on a
    // filled bar, far too quiet for a control the user is meant to spot.
    expect(darkTheme.c.accent).not.toBe(darkTheme.c.primary);
  });
});
