import fs from "fs";
import path from "path";
import constant from "../../../common/constant";
import { getBaniFontFaces } from "./strings";

// A font offered in the Bani Font picker has to exist in five places at once,
// and missing any one of them fails somewhere the picker cannot show:
//
//   assets/fonts/<name>.ttf                     the source of truth
//   android/app/src/main/assets/fonts/          what the WebView loads on Android
//   ios/SundarGutka/Info.plist UIAppFonts       what registers it on iOS
//   ios/.../project.pbxproj                     what copies it into the bundle
//   the reader's @font-face block               what the WebView can actually use
//
// Four of those are platform files no unit test otherwise reads, and a font
// wired into three of them looks completely correct on the platform you happen
// to be testing on. So this checks the picker against the files themselves
// rather than against a second hand-kept list.

const ROOT = path.join(__dirname, "..", "..", "..", "..");
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), "utf8");
const exists = (...parts) => fs.existsSync(path.join(ROOT, ...parts));

// The picker's own rows, resolved with a strings object that returns the key —
// the titles are localised and only the font KEY matters here.
const offered = getBaniFontFaces(new Proxy({}, { get: (_, key) => String(key) })).map(
  (row) => row.key
);

const plist = read("ios", "SundarGutka", "Info.plist");
const pbxproj = read("ios", "SundarGutka.xcodeproj", "project.pbxproj");
const readerHtml = read("src", "ReaderScreen", "utils", "gutkahtml.js");

describe("every font in the Bani Font picker", () => {
  it("offers the fonts this build ships", () => {
    // A registry, so adding or removing a choice is a deliberate edit here
    // rather than something that slips through the checks below.
    expect(offered).toEqual([
      constant.ANMOL_LIPI,
      constant.GURBANI_AKHAR_TRUE,
      constant.GURBANI_AKHAR_HEAVY_TRUE,
      constant.GURBANI_AKHAR_THICK_TRUE,
      constant.PURATAN_HASTLIKHAT,
      constant.BALOO_PAAJI,
    ]);
  });

  it.each(offered)("%s is a real file in assets/fonts", (font) => {
    expect(exists("assets", "fonts", `${font}.ttf`)).toBe(true);
  });

  // `file:///android_asset/fonts/<name>.ttf` — the WebView reads the packaged
  // asset directly, and that folder is checked in rather than generated.
  it.each(offered)("%s is packaged for Android", (font) => {
    expect(exists("android", "app", "src", "main", "assets", "fonts", `${font}.ttf`)).toBe(true);
  });

  // On iOS the @font-face url is resolved against the app bundle, so the font
  // has to be BOTH registered in UIAppFonts and copied in by the build phase.
  it.each(offered)("%s is registered and bundled on iOS", (font) => {
    expect(plist).toContain(`<string>${font}.ttf</string>`);
    expect(pbxproj).toContain(`${font}.ttf in Resources`);
  });

  it.each(offered)("%s is declared as an @font-face for the reader", (font) => {
    // Declared through the constant, which is what the CSS interpolates, so
    // the font-family the picker writes and the one the WebView defines can
    // never be two different strings.
    const name = Object.keys(constant).find((key) => constant[key] === font);
    expect(readerHtml).toContain(`font-family: '\${constant.${name}}'`);
  });
});

// A legacy-encoded Gurmukhi font is not interchangeable with a Unicode one: the
// reader hands Baloo Paaji the `gurmukhiUni` column and every other font the
// ASCII `gurmukhi` one. A new font filed on the wrong side renders Latin
// letters, which is why the mapping is pinned rather than left implicit.
describe("the Unicode font is the exception", () => {
  it("is Baloo Paaji alone", () => {
    const readerUtils = read("src", "ReaderScreen", "utils", "index.js");
    expect(readerUtils).toContain(
      "fontFace === constant.BALOO_PAAJI ? item.gurmukhiUni : item.gurmukhi"
    );
  });
});
