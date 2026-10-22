import React from "react";
import { Text, View } from "react-native";

import { render, screen } from "@testing-library/react-native";

import Sheet from "./Sheet";

// A sheet's body is where its content scrolls — the pothi pickers have no
// scroller of their own — so the sheet has to draw the app's one scrollbar
// itself. It used to render a bare ScrollView, and every sheet showed the plain
// native bar while the screens behind it followed the theme.

jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: require("@theme/lightTheme").default }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }),
}));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
}));

// What the shared hook hands back: a thumb and the props that drive it when it
// draws (iOS, or a designed theme), nothing when the native bar stands.
let mockDraws = true;
jest.mock("../ScrollIndicator", () => {
  const { View: MockView } = require("react-native");
  return {
    useCustomScrollbar: () =>
      mockDraws
        ? {
            scrollViewProps: { onScroll: () => {}, showsVerticalScrollIndicator: false },
            Indicator: <MockView testID="themed-thumb" />,
          }
        : { scrollViewProps: {}, Indicator: null },
  };
});

const open = (props = {}) =>
  render(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Sheet visible onClose={() => {}} title="Add banis" {...props}>
      <View>
        <Text>Row</Text>
      </View>
    </Sheet>
  );

beforeEach(() => {
  mockDraws = true;
});

describe("Sheet scrollbar", () => {
  it("draws the app's shared thumb over its scrolling body", () => {
    open();
    expect(screen.getByTestId("themed-thumb")).toBeTruthy();
  });

  it("hides the native bar while it draws its own", () => {
    const { UNSAFE_root: root } = open();
    const scrollers = root.findAll((node) => node.props.onScroll !== undefined);
    expect(scrollers.some((node) => node.props.showsVerticalScrollIndicator === false)).toBe(true);
  });

  // Android under Light or Dark: the hook hands back nothing and the native
  // bar is already the app's colour, so nothing extra is drawn.
  it("adds nothing when the native bar is the right one", () => {
    mockDraws = false;
    open();
    expect(screen.queryByTestId("themed-thumb")).toBeNull();
  });

  it("draws no thumb on a sheet that does not scroll", () => {
    open({ scrollable: false });
    expect(screen.queryByTestId("themed-thumb")).toBeNull();
  });
});
