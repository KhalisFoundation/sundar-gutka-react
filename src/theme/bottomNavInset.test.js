/* eslint-env jest */
import { Platform } from "react-native";
import components, { bottomNavInset } from "./components";

// The bottom nav bar stood ~99pt tall on iPhone against a system tab bar's 83,
// leaving a band of nav colour below the icons. The cap that fixes it is iOS
// ONLY, and these exist mostly to keep it that way.
//
// The two platforms' bottom insets are different kinds of thing. iOS's is the
// home indicator — a thin overlay that content may sit under, which is why
// Apple's own tab bar extends beneath it. Android's is the navigation bar, and
// this app is edge-to-edge with that bar on screen, so the inset is 48dp of real
// back/home/recents keys on three-button navigation. Capping there would slide
// the tab row under the system buttons: the bar would look tidier and two of its
// four tabs would stop being reachable.

const setPlatform = (os) => {
  Platform.OS = os;
};

afterEach(() => setPlatform("ios"));

describe("bottomNavInset", () => {
  it("caps the home indicator on iOS", () => {
    setPlatform("ios");
    expect(bottomNavInset(34)).toBe(components.bottomNavigation.maxInsetIOS); // portrait
    expect(bottomNavInset(21)).toBe(components.bottomNavigation.maxInsetIOS); // landscape
  });

  it("does not pad an iOS inset UP to the cap", () => {
    setPlatform("ios");
    // The cap is a ceiling, not a height — the older Touch ID iPhones have no
    // indicator and must still get no pad at all.
    expect(bottomNavInset(0)).toBe(0);
    expect(bottomNavInset(6)).toBe(6);
  });

  it("hands Android back its whole navigation-bar inset, cap or no cap", () => {
    setPlatform("android");
    expect(bottomNavInset(48)).toBe(48); // three-button navigation
    expect(bottomNavInset(24)).toBe(24); // gesture pill
    expect(bottomNavInset(0)).toBe(0); // no bar drawn
  });

  it("treats a missing inset as none on both platforms", () => {
    setPlatform("ios");
    expect(bottomNavInset()).toBe(0);
    setPlatform("android");
    expect(bottomNavInset()).toBe(0);
  });
});

describe("the cap itself", () => {
  // The tallest thing the bar's row holds: the 48pt active pill inside an
  // iconContainer that pads 4pt above and below it.
  const ROW = 48 + 4 * 2;

  it("still clears the home indicator once the bar's own room is counted", () => {
    // The cap is not the whole gap. The row is centred in the 65pt box, so it
    // already floats half the leftover above the pad, and the labels sit 4pt
    // higher still inside the iconContainer.
    const { height, maxInsetIOS } = components.bottomNavigation;
    const belowRow = maxInsetIOS + (height - ROW) / 2;

    // The indicator occupies roughly the bottom 13pt of the screen.
    expect(belowRow).toBeGreaterThan(13);
  });

  it("trims the inset rather than matching it", () => {
    // At or above 34 it would be capping nothing on a home-indicator iPhone.
    expect(components.bottomNavigation.maxInsetIOS).toBeLessThan(34);
  });

  it("does not out-measure the room above the row, which is what looked lopsided", () => {
    // ~28pt under the labels against 8.5pt over the icons is what reads as a
    // band of colour below the icons rather than a bar with even margins.
    const { height, maxInsetIOS } = components.bottomNavigation;
    const aboveRow = (height - ROW) / 2;
    const belowLabels = maxInsetIOS + aboveRow + 4;

    expect(belowLabels).toBeLessThan(aboveRow + 4 + 15);
  });
});
