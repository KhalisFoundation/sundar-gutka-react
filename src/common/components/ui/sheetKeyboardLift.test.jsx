import React from "react";
import { Platform, Text } from "react-native";

import { render, screen } from "@testing-library/react-native";
import lightTheme from "@theme/lightTheme";

import Sheet from "./Sheet";

// With a keyboard up, the sheet's bottom inset means different things on the
// two platforms. iOS reports a keyboard height that already covers the home
// indicator. Android reports it LESS the navigation bar, while the sheet's
// window is drawn under that bar — dropping the inset there sank Cancel and
// Save behind the keyboard by exactly the bar's height.

jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: require("@theme/lightTheme").default }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 48, left: 0, right: 0 }),
}));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
}));
jest.mock("../ScrollIndicator", () => ({
  useCustomScrollbar: () => ({ scrollViewProps: {}, Indicator: null }),
}));

let mockKeyboardHeight = 0;
jest.mock("../../hooks/useKeyboardHeight", () => ({
  __esModule: true,
  default: () => mockKeyboardHeight,
}));

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
  mockKeyboardHeight = 0;
});

/** The sheet panel: the node carrying its max height. */
const panelPaddingBottom = () => {
  const [panel] = screen.UNSAFE_root.findAll(
    (node) => typeof node.type === "string" && node.props.style?.maxHeight !== undefined
  );
  return panel.props.style.paddingBottom;
};

const open = () =>
  render(
    <Sheet visible onClose={() => {}} title="Rename">
      <Text>Body</Text>
    </Sheet>
  );

const { paddingBottom } = lightTheme.layout.sheet;

describe("Sheet bottom inset with a keyboard up", () => {
  it("keeps the navigation bar inset on Android, where the keyboard height leaves it out", () => {
    Platform.OS = "android";
    mockKeyboardHeight = 300;
    open();
    expect(panelPaddingBottom()).toBe(paddingBottom + 48);
  });

  it("drops the home indicator inset on iOS, where the keyboard covers it", () => {
    Platform.OS = "ios";
    mockKeyboardHeight = 300;
    open();
    expect(panelPaddingBottom()).toBe(paddingBottom);
  });

  it("keeps the inset on both when no keyboard is up", () => {
    ["android", "ios"].forEach((os) => {
      Platform.OS = os;
      open();
      expect(panelPaddingBottom()).toBe(paddingBottom + 48);
      screen.unmount();
    });
  });
});
