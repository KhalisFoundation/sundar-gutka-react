import fs from "fs";
import path from "path";

import darkTheme from "./darkTheme";
import lightTheme from "./lightTheme";

// Every themed stylesheet in the app, actually INVOKED against both themes.
//
// This exists because a style factory can import cleanly and still throw the
// moment it runs, and nothing else in the suite runs most of them. It has now
// happened twice:
//
//   • `database/utils` destructured a colours module that had been deleted. The
//     import did not throw — the binding was simply `undefined` — so the module
//     load test passed. Only the CALL threw, inside a try/catch that routed to
//     Crashlytics, and every bani opened to a blank screen.
//   • `OnboardingCarousel/style.jsx` used `withAlpha` without importing it. The
//     app would not start at all: "Property 'withAlpha' doesn't exist", thrown
//     from `createStyles` during the first render.
//
// ESLint's `no-undef` catches the second and would have caught it immediately —
// the failure was that the file was edited but never linted. This is the belt to
// that braces: it runs on every file automatically, so no one has to remember
// which files a change touched.
//
// Both themes, because a factory can reference a role that only one theme
// defines and stay invisible until someone switches.

const ROOT = path.join(__dirname, "..");

const collect = (dir, out = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") collect(full, out);
    } else if (/^styles?\.(js|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  });
  return out;
};

const FACTORIES = collect(ROOT).filter((f) => !/\.test\./.test(f));

describe("every themed stylesheet runs", () => {
  it("finds the stylesheets to check", () => {
    // A silent zero here would make every assertion below vacuous.
    expect(FACTORIES.length).toBeGreaterThan(10);
  });

  it.each([
    ["light", lightTheme],
    ["dark", darkTheme],
  ])("[%s] builds without throwing", (_name, theme) => {
    const broken = [];

    FACTORIES.forEach((file) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(file);
      const factory = mod.default ?? mod;
      if (typeof factory !== "function") return;
      try {
        factory(theme);
      } catch (error) {
        broken.push(`${path.relative(ROOT, file)} — ${error.message}`);
      }
    });

    expect(broken).toEqual([]);
  });
});
