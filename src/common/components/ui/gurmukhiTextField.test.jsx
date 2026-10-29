import React from "react";
import { Keyboard } from "react-native";

import { fireEvent, render, screen } from "@testing-library/react-native";

import { CloseIcon } from "../../icons";

import GurmukhiTextField from "./GurmukhiTextField";

// The Punjabi keyboard switch lives INSIDE the field it types into, and drops
// its label to the bare ਅ when the field is too narrow to keep room for the
// text — a small phone, a long translation, or a raised text size.

jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: require("@theme/lightTheme").default }),
}));

let mockWindow = { width: 390, height: 844, scale: 3, fontScale: 1 };
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));

const onToggle = jest.fn();

const open = (props = {}) =>
  render(
    <GurmukhiTextField
      value=""
      onChange={() => {}}
      accessibilityLabel="Search banis"
      gurmukhiOpen={false}
      receivingKeys={false}
      keyboardToggle={{ label: "Punjabi", accessibilityLabel: "Punjabi keyboard", onToggle }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );

const layout = (node, width) =>
  fireEvent(node, "layout", { nativeEvent: { layout: { width, height: 48, x: 0, y: 0 } } });

// The field is the node reporting the field's width; the measuring copy is the
// hidden one reporting the chip's full width.
const measure = (fieldWidth, chipWidth) => {
  const field = screen.UNSAFE_root.findAll(
    (node) => node.props.onLayout && node.props.accessible === false
  )[0];
  const copy = screen.UNSAFE_root.findAll(
    (node) => node.props.onLayout && node.props.importantForAccessibility === "no-hide-descendants"
  )[0];
  layout(field, fieldWidth);
  layout(copy, chipWidth);
};

// Only the visible switch — the measuring copy is hidden from accessibility.
const visibleSwitch = () => screen.getByRole("switch");

beforeEach(() => {
  onToggle.mockClear();
  mockWindow = { width: 390, height: 844, scale: 3, fontScale: 1 };
});

describe("GurmukhiTextField keyboard switch", () => {
  it("sits in the field and reads its full name aloud", () => {
    open();
    expect(visibleSwitch().props.accessibilityLabel).toBe("Punjabi keyboard");
  });

  it("switches the keyboard from inside the field", () => {
    open();
    fireEvent.press(visibleSwitch());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows its label when a phone-width field has room for it", () => {
    open();
    measure(358, 110);
    expect(screen.queryByText("Punjabi")).toBeTruthy();
  });

  it("drops to ਅ alone when the label would crowd out the text", () => {
    open();
    measure(200, 150);
    // The hidden measuring copy still carries it; the switch on screen does not.
    expect(screen.queryByText("Punjabi")).toBeNull();
  });

  // The same field that fits at normal size must give the label up once the
  // text is set larger, because the room it keeps for typing grows with it.
  it("gives the label up sooner at a large text size", () => {
    mockWindow = { ...mockWindow, fontScale: 1.5 };
    open();
    measure(260, 110);
    expect(screen.queryByText("Punjabi")).toBeNull();
  });

  it("keeps the label until the widths are known, so it never flickers in", () => {
    open();
    expect(screen.queryByText("Punjabi")).toBeTruthy();
  });

  // The X is the way out: shown only while the in-app keys are up, and on the
  // switch itself, so tapping it turns them off.
  it("shows the close icon only while the keyboard is on", () => {
    open();
    expect(screen.UNSAFE_queryAllByType(CloseIcon)).toHaveLength(0);
    screen.unmount();
    open({ gurmukhiOpen: true, receivingKeys: true });
    expect(screen.UNSAFE_queryAllByType(CloseIcon).length).toBeGreaterThan(0);
  });

  it("turns the keyboard off from the switch showing the close icon", () => {
    open({ gurmukhiOpen: true, receivingKeys: true });
    fireEvent.press(visibleSwitch());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("keeps the close icon when the field is too narrow for the label", () => {
    open({ gurmukhiOpen: true, receivingKeys: true });
    measure(200, 150);
    expect(screen.queryByText("Punjabi")).toBeNull();
    const [shown] = screen.UNSAFE_queryAllByType(CloseIcon);
    expect(shown).toBeTruthy();
  });

  // An icon does not follow the OS text size by itself; it has to grow with the
  // letter beside it, up to the same cap text has.
  it("grows the close icon with the text size, up to the cap", () => {
    const sizeAt = (fontScale) => {
      mockWindow = { ...mockWindow, fontScale };
      open({ gurmukhiOpen: true, receivingKeys: true });
      const { size } = screen.UNSAFE_queryAllByType(CloseIcon)[0].props;
      screen.unmount();
      return size;
    };
    expect(sizeAt(1.3)).toBeGreaterThan(sizeAt(1));
    expect(sizeAt(3)).toBe(sizeAt(1.5));
  });

  it("draws no switch where the field was not given one", () => {
    open({ keyboardToggle: null });
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

// The in-app keys and the phone's keyboard are one or the other, never both.
describe("GurmukhiTextField keyboard mutex", () => {
  let show;
  const listeners = [];

  beforeEach(() => {
    listeners.length = 0;
    jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
    jest.spyOn(Keyboard, "isVisible").mockReturnValue(false);
    jest.spyOn(Keyboard, "addListener").mockImplementation((event, callback) => {
      const entry = { event, callback };
      listeners.push(entry);
      return {
        remove: () => listeners.splice(listeners.indexOf(entry), 1),
      };
    });
    show = (height) =>
      [...listeners].forEach(({ callback }) => callback({ endCoordinates: { height } }));
  });

  afterEach(() => jest.restoreAllMocks());

  it("closes the phone's keyboard when the in-app keys turn on", () => {
    Keyboard.isVisible.mockReturnValue(true);
    const { rerender } = open();
    rerender(
      <GurmukhiTextField
        value=""
        onChange={() => {}}
        accessibilityLabel="Search banis"
        gurmukhiOpen
        receivingKeys
        keyboardToggle={{ label: "Punjabi", accessibilityLabel: "Punjabi keyboard", onToggle }}
      />
    );
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  });

  it("leaves a merely focused field alone when no keyboard is up", () => {
    open({ gurmukhiOpen: true, receivingKeys: true });
    expect(Keyboard.dismiss).not.toHaveBeenCalled();
  });

  it("turns the in-app keys off when the phone's keyboard comes up", () => {
    open({ gurmukhiOpen: true, receivingKeys: true });
    show(300);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // A keyboard can announce itself twice before the re-render; a second toggle
  // would switch the in-app keys straight back on.
  it("turns them off once, however often the keyboard announces itself", () => {
    open({ gurmukhiOpen: true, receivingKeys: true });
    show(300);
    show(320);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // iOS: focusing the field swaps in an EMPTY input view and still announces
  // it. That is the in-app keys working, not the phone's keyboard arriving.
  it("ignores a show with no real keyboard behind it", () => {
    open({ gurmukhiOpen: true, receivingKeys: true });
    show(0);
    show(55);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("does not listen while the in-app keys are off", () => {
    open();
    show(300);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

// The native placeholder ignores `fontFamily` on Android, so the field draws its
// own — it has to be in the app's Baloo face, like the label above the field.
describe("GurmukhiTextField placeholder", () => {
  const { flatten } = require("react-native").StyleSheet;
  const { type } = require("@theme/lightTheme").default;

  it("draws the placeholder in Baloo, not through the native hint", () => {
    open({ placeholder: "e.g. Morning Banis" });
    const hint = screen.getByText("e.g. Morning Banis");
    expect(flatten(hint.props.style).fontFamily).toBe(type.body.fontFamily);
    // And nothing asks the native field for a hint of its own on top of it.
    const inputs = screen.UNSAFE_root.findAll((node) => node.type === "TextInput");
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((node) => expect(node.props.placeholder).toBeUndefined());
  });

  it("hides the placeholder once there is a value", () => {
    open({ placeholder: "e.g. Morning Banis", value: "Mine" });
    expect(screen.queryByText("e.g. Morning Banis")).toBeNull();
  });
});
