/* eslint-env jest */
import { DefaultTheme } from "@react-navigation/native";
import navigationThemeFor from "./navigationTheme";

describe("navigationThemeFor", () => {
  it("paints the scene ground with the screen colour it is given", () => {
    expect(navigationThemeFor("#041126", true).colors.background).toBe("#041126");
  });

  it("reports the appearance so the library's own defaults follow it", () => {
    expect(navigationThemeFor("#fff", false).dark).toBe(false);
    expect(navigationThemeFor("#000", true).dark).toBe(true);
  });

  it("leaves the card colour alone, since it also paints native headers", () => {
    expect(navigationThemeFor("#041126", true).colors.card).toBe(DefaultTheme.colors.card);
  });

  it("keeps every other default the library relies on", () => {
    const { colors } = navigationThemeFor("#041126", true);
    Object.keys(DefaultTheme.colors)
      .filter((key) => key !== "background")
      .forEach((key) => expect(colors[key]).toBe(DefaultTheme.colors[key]));
    expect(navigationThemeFor("#041126", true).fonts).toBe(DefaultTheme.fonts);
  });
});

// The three layers that together keep a push transition opaque. Asserted
// against the source: rendering the navigator would test the mocks more than
// the rule, and any one of these being dropped brings the light strip back.
describe("the navigator paints every layer a transition can expose", () => {
  const fs = require("fs");
  const path = require("path");
  const source = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");

  it("hands the container a theme, so the scenes take the app ground", () => {
    expect(source).toMatch(/theme=\{navigationTheme\}/);
  });

  it("paints the scene content itself before its first frame", () => {
    expect(source).toMatch(/contentStyle: \{ backgroundColor: sceneGround \}/);
  });

  it("paints the ground UNDER the stack, where the Android slide opens a gap", () => {
    // The stack container paints nothing of its own, so without this the gap
    // showed the Activity window — light, from the native theme.
    expect(source).toMatch(/<View style=\{\{ flex: 1, backgroundColor: sceneGround \}\}>/);
  });
});
