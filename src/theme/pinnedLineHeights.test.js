/* eslint-env jest */
import fs from "fs";
import path from "path";
import { NATURAL_LINE_BOX } from "./lineHeight";

// Guards the screens that were clipping Gurmukhi and Devanagari on iPhone.
//
// A pinned `lineHeight` below the face's own box is not a portable
// instruction: Android tightens the leading around the glyphs, iOS drops the
// baseline and cuts the ascent off. Every value in the files below sat under
// that box, so each one now goes through `androidLineHeight` — see
// @theme/lineHeight for the mechanism and the measurements.
//
// This reads the source rather than the built styles because several of these
// live in `StyleSheet.create` calls inside components that would drag half the
// app into the test, and because the failure being guarded is textual: someone
// adding a raw `lineHeight: 18` back to one of these screens.

const ROOT = path.join(__dirname, "..");

const GUARDED = [
  "ReaderScreen/components/AudioPlayer/style.js",
  "ManageDownloads/styles.js",
  "SevaScreen/styles.js",
  "SevaScreen/sevaMeansStyles.js",
  "DashboardScreen/components/DashboardHeader.jsx",
  "DashboardScreen/components/DayDetailModal.jsx",
  "DashboardScreen/components/Discover.jsx",
  "DashboardScreen/components/FeatureTilesRow.jsx",
  "DashboardScreen/components/KhalisAppsCarousel.jsx",
  "DashboardScreen/components/MostListenedSection.jsx",
  "DashboardScreen/components/MostReadSection.jsx",
  "DatabaseUpdate/components/styles.jsx",
  "common/components/OnboardingCarousel/style.jsx",
  "common/components/OnboardingCarousel/index.jsx",
];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe.each(GUARDED)("%s", (rel) => {
  const src = read(rel);

  it("routes every pinned line height through androidLineHeight", () => {
    const raw = src
      .split(/\r?\n/)
      .map((line, i) => [i + 1, line])
      .filter(([, line]) => /\blineHeight:/.test(line))
      .filter(([, line]) => !/lineHeight:\s*androidLineHeight\(/.test(line))
      .filter(([, line]) => !/lineHeight:\s*bodyLineHeight\b/.test(line))
      .map(([n, line]) => `${n}: ${line.trim()}`);

    expect(raw).toEqual([]);
  });

  it("imports the helper it uses", () => {
    expect(src).toMatch(/import \{ androidLineHeight \} from "@theme\/lineHeight";/);
  });
});

// The two values the pill's own layout depends on, kept honest against the
// metrics rather than against a remembered number.
describe("the collapsed audio pill", () => {
  const style = read("ReaderScreen/components/AudioPlayer/style.js");

  it("sizes to its content instead of pinning a height", () => {
    // Without a pinned line height the two stacked lines measure
    // 12 * 1.771 + 14 * 1.771 - 1.5 ~= 44.5 on iOS, which a fixed 44 clipped.
    const stack = (12 + 14) * NATURAL_LINE_BOX.baloo - 1.5;
    expect(stack).toBeGreaterThan(44);
    expect(style).toMatch(/minHeight: 44,/);
    expect(style).not.toMatch(/^\s+height: 44,$/m);
  });
});

// The bottom bar pads the bottom inset ONCE, and the platform decides who does
// it. Android keeps the bottom-edge SafeArea padding the whole navigation-bar
// inset — verified on device, and not to be trimmed, since that inset is real
// back/home/recents keys. iOS pads a CAPPED inset itself, because there the
// inset is the home indicator: an overlay, not an obstruction, and padding all
// 34pt of it under a 65pt box that already carries its own room below the row
// left the bar ~99pt tall — the band of nav colour below the icons.
//
// The cap only holds while everything that MEASURES the bar caps it too: the
// Reader lifts its progress track, audio player and autoscroll pill by the bar's
// footprint, and adding the raw inset there would drift them off its top edge by
// whatever the cap trimmed. That pairing is what these guard. The platform split
// itself is exercised in bottomNavInset.test.js.
describe("the bottom navigation bar", () => {
  // Comments stripped: the notes explaining the change name the very code they
  // replaced, and the assertions below are about what still RUNS.
  const strip = (rel) =>
    read(rel)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  const code = strip("common/components/BottomNavigation/index.jsx");
  const reader = strip("ReaderScreen/index.jsx");

  it("still lets the SafeArea pad the whole inset off iOS", () => {
    expect(code).toMatch(/edges=\{capsOwnInset \? \[\] : \["bottom"\]\}/);
  });

  it("adds its own pad only where the SafeArea has stopped padding", () => {
    // Both halves come from the one `capsOwnInset` flag, so the bar can never
    // pad the inset twice or leave it unpadded.
    expect(code).toMatch(/const capsOwnInset = Platform\.OS === "ios"/);
    expect(code).toMatch(/const iosInsetPad = capsOwnInset \? bottomNavInset\(insetBottom\) : 0/);
    expect(code).toMatch(/paddingBottom: iosInsetPad/);
  });

  it("is measured with the same cap it pads", () => {
    const rawInset = reader
      .split(/\r?\n/)
      .map((line, i) => [i + 1, line])
      // The lifts that clear the BAR add the nav height; the ones that clear the
      // SYSTEM bar (the resting `-insetBottom` positions, the ground strip) are
      // about the raw inset and rightly keep it.
      .filter(([, line]) => /bottomNavigation\.height|autoScrollFixedView\.bottom/.test(line))
      .filter(([, line]) => /\binsetBottom\b/.test(line))
      .filter(([, line]) => !/bottomNavInset\(insetBottom\)/.test(line))
      .map(([n, line]) => `${n}: ${line.trim()}`);

    expect(rawInset).toEqual([]);
  });
});
