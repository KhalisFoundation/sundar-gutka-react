/* eslint-env jest */
const fs = require("fs");
const path = require("path");

// `react-native-localization` needs a native module to construct, so requiring
// anything that touches STRINGS explodes here for a reason that has nothing to
// do with the code under test.
jest.mock("react-native-localization", () => {
  function LocalizedStrings(dictionaries) {
    Object.assign(this, dictionaries["en-US"] || {});
    this.setLanguage = () => {};
    this.getString = (key, lang) => (dictionaries[lang] || {})[key];
  }
  return LocalizedStrings;
});

// Smoke test for the crash class that bundling cannot catch and unit tests miss:
// an error thrown while a module's BODY evaluates. Those fire at app startup,
// before anything renders, which is exactly how a bad module-scope reference
// takes the whole app down rather than one screen.
//
// The app shipped a build that crashed on launch because four components read
// `c.<role>` at module scope, where `c` only exists inside the component. Metro
// bundled it happily; nothing failed until the device ran it.
//
// Requiring a module executes that body. We tolerate failures caused by native
// modules that only exist on a device, and fail only on the programming errors
// a build should never contain.

const SRC = path.join(__dirname);

const walk = (dir, out = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["__mocks__", "test-utils"].includes(entry.name)) walk(full, out);
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.(js|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  });
  return out;
};

const files = walk(SRC);

/**
 * Errors that mean "this needs a real device or a Metro transform", not "this
 * code is broken". Jest does not transform most node_modules ESM and has no
 * native bridge; on-device, Metro handles both.
 */
const isEnvironmental = (err) => {
  const m = `${err && err.name}: ${err && err.message}`;
  return (
    /Cannot find module/i.test(m) ||
    /Cannot use import statement outside a module/i.test(m) ||
    /Unexpected token 'export'/i.test(m) ||
    /NativeModule|TurboModule|__fbBatchedBridge|requireNativeComponent/i.test(m) ||
    /Invariant Violation/i.test(m) ||
    /native module not found/i.test(m) ||
    /self is not defined/i.test(m) ||
    /RNFS|TrackPlayer|SQLite|Firebase|BlurView|Reanimated|Notifee/i.test(m)
  );
};

describe("every module evaluates without a programming error", () => {
  it("found modules to check", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(files.map((f) => [path.relative(SRC, f).replace(/\\/g, "/"), f]))("%s", (_name, file) => {
    let err = null;
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        require(file);
      });
    } catch (e) {
      err = e;
    }
    if (!err || isEnvironmental(err)) return;

    // ReferenceError is the signature of the startup crash this guards.
    expect(`${err.name}: ${err.message}`).toBe("no module-scope error");
  });
});
