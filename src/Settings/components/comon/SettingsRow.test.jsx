import React from "react";

import { fireEvent, render, screen } from "@testing-library/react-native";
import darkTheme from "@theme/darkTheme";
import lightTheme from "@theme/lightTheme";
import { resolveTokens } from "@theme/scale";

import SettingsRow, { SettingsSection, SettingsToggleRow } from "./SettingsRow";

// Settings is the densest list in the app, so its row is the component most
// worth pinning down. These cover what the three old row shapes got wrong.

let mockTheme = lightTheme;
const REFERENCE = { width: 390, height: 844, scale: 3, fontScale: 1 };
let mockWindow = REFERENCE;

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));

jest.mock("../../../common/context/ThemeContext", () => ({
  useTheme: () => ({ theme: mockTheme }),
}));

// The shared icons mock in setupTests renders every icon as null, which is fine
// for screens but leaves nothing to assert on here.
jest.mock("@common/icons", () => {
  const React2 = require("react");
  const RN = require("react-native");
  return {
    ChevronRight: () => React2.createElement(RN.View, { testID: "chevron-right" }),
  };
});

const flat = (style) =>
  (Array.isArray(style) ? style.flat(Infinity) : [style])
    .filter(Boolean)
    .reduce((out, s) => ({ ...out, ...s }), {});

const tokensFor = (theme) =>
  resolveTokens({
    space: theme.space,
    layout: theme.layout,
    width: mockWindow.width,
    fontScale: mockWindow.fontScale,
  });

const withTheme = (theme, ui) => {
  mockTheme = theme;
  return render(ui);
};

const themes = [
  ["light", lightTheme],
  ["dark", darkTheme],
];

/** A realistic long Punjabi setting label. */
const LONG_TITLE = "ਆਟੋਮੈਟਿਕ ਡਾਊਨਲੋਡ ਸਟ੍ਰੀਮਿੰਗ ਦੌਰਾਨ ਚਾਲੂ ਕਰੋ";
const LONG_VALUE = "ਗੁਰਬਾਣੀ ਅਖਰ ਹੈਵੀ ਟਰੂ";

beforeEach(() => {
  mockWindow = REFERENCE;
  mockTheme = lightTheme;
});

describe("SettingsRow", () => {
  it.each(themes)("[%s] is one height for every row", (_name, theme) => {
    withTheme(theme, <SettingsRow testID="r" title="Language" onPress={() => {}} />);
    const { layout } = tokensFor(theme);
    expect(flat(screen.getByTestId("r").props.style).minHeight).toBe(layout.row.minHeight);
  });

  it("shows its value at a single size, never auto-shrunk", () => {
    withTheme(lightTheme, <SettingsRow title="Bani Font" value={LONG_VALUE} onPress={() => {}} />);
    const value = screen.getByText(LONG_VALUE);
    // The old row used adjustsFontSizeToFit + minimumFontScale 0.65, so each
    // value rendered at a different size down the column.
    expect(value.props.adjustsFontSizeToFit).toBeFalsy();
    expect(value.props.numberOfLines).toBeUndefined();
  });

  it("lets a long title make the row taller rather than clipping it", () => {
    withTheme(lightTheme, <SettingsRow testID="r" title={LONG_TITLE} subtitle={LONG_TITLE} />);
    const s = flat(screen.getByTestId("r").props.style);
    expect(s.height).toBeUndefined();
    expect(s.minHeight).toBe(lightTheme.layout.row.minHeightTwoLine);
  });

  it("grows with the OS text-size setting on a small phone", () => {
    mockWindow = { width: 320, height: 568, scale: 2, fontScale: 1.5 };
    render(<SettingsRow testID="r" title="Language" />);
    expect(flat(screen.getByTestId("r").props.style).minHeight).toBe(
      Math.round(lightTheme.layout.row.minHeight * 1.5)
    );
  });

  it("announces itself only when it does something", () => {
    withTheme(lightTheme, <SettingsRow testID="a" title="App Version" />);
    expect(screen.getByTestId("a").props.accessibilityRole).toBeUndefined();

    withTheme(lightTheme, <SettingsRow testID="b" title="Language" onPress={() => {}} />);
    expect(screen.getByTestId("b").props.accessibilityRole).toBe("button");
  });

  it("shows a chevron for navigation but not when it carries a control", () => {
    const { unmount } = withTheme(
      lightTheme,
      <SettingsRow testID="r" title="About" onPress={() => {}} />
    );
    expect(screen.getByTestId("chevron-right")).toBeTruthy();
    unmount();

    withTheme(
      lightTheme,
      <SettingsRow testID="r2" title="Keep Awake" onPress={() => {}} showChevron={false} />
    );
    expect(screen.queryByTestId("chevron-right")).toBeNull();
  });
});

describe("SettingsToggleRow", () => {
  it("toggles when the row is tapped, not just the switch", () => {
    const onValueChange = jest.fn();
    withTheme(
      lightTheme,
      <SettingsToggleRow
        testID="t"
        title="Keep Awake"
        value={false}
        onValueChange={onValueChange}
      />
    );
    fireEvent.press(screen.getByTestId("t"));
    // A 50pt switch at the screen edge is a small target; every platform's own
    // settings let you tap the whole row.
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("does not fire when disabled", () => {
    const onValueChange = jest.fn();
    withTheme(
      lightTheme,
      <SettingsToggleRow
        testID="t"
        title="Keep Awake"
        value={false}
        onValueChange={onValueChange}
        disabled
      />
    );
    fireEvent.press(screen.getByTestId("t"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each(themes)("[%s] reports its state to a screen reader", (_name, theme) => {
    withTheme(theme, <SettingsToggleRow title="Keep Awake" value onValueChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw.props.accessibilityState.checked).toBe(true);
  });
});

describe("SettingsSection", () => {
  it.each(themes)("[%s] is a header for assistive tech", (_name, theme) => {
    withTheme(theme, <SettingsSection title="Display Options" />);
    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByText("Display Options")).toBeTruthy();
  });
});
