import fs from "fs";
import path from "path";

// Choosing banis happens in two places — the second step of creating a pothi,
// and Add Banis on one that already exists — and for a while they were two
// implementations of the same screen. Every defect in the copy (the list too
// short, no Cancel/Done, the list running under them, no count) had to be found
// and fixed twice, and each was only ever fixed once.
//
// These are source-level guards rather than render tests on purpose: the thing
// being protected is that there is ONE implementation, which is a fact about the
// files, not about any single render.

const HERE = __dirname;

const read = (name) => fs.readFileSync(path.join(HERE, name), "utf8");

describe("the bani picker has one implementation", () => {
  it("is rendered by both sheets that offer it", () => {
    expect(read("CreatePothiSheet.jsx")).toContain("<PickBanisStep");
    expect(read("AddBanisSheet.jsx")).toContain("<PickBanisStep");
  });

  it("left no second copy behind", () => {
    // PickBanisField was the collapsible version of this, and its collapsed
    // state became unreachable once the picker was always a whole step.
    expect(fs.existsSync(path.join(HERE, "PickBanisField.jsx"))).toBe(false);
  });

  it("keeps the list, the search field and the actions out of its callers", () => {
    // The parts that drifted. A caller that grows its own is building the
    // second copy again, whatever it is called this time.
    ["CreatePothiSheet.jsx", "AddBanisSheet.jsx"].forEach((file) => {
      const text = read(file);
      expect(text).not.toContain("BaniPickRow");
      expect(text).not.toContain("GurmukhiTextField");
      expect(text).not.toContain("maxHeight");
    });
  });

  it("does not size the pick list at all, and does not scroll it either", () => {
    // It used to cap the list at a share of the window. Two things were wrong
    // with that and the in-app keyboard made both unbearable: the cap was
    // measured against the FULL window, so with the keys up it went on claiming
    // height that no longer existed and pushed the search field and both
    // buttons off a sheet with no way to scroll down to them; and a scroller
    // nested inside the sheet's own meant the two fought for every drag.
    //
    // The list is plain rows now and the host Sheet is the single scroller, so
    // the column is simply as tall as it is and everything stays reachable at
    // any text size. A `maxHeight` or a second ScrollView here would be the
    // old design coming back.
    const text = read("PickBanisStep.jsx");
    expect(text).not.toMatch(/maxHeight:/);
    expect(text).not.toMatch(/<ScrollView/);
  });

  it("is scrolled by both of its sheets, so nothing in it can be stranded", () => {
    // `scrollable={false}` on either host is what stranded the actions.
    ["CreatePothiSheet.jsx", "AddBanisSheet.jsx"].forEach((file) => {
      expect(read(file)).not.toMatch(/scrollable=\{(false|step === 1)\}/);
    });
  });
});

// Cancel and Confirm are labelled buttons FIXED at the bottom of the sheet, and
// the search is FIXED at the top; only the list scrolls between them.
//
// They were a cross and an icon in the title row, which older readers could
// not read as Cancel, Next, Create or Save. And under the list, where they were
// before that, they sat behind every bani. Fixed in the sheet's footer, neither
// the list nor a keyboard can put them out of reach.
//
// What the buttons DO is covered by rendering them, in pothiComponents.test.jsx.
// These hold the arrangement: one implementation, placed the same way by both
// sheets, and never inside the scrolling list.
describe("the picker's actions and search are fixed around its list", () => {
  const step = read("PickBanisStep.jsx");
  const CALLERS = ["CreatePothiSheet.jsx", "AddBanisSheet.jsx"];

  it("keeps them out of the scrolling list", () => {
    // A Button in the picker is an action row coming back into the body.
    expect(step).not.toMatch(/<Button/);
  });

  it("is placed by both sheets in the fixed footer, from the one implementation", () => {
    CALLERS.forEach((file) => {
      const text = read(file);
      expect(text).toMatch(/footer=\{\s*<SheetActions/);
      expect(text).not.toMatch(/actions=[{]/);
    });
  });

  it("fixes the search above the list in both sheets", () => {
    CALLERS.forEach((file) => {
      expect(read(file)).toMatch(/header=\{[\s\S]*<PickBanisStep\.Search/);
    });
  });

  it("asks before discarding, in both sheets", () => {
    // Cancel throws away a name and every bani ticked since the sheet opened,
    // which is worth one question. The wording is localised, not built here.
    CALLERS.forEach((file) => {
      const text = read(file);
      expect(text).toContain("showConfirm({");
      expect(text).toMatch(/STRINGS[.]POTHI_DISCARD_(NEW|EDITS)_CONFIRM/);
      expect(text).toContain("STRINGS.POTHI_KEEP_EDITING");
    });
  });

  it("hosts that question inside the sheet, which stays open behind it", () => {
    // See modalHosts.test.js: on iOS the app-root host cannot present over a
    // sheet it is already presenting, so the sheet has to present it itself.
    CALLERS.forEach((file) => {
      expect(read(file)).toContain("<ConfirmDialogHost />");
    });
  });

  it("puts back what Add Banis opened with, since its ticks already applied", () => {
    // Every row there writes straight to the store, so cancelling has to undo
    // rather than merely close, or the question would be a lie.
    const text = read("AddBanisSheet.jsx");
    expect(text).toContain("openedWith");
    expect(text).toMatch(/setBanis[(]pothi, openedWith/);
  });
});
