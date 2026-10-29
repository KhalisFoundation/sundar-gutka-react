import fs from "fs";
import path from "path";
import {
  brandRamp,
  paletteFor,
  rolesFor,
  screenPalettes,
  sevaRoles,
  themeForScreen,
} from "./screenPalettes";

// The Dashboard, Seva and the bani list carry the colours they had before the
// token migration. The architecture is unchanged — those screens still read
// role names — but the values behind those names are their own.
//
// These colours are deliberately scoped. If a fourth screen starts reading them
// they stop being "this screen's palette" and become a second, competing set of
// roles, which is exactly what the token layer replaced.

describe("restored screen palettes", () => {
  it.each(["dashboard", "seva", "baniList"])("%s defines the same keys in both modes", (screen) => {
    const light = Object.keys(screenPalettes[screen].light).sort();
    const dark = Object.keys(screenPalettes[screen].dark).sort();
    // A theme supplies one object per mode; mismatched keys mean one mode
    // silently falls back to undefined.
    expect(dark).toEqual(light);
  });

  it("keeps the Dashboard's own navy card and ground in dark", () => {
    const dark = paletteFor("dashboard", "dark");
    expect(dark.screenBg).toBe("#031329");
    expect(dark.cardBg).toBe("#062346");
    expect(dark.accentBlue).toBe(brandRamp.accentOnDark);
  });

  it("keeps the Dashboard on the brand navy in light", () => {
    const light = paletteFor("dashboard", "light");
    expect(light.screenBg).toBe(brandRamp.tint94);
    expect(light.accentBlue).toBe(brandRamp.base);
    expect(light.cardBg).toBe("#FFFFFF");
  });

  it("restores the bani list's navy ground in dark only", () => {
    expect(paletteFor("baniList", "dark").surface).toBe("#041126");
    expect(paletteFor("baniList", "light").surface).not.toBe("#041126");
  });

  it("resolves Seva's roles to Seva's colours, not the semantic ones", () => {
    expect(sevaRoles("dark").surface).toBe("#062346");
    expect(sevaRoles("light").surface).toBe(brandRamp.tint94);
  });

  it("keeps Seva's two border weights apart", () => {
    // A card's faint 1pt outline and a control's 2pt one were never the same
    // colour. Collapsing them put the heavy control edge around every card.
    expect(sevaRoles("light").border).toBe(brandRamp.tint88);
    expect(sevaRoles("light").borderStrong).toBe(brandRamp.tint40);
    expect(sevaRoles("dark").border).toBe("#1B3A5B");
    expect(sevaRoles("dark").borderStrong).toBe("#2D3748");
  });

  it("keeps Seva's three card grounds apart", () => {
    // The amount card sits on the page's own pale ground; the donate and means
    // cards are white panels above it; the icon plate is a tint between them.
    const light = sevaRoles("light");
    expect(light.surface).toBe(brandRamp.tint94);
    expect(light.surfaceElevated).toBe("#FFFFFF");
    expect(light.surfaceSelected).toBe(brandRamp.tint88);
    expect(new Set(Object.values(light)).size).toBeGreaterThan(1);
  });

  it("puts Settings on the navy hierarchy in dark, and leaves light alone", () => {
    // Same ground as the bani list and the Seva page, so the app is one system.
    expect(rolesFor("settings", "dark").background).toBe(paletteFor("baniList", "dark").surface);
    expect(rolesFor("settings", "dark").surface).toBe("#062346");
    expect(rolesFor("settings", "light")).toEqual({});
  });

  it("leaves roles Seva does not draw with untouched", () => {
    // A partial override — anything absent still falls through to the app's
    // semantic layer rather than resolving to undefined.
    expect(sevaRoles("dark").error).toBeUndefined();
  });

  // The scoping rule, enforced rather than documented.
  it("is imported by the three screens that own it, and nowhere else", () => {
    // Normalised to forward slashes so the check is the same on every platform.
    const ALLOWED = [
      "src/theme/",
      "src/common/hooks/useScreenPalette",
      "src/common/components/BaniList/",
      "src/DashboardScreen/",
      "src/SevaScreen/",
      "src/HomeScreen/",
      // The resolution layer, not a consumer: `useTheme` resolves a scoped
      // screen's colours for every subtree that asked to be scoped, and
      // `useTokens` does the same for its layout.
      "src/common/context/ThemeContext.js",
      "src/common/hooks/useTokens.js",
      // The navigation graph declares which screens share a palette.
      "src/navigation/index.jsx",
    ];
    const offenders = [];
    const walk = (dir) => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules") walk(full);
          return;
        }
        if (!/\.(js|jsx)$/.test(entry.name) || /\.test\./.test(entry.name)) return;
        // An IMPORT, not a passing mention: Sheet documents the palette in a
        // comment without reading it, and that is fine.
        const text = fs.readFileSync(full, "utf8");
        if (!/from "[^"]*screenPalettes"/.test(text)) return;
        const rel = path.relative(path.join(__dirname, "..", ".."), full).split(path.sep).join("/");
        if (!ALLOWED.some((prefix) => rel.startsWith(prefix))) offenders.push(rel);
      });
    };
    walk(path.join(__dirname, ".."));
    expect(offenders).toEqual([]);
  });
});

describe("themeForScreen", () => {
  // The single resolution point every screen-scoped stylesheet goes through.
  // When user themes land, only the registry behind it changes.
  const base = { mode: "dark", c: { surface: "#SEMANTIC", textPrimary: "#SEMANTIC", other: "#KEEP" } };

  it("resolves a screen's roles to that screen's own values", () => {
    const { c } = themeForScreen(base, "seva");
    expect(c.surface).toBe(screenPalettes.seva.dark.cardBg);
    expect(c.textPrimary).toBe(screenPalettes.seva.dark.heading);
  });

  it("leaves roles a screen does not override on the semantic layer", () => {
    expect(themeForScreen(base, "seva").c.other).toBe("#KEEP");
  });

  it("is a no-op for a screen with no overrides", () => {
    expect(themeForScreen(base, "baniList").c).toEqual(base.c);
    expect(rolesFor("baniList", "dark")).toEqual({});
    expect(rolesFor("nosuchscreen", "dark")).toEqual({});
  });

  it("does not mutate the theme it is given", () => {
    themeForScreen(base, "dashboard");
    expect(base.c.surface).toBe("#SEMANTIC");
  });

  it("puts the Dashboard ground and card on their restored values", () => {
    expect(themeForScreen({ mode: "dark", c: {} }, "dashboard").c.background).toBe("#031329");
    expect(themeForScreen({ mode: "dark", c: {} }, "dashboard").c.surface).toBe("#062346");
    expect(themeForScreen({ mode: "light", c: {} }, "dashboard").c.surface).toBe("#FFFFFF");
  });
});
