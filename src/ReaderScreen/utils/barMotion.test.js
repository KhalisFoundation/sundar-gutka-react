import fs from "fs";
import path from "path";
import { BAR_HIDE, BAR_SHOW, barMotion } from "./barMotion";

// The header and the bottom nav used to run on two clocks (500ms and 300ms,
// both the default ease-in-out), so every show and hide pulled them apart.

describe("bar motion", () => {
  it("picks the entry for showing and the exit for hiding", () => {
    expect(barMotion(true)).toBe(BAR_SHOW);
    expect(barMotion(false)).toBe(BAR_HIDE);
  });

  it("gets out of the way faster than it comes back", () => {
    expect(BAR_HIDE.duration).toBeLessThan(BAR_SHOW.duration);
  });

  it("enters decelerating — most of the travel in the first half", () => {
    expect(BAR_SHOW.easing(0.5)).toBeGreaterThan(0.7);
  });

  it("exits accelerating — little of the travel in the first half", () => {
    expect(BAR_HIDE.easing(0.5)).toBeLessThan(0.35);
  });

  it("lands exactly on both ends", () => {
    [BAR_SHOW, BAR_HIDE].forEach(({ easing }) => {
      expect(easing(0)).toBeCloseTo(0);
      expect(easing(1)).toBeCloseTo(1);
    });
  });
});

describe("every bar moves on the one clock", () => {
  // Asserted against the source: the header and the nav's layers are native-
  // driven animations started from layout effects, which a jest render does
  // not run on a real clock.
  const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

  it.each(["index.jsx", "components/header.jsx"])("%s takes its timing from barMotion", (file) => {
    const source = read(file);
    expect(source).toMatch(/barMotion\(isHeader\)/);
    // The progress fill's instant `duration: 0` set is not a bar tween.
    expect(source).not.toMatch(/duration:\s*[1-9]/);
  });
});
