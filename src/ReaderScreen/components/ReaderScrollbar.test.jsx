/* eslint-env jest */
import React from "react";
import { Animated, StyleSheet } from "react-native";

import { render } from "@testing-library/react-native";
import darkTheme from "@theme/darkTheme";
import lightTheme from "@theme/lightTheme";

import createStyles from "../styles";

import ReaderScrollbar from "./ReaderScrollbar";

// The thumb floats over the bani and must pass UNDER the Reader's chrome. It
// sat at zIndex/elevation 12, above the header and bottom nav (10) and the
// progress track (11), so with the bars up it was drawn across the nav at the
// end of a bani and across the header at the top.

const trackStyle = () => {
  const { toJSON } = render(
    <ReaderScrollbar
      progress={new Animated.Value(0)}
      color="#7A99C9"
      width={4}
      visibleFraction={0.5}
    />
  );
  return StyleSheet.flatten(toJSON().props.style);
};

describe.each([
  ["light", lightTheme],
  ["dark", darkTheme],
])("the scrollbar under the %s theme's chrome", (_, theme) => {
  const styles = createStyles(theme);
  const chrome = [
    styles.animatedView,
    styles.bottomChrome,
    styles.scrollProgressBar,
    styles.autoScrollFixedView,
  ];

  it("stacks below every chrome layer", () => {
    const { zIndex } = trackStyle();
    chrome.forEach((layer) => expect(zIndex).toBeLessThan(layer.zIndex));
  });

  it("takes no Android elevation, which would outrank the header's zIndex", () => {
    // The header's wrapper has no elevation of its own, so any here would lift
    // the thumb over it on Android while iOS kept it underneath.
    expect(styles.animatedView.elevation).toBeUndefined();
    expect(trackStyle().elevation).toBeUndefined();
  });
});
