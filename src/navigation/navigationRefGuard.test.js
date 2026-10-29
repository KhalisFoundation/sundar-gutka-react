import fs from "fs";
import path from "path";

/**
 * The root navigation ref is only attached between the container mounting and
 * unmounting, so `navigationRef.current` is null on either side of that — and
 * `onReady` / `onStateChange` run from the container's own layout effects,
 * which is exactly the window a rebuild passes through. Reaching for `.current`
 * there threw "Cannot read property 'getCurrentRoute' of null", and because the
 * whole tree sits inside an error boundary, the user got the fallback screen
 * rather than a silent log.
 *
 * `isReady()` is the documented guard and is what rootNavigation.js already
 * uses; this keeps the rest of the app on it. A source-text rule rather than a
 * render test, in the same spirit as the pothi mutation gate: the mistake is
 * always visible in the source, and rendering the whole navigator to catch it
 * would cost far more than it proves.
 */

const SRC = path.join(__dirname, "..");

// Comments are stripped before the rule is applied: a line explaining WHY the
// ref must not be read that way is not itself a use of it.
const codeOnly = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");

const sourceFiles = () => {
  const out = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
        return;
      }
      if (!/\.(js|jsx)$/.test(entry.name) || /\.test\./.test(entry.name)) return;
      out.push({
        rel: path.relative(SRC, full).split(path.sep).join("/"),
        text: fs.readFileSync(full, "utf8"),
      });
    });
  };
  walk(SRC);
  return out;
};

it("never reads navigationRef.current — every use goes through isReady()", () => {
  const offenders = sourceFiles()
    .filter(({ text }) => /navigationRef\s*\.\s*current/.test(codeOnly(text)))
    .map(({ rel }) => rel)
    .sort();
  expect(offenders).toEqual([]);
});

it("the navigation container still reports the route it lands on", () => {
  // The guard must not have quietly removed the screen tracking it protects.
  const source = fs.readFileSync(path.join(__dirname, "index.jsx"), "utf8");
  expect(source).toMatch(/navigationRef\.isReady\(\)\s*\?\s*navigationRef\.getCurrentRoute\(\)/);
  expect(source).toMatch(/trackScreenView\(/);
  expect(source).toMatch(/setReaderFocused\(/);
});
