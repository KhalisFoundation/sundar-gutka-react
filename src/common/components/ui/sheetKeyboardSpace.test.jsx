import React, { useContext } from "react";
import { Text, View } from "react-native";

import { fireEvent, render, screen } from "@testing-library/react-native";
import lightTheme from "@theme/lightTheme";

import Sheet from "./Sheet";
import SheetKeyboardSpace from "./sheetKeyboardSpace";

// At a large display or text size the title, field and buttons of a pothi sheet
// grow, and a keyboard sized only to the window left the list no room and ran
// its last row behind the navigation bar. The sheet now tells the keyboard what
// it has left once everything else — and a list's worth of body — is placed.

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
jest.mock("../ScrollIndicator", () => ({
  useCustomScrollbar: () => ({ scrollViewProps: {}, Indicator: null }),
}));

const { layout, space } = lightTheme;

/** Reads what the sheet hands its keyboard. */
const KeyboardProbe = () => (
  <Text testID="keyboard-space">{String(useContext(SheetKeyboardSpace))}</Text>
);

const open = () =>
  render(
    <Sheet
      visible
      onClose={() => {}}
      title="Add banis"
      header={<View testID="header" />}
      footer={<View testID="footer" />}
      keyboard={<KeyboardProbe />}
    >
      <View testID="list" />
    </Sheet>
  );

const handedSpace = () => Number(screen.getByTestId("keyboard-space").props.children);

/** Lays out the innermost measuring view around `target`. */
const layOut = (target, height) => {
  const holders = screen.UNSAFE_root.findAll(
    (node) =>
      typeof node.props.onLayout === "function" && node.findAll((c) => c === target).length > 0
  );
  fireEvent(holders[holders.length - 1], "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 390, height } },
  });
};

const sizeBody = (height) =>
  fireEvent(
    screen.UNSAFE_root.findAll((node) => node.props.onContentSizeChange)[0],
    "contentSizeChange",
    390,
    height
  );

const placeParts = () => {
  layOut(screen.getByText("Add banis"), 30);
  layOut(screen.getByTestId("header"), 60);
  layOut(screen.getByTestId("footer"), 64);
};

/** The sheet's max height less its padding (no OS keyboard, so the inset counts). */
const INNER =
  844 * layout.sheet.maxHeightRatio - layout.sheet.paddingTop - (layout.sheet.paddingBottom + 12);
const PARTS = 30 + space.sm + (60 + space.sm) + 64;

describe("Sheet keyboard space", () => {
  it("gives the keyboard what the title, header, footer and a list's room leave", () => {
    open();
    placeParts();
    sizeBody(900);
    expect(handedSpace()).toBeCloseTo(INNER - PARTS - layout.sheet.listMinHeight, 5);
  });

  it("keeps no empty band for a body that needs less than a list's room", () => {
    open();
    placeParts();
    sizeBody(20);
    expect(handedSpace()).toBeCloseTo(INNER - PARTS - 20, 5);
  });

  // A search narrowing to one result must not resize the keys mid-word.
  it("does not hand the room back when the list gets shorter", () => {
    open();
    placeParts();
    sizeBody(900);
    sizeBody(20);
    expect(handedSpace()).toBeCloseTo(INNER - PARTS - layout.sheet.listMinHeight, 5);
  });
});
