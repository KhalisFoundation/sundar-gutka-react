import fs from "fs";
import path from "path";

// Two auto-scroll defects reported together, both pinned here at the source
// because rendering the third-party slider under jest would only re-test the
// library.
//
// 1. The speed dot jumped to the far left and back every time the chrome was
//    hidden and shown. The box was hidden with display:none, which lays the
//    slider out at ZERO width; the library stores that as the track length
//    and positions the thumb from it on the next show. The box is hidden by
//    opacity now, so it keeps its width — and since invisible must also mean
//    untouchable and unannounced, the touch and accessibility props go with it.
//
// 2. The speed was kept per bani, so 67% chosen in one bani meant nothing in
//    the next. It is one value now, read from and written to `autoScrollSpeed`.

const component = fs.readFileSync(path.join(__dirname, "autoScrollComponent.jsx"), "utf8");
const reader = fs.readFileSync(path.join(__dirname, "..", "index.jsx"), "utf8");

// Comments stripped, so the note explaining the display:none trap cannot itself
// trip the assertion that display is no longer used.
const stripComments = (src) => src.replace(/^\s*\/\/.*$/gm, "");
const wrapper = stripComments(
  reader.slice(
    reader.indexOf('testID="auto-scroll-bar-wrapper"'),
    reader.indexOf("<AutoScrollComponent")
  )
);

describe("the auto-scroll box keeps its width while hidden", () => {
  it("is hidden by opacity, never by display", () => {
    expect(wrapper).toMatch(/opacity: isHeader \? 1 : 0/);
    expect(wrapper).not.toMatch(/display:/);
  });

  it("cannot be touched while invisible", () => {
    expect(wrapper).toMatch(/pointerEvents=\{isHeader \? "auto" : "none"\}/);
  });

  it("is hidden from screen readers on both platforms while invisible", () => {
    expect(wrapper).toMatch(/accessibilityElementsHidden=\{!isHeader\}/);
    expect(wrapper).toMatch(
      /importantForAccessibility=\{isHeader \? "auto" : "no-hide-descendants"\}/
    );
  });
});

describe("the auto-scroll speed is shared by every bani", () => {
  it("reads the single speed", () => {
    expect(component).toMatch(/useSelector\(\(state\) => state\.autoScrollSpeed\)/);
  });

  it("writes the single speed, with no bani attached", () => {
    expect(component).toMatch(/actions\.setAutoScrollSpeed\(val\)/);
    expect(component).not.toMatch(/setAutoScrollSpeed\(val, /);
  });

  it("still carries an existing install's per-bani choice forward", () => {
    // Nothing writes the old map any more, but a phone that has one must not
    // drop back to the default on the day it updates.
    expect(component).toMatch(/legacySpeeds\[shabadID\]/);
    expect(component).toMatch(/constant\.DEFAULT_SPEED/);
  });
});
