import fs from "fs";
import path from "path";

import React from "react";
import { Modal, Platform, Text } from "react-native";

import { act, render, screen } from "@testing-library/react-native";

import { isLegacyScreen } from "../../test-utils/legacyScreens";

import Sheet from "./Sheet";

// Every sheet slides up to open and back down to close, whichever way it is
// closed — a tap outside, back, Cancel or a drag. The Settings chooser used to
// fade its whole window instead, so closing it read as a fade rather than the
// reverse of opening.

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

const sheet = (variant, visible) => (
  <Sheet visible={visible} onClose={() => {}} title="Language" variant={variant}>
    <Text>Body</Text>
  </Sheet>
);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe.each(["floating", "flush"])("a %s sheet", (variant) => {
  it("drives its own slide rather than the window's animation", () => {
    render(sheet(variant, true));
    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.animationType).toBe("none");
    expect(modal.props.onShow).toEqual(expect.any(Function));
  });

  it("stays on screen while it slides down, and goes once it has", () => {
    render(sheet(variant, true));
    // Open, the way the device does: the slide up starts when the Modal shows.
    act(() => screen.UNSAFE_getByType(Modal).props.onShow());
    act(() => jest.runAllTimers());

    screen.rerender(sheet(variant, false));
    expect(screen.getByText("Body")).toBeTruthy();

    act(() => jest.runAllTimers());
    expect(screen.queryByText("Body")).toBeNull();
  });
});

// iOS delivers a Modal's `onDismiss` through a listener the Modal drops as it
// unmounts, and the native dismissal lands after that. A sheet that left the
// tree once its slide ended never told its caller it was gone — so the delete
// pothi confirm, which waits for exactly that, never appeared on iOS.
describe("closing on iOS", () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  const dismissable = (visible, onDismiss) => (
    <Sheet visible={visible} onClose={() => {}} onDismiss={onDismiss} title="Pothi">
      <Text>Body</Text>
    </Sheet>
  );

  it("keeps the window, hidden, until it reports itself gone", () => {
    Platform.OS = "ios";
    const onDismiss = jest.fn();
    render(dismissable(true, onDismiss));
    act(() => screen.UNSAFE_getByType(Modal).props.onShow());
    act(() => jest.runAllTimers());

    screen.rerender(dismissable(false, onDismiss));
    act(() => jest.runAllTimers());
    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(false);
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => modal.props.onDismiss());
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.UNSAFE_queryByType(Modal)).toBeNull();
  });

  it("is not held on Android, which has no dismissal to wait for", () => {
    Platform.OS = "android";
    render(dismissable(true, jest.fn()));
    act(() => screen.UNSAFE_getByType(Modal).props.onShow());
    act(() => jest.runAllTimers());

    screen.rerender(dismissable(false, jest.fn()));
    act(() => jest.runAllTimers());
    expect(screen.UNSAFE_queryByType(Modal)).toBeNull();
  });
});

// A sheet removed from the tree the moment it closes never gets to slide down:
// its window simply disappears. That is what left Font Size, Bani Font,
// Language and five other Settings choosers fading while Transliteration slid.
// A sheet is always rendered and opened and closed by its own `visible`.
describe("every sheet in the app", () => {
  const SRC = path.join(__dirname, "../../..");
  const sourceFiles = () => {
    const out = [];
    const walk = (dir) => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) {
          const rel = path.relative(SRC, full);
          if (!isLegacyScreen(rel)) out.push({ rel, text: fs.readFileSync(full, "utf8") });
        }
      });
    };
    walk(SRC);
    return out;
  };

  it("stays rendered when closed, so it can slide away", () => {
    const gated = sourceFiles()
      .filter(({ text }) => /\w+\s*&&\s*\(?\s*<(BottomSheetComponent|\w*Sheet)\b/.test(text))
      .map(({ rel }) => rel);
    expect(gated).toEqual([]);
  });
});
