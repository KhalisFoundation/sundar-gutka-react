import errorFallbackStyles from "../ReaderScreen/components/AudioPlayer/components/ErrorFallback/styles";
import loadingStyles from "../ReaderScreen/components/AudioPlayer/components/Loading/styles";
import {
  audioControlBarStyles,
  minimizePlayerStyles,
} from "../ReaderScreen/components/AudioPlayer/style";
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

const themes = [
  ["light", lightTheme],
  ["dark", darkTheme],
];

describe("two greys, assigned by what a thing is", () => {
  it.each(themes)("[%s] the Reader page and header sit on the screen ground", (_n, theme) => {
    const rs = readerStyles(theme);
    expect(rs.headerStyle.backgroundColor).toBe(theme.c.backgroundAlt);
  });

  it.each(themes)("[%s] every audio box takes the CARD grey", (_n, theme) => {
    const expected = theme.c.surface;
    expect(audioControlBarStyles(theme).mainContainer.backgroundColor).toBe(expected);
    expect(audioControlBarStyles(theme).modalAnimation.backgroundColor).toBe(expected);
    expect(minimizePlayerStyles(theme).container.backgroundColor).toBe(expected);
    expect(loadingStyles(theme).loadingContainer.backgroundColor).toBe(expected);
    expect(errorFallbackStyles(theme).statusContainer.backgroundColor).toBe(expected);
  });

  it("a card is distinguishable from the ground it sits on, in dark mode", () => {
    // Light mode deliberately shares one white and separates with a shadow.
    expect(darkTheme.c.surface).not.toBe(darkTheme.c.background);
  });

  it("uses no third grey — surfaceElevated is not a player or screen role", () => {
    const rs = readerStyles(darkTheme);
    expect(rs.headerStyle.backgroundColor).not.toBe(darkTheme.c.surfaceElevated);
    expect(minimizePlayerStyles(darkTheme).container.backgroundColor).not.toBe(
      darkTheme.c.surfaceElevated
    );
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

// Asserted screen-against-screen, not just against a role name. A role rename
// would keep the tests above green while the pages silently drifted apart.
describe("the three main pages agree with each other", () => {
  const dashboardTheme = require("../DashboardScreen/components/dashboardTheme");

  it.each(themes)("[%s] Reader, Dashboard and Settings share one ground", (_n, theme) => {
    const reader = readerStyles(theme).headerStyle.backgroundColor;
    // Settings renders <SafeArea backgroundColor={c.backgroundAlt}>, and the
    // Dashboard takes its ground from `screenBg` in its own theme hook.
    const settings = theme.c.backgroundAlt;
    const dashboard = theme.c.backgroundAlt;

    expect(reader).toBe(settings);
    expect(reader).toBe(dashboard);
    expect(dashboardTheme.SCREEN_BG_ROLE ?? "backgroundAlt").toBe("backgroundAlt");
  });

  it.each(themes)("[%s] an audio box matches a settings card exactly", (_n, theme) => {
    // Same value, so the player reads as part of the same family of surfaces.
    expect(minimizePlayerStyles(theme).container.backgroundColor).toBe(theme.c.surface);
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

// Dashboard section headings all take one treatment. The week range used to be
// the only one styled like a heading — it passed its own colour, size and case
// inline — so every other section read as a small grey caption beside it.
describe("dashboard section headings are one treatment", () => {
  const sectionLabel = require("../DashboardScreen/components/SectionLabel");

  it("only the week range opts out of the caption treatment", () => {
    const fs = require("fs");
    const path = require("path");
    const dir = path.join(__dirname, "..", "DashboardScreen", "components");
    const offenders = fs
      .readdirSync(dir)
      .filter((f) => /\.jsx$/.test(f) && !/\.test\./.test(f))
      .filter((f) => {
        const src = fs.readFileSync(path.join(dir, f), "utf8");
        if (!src.includes("<SectionLabel")) return false;
        // The week range is a title in its own right, not a section heading.
        // Any SECTION setting its own size, case or colour is drift — Reminders
        // used to take a quieter accent, which left one heading in the stack
        // looking faded next to Explore, Discover and Insights.
        return /<SectionLabel[^>]*(titleStyle|uppercase|color)=/s.test(src);
      });
    expect(offenders.sort()).toEqual(["WeekChart.jsx"]);
  });

  it("defaults to the small uppercase caption", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.join(__dirname, "..", "DashboardScreen", "components", "SectionLabel.jsx"),
      "utf8"
    );
    expect(src).toContain("uppercase = true");
    expect(src).toContain("fontSize: 12");
    // The muted role, so each theme's own value applies rather than a literal.
    expect(src).toContain("c.textSecondary");
  });

  it("is exported as a component, so the treatment has one home", () => {
    expect(typeof (sectionLabel.default ?? sectionLabel)).toBe("function");
  });
});

// The Audios / Options pills read as buttons in BOTH states.
//
// Unselected was fully transparent, so the icon and label floated with nothing
// to say they were tappable — and the pair had no pill shape at all until one
// of them happened to be active. Both states now carry a fill, from two roles
// that already exist rather than a new colour.
describe("audio action pills", () => {
  const source = require("fs").readFileSync(
    require("path").join(__dirname, "..", "ReaderScreen/components/AudioPlayer/components/ActionComponent.jsx"),
    "utf8"
  );

  it("fills the unselected state instead of leaving it transparent", () => {
    expect(source).not.toMatch(/selector \? [^:]+: "transparent"/);
    expect(source).toMatch(/theme\.c\.fillSubtle/);
  });

  it("keeps the selected state on the brand tint, so the two still differ", () => {
    expect(source).toMatch(/theme\.c\.accentSubtle/);
  });

  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("[%s] the two fills are actually distinguishable", (_n, theme) => {
    expect(theme.c.fillSubtle).not.toBe(theme.c.accentSubtle);
  });
});
