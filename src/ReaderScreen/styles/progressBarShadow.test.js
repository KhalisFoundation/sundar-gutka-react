/* eslint-env jest */
import { Platform } from "react-native";
import darkTheme from "@theme/darkTheme";
import lightTheme from "@theme/lightTheme";
import createStyles from "./index";

// The reading-progress track sets `elevation: 11` for STACKING — the nav overlay
// beneath it is at 10, and on Android elevation is what orders siblings.
//
// But elevation does two jobs there, and this view has a background, so it also
// cast a real material shadow. With the app's own bars hidden the track rests
// just above the system bar, and that shadow landed on the navigation buttons as
// a dark gradient behind them.
//
// Dark mode never showed it: `elevation.card` is the zeroed preset there, so the
// shadow colour was already transparent. Only light mode handed Android a black
// one to draw, which is why the light theme is the one that matters below.

const setPlatform = (os) => {
  Platform.OS = os;
};

afterEach(() => setPlatform("ios"));

describe("the reading-progress track", () => {
  it("draws no Android shadow in light mode, where the preset supplies a black one", () => {
    setPlatform("android");

    expect(lightTheme.elevation.card.shadowColor).toBe("#000000");
    expect(createStyles(lightTheme).scrollProgressBar.shadowColor).toBe("transparent");
  });

  it("keeps the elevation that orders it above the nav overlay", () => {
    setPlatform("android");
    const styles = createStyles(lightTheme);

    // Killing the shadow must not cost the stacking.
    expect(styles.scrollProgressBar.elevation).toBe(11);
    expect(styles.scrollProgressBar.elevation).toBeGreaterThan(styles.bottomChrome.elevation);
  });

  it("leaves the iOS shadow alone, which is the half elevation never drew there", () => {
    setPlatform("ios");
    const { scrollProgressBar } = createStyles(lightTheme);

    expect(scrollProgressBar.shadowColor).toBe(lightTheme.elevation.card.shadowColor);
    expect(scrollProgressBar.shadowOpacity).toBe(lightTheme.elevation.card.shadowOpacity);
  });

  it("was already shadowless in dark mode on both platforms", () => {
    ["ios", "android"].forEach((os) => {
      setPlatform(os);
      expect(createStyles(darkTheme).scrollProgressBar.shadowColor).toBe("transparent");
    });
  });
});
