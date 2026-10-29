import React from "react";

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import lightTheme from "@theme/lightTheme";

import { KEY_PAGES } from "../../gurmukhiKeys";

import GurmukhiKeyboard from "./GurmukhiKeyboard";
import SheetKeyboardSpace from "./sheetKeyboardSpace";

// The keyboard is a PINNED sheet footer: it takes its height before the body
// gets any. So its height is not its own business — it decides whether the
// field you are typing into is on screen at all.
//
// It used to take `layout.touchTarget` per key, which scales at the full OS
// text rate. At the 1.5x cap that is 66pt across seven rows, and the New Pothi
// sheet showed its title above a clipped name field with both buttons gone.
// Raising the text size has to make the GLYPHS bigger, not evict the field.

jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: jest.requireActual("@theme/lightTheme").default }),
}));

/** A tall modern phone at the default text size — the reference case. */
const REFERENCE = { width: 390, height: 844, scale: 3, fontScale: 1 };
let mockWindow = REFERENCE;

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockWindow,
}));

beforeEach(() => {
  mockWindow = REFERENCE;
});

const flat = (style) =>
  (Array.isArray(style) ? style.flat(Infinity) : [style])
    .filter(Boolean)
    .reduce((out, s) => ({ ...out, ...s }), {});

const renderAt = (window, props = {}) => {
  mockWindow = window;
  return render(
    <GurmukhiKeyboard
      value=""
      onChange={() => {}}
      lettersLabel="Letters"
      signsLabel="Matras and signs"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

/** Every key is a button; they all share one height. */
const keyHeight = () => flat(screen.getAllByRole("button")[0].props.style).height;

/** The taller page's rows, plus the switch/space/backspace row. */
const ROW_COUNT = Math.max(...KEY_PAGES.map((page) => page.length)) + 1;

describe("GurmukhiKeyboard", () => {
  it("does not grow when the OS text size does", () => {
    renderAt(REFERENCE);
    const atDefault = keyHeight();
    screen.unmount();
    // The same device, the user having raised text size to the app's cap.
    renderAt({ ...REFERENCE, fontScale: 1.5 });
    expect(keyHeight()).toBe(atDefault);
  });

  it("keeps a real key height on a tall phone", () => {
    renderAt(REFERENCE);
    // There is room here, so nothing is given up: the unscaled touch target.
    expect(keyHeight()).toBe(lightTheme.layout.touchTarget);
  });

  it("gives up height rather than the screen on a short window", () => {
    // Shorter than any supported phone held upright — landscape, or split
    // screen — which is where five rows of full-height keys stop fitting.
    renderAt({ width: 568, height: 400, scale: 2, fontScale: 1 });
    const h = keyHeight();
    expect(h).toBeLessThan(lightTheme.layout.touchTarget);
    // Still a real target: these keys are ~29pt wide already, so 34 tall clears
    // the 24x24 minimum in WCAG 2.5.8 on both axes.
    expect(h).toBeGreaterThanOrEqual(34);
  });

  it("leaves over half the window for the sheet above it, at any text size", () => {
    [1, 1.25, 1.5].forEach((fontScale) => {
      renderAt({ width: 320, height: 568, scale: 2, fontScale });
      // The keys alone — the plate's own padding is on top, which is why the
      // component budgets for it rather than measuring only this.
      expect(keyHeight() * ROW_COUNT).toBeLessThan(568 * 0.5);
      screen.unmount();
    });
  });
});

// Inside a sheet, the keyboard takes only what the sheet has left once its
// title, field, buttons and list are placed — see Sheet.
describe("GurmukhiKeyboard in a sheet", () => {
  const { space } = lightTheme;
  const plateChrome = space.md * 2 + space.lg + 3 * (ROW_COUNT - 1);

  const renderInSheet = (room) =>
    render(
      <SheetKeyboardSpace.Provider value={room}>
        <GurmukhiKeyboard
          value=""
          onChange={() => {}}
          lettersLabel="Letters"
          signsLabel="Matras and signs"
        />
      </SheetKeyboardSpace.Provider>
    );

  it("fits the room the sheet leaves, even on a tall phone", () => {
    renderInSheet(250);
    expect(keyHeight()).toBeLessThan(lightTheme.layout.touchTarget);
    expect(keyHeight() * ROW_COUNT + plateChrome).toBeLessThanOrEqual(250);
  });

  it("keeps the window's share when the sheet has more room than that", () => {
    renderInSheet(5000);
    expect(keyHeight()).toBe(lightTheme.layout.touchTarget);
  });

  it("never shrinks a key below a real target", () => {
    renderInSheet(50);
    expect(keyHeight()).toBe(34);
  });
});

// Two pages, the way a phone keyboard splits letters from symbols. The switch
// works like shift: one character on the second page, then back — or locked by
// a double tap.
describe("GurmukhiKeyboard pages", () => {
  const key = (label) => screen.getByLabelText(label);
  const switchKey = () => screen.getByLabelText(/Matras and signs|Letters/);

  it("opens on the letters, with the matras one tap away", () => {
    renderAt(REFERENCE);
    expect(screen.queryByLabelText("ਕ")).toBeTruthy();
    expect(screen.queryByLabelText("ਾ")).toBeNull();
    expect(switchKey().props.accessibilityLabel).toBe("Matras and signs");
  });

  it("goes back to the letters after one character", () => {
    const onChange = jest.fn();
    renderAt(REFERENCE, { value: "ਕ", onChange });
    fireEvent.press(switchKey());
    expect(switchKey().props.accessibilityLabel).toBe("Letters");
    fireEvent.press(key("ਾ"));
    expect(onChange).toHaveBeenCalledWith("ਕਾ");
    expect(screen.queryByLabelText("ਕ")).toBeTruthy();
  });

  it("stays on the second page once a double tap locks it", () => {
    const now = jest.spyOn(Date, "now");
    renderAt(REFERENCE, { value: "ਕ" });
    now.mockReturnValue(1000);
    fireEvent.press(switchKey());
    now.mockReturnValue(1150);
    fireEvent.press(switchKey());
    fireEvent.press(key("ੰ"));
    expect(screen.queryByLabelText("ਾ")).toBeTruthy();
    // And a single tap unlocks it back to the letters.
    now.mockReturnValue(5000);
    fireEvent.press(switchKey());
    expect(screen.queryByLabelText("ਕ")).toBeTruthy();
    now.mockRestore();
  });

  it("does not use the tap up on backspace", () => {
    const onChange = jest.fn();
    renderAt(REFERENCE, { value: "ਕ", onChange });
    fireEvent.press(switchKey());
    fireEvent.press(key("⌫"));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.queryByLabelText("ਾ")).toBeTruthy();
  });

  // The page with fewer rows spreads them over the same height, so switching
  // never moves the sheet. 3pt is the keyboard's gap between rows.
  it("is the same height on both pages", () => {
    renderAt(REFERENCE, { value: "ਕ" });
    const keysTall = (rows) => keyHeight() * rows + 3 * (rows - 1);
    const letters = keysTall(KEY_PAGES[0].length);
    act(() => fireEvent.press(switchKey()));
    expect(keysTall(KEY_PAGES[1].length)).toBeCloseTo(letters, 5);
  });
});

// A matra on a carrier letter spells a vowel letter, and the keyboard hands back
// that letter — not <ਅ, ਾ>, which fonts draw with a dotted circle.
describe("GurmukhiKeyboard vowel letters", () => {
  it("turns ਅ and ਾ into ਆ", () => {
    const onChange = jest.fn();
    renderAt(REFERENCE, { value: "ਅ", onChange });
    fireEvent.press(screen.getByLabelText("Matras and signs"));
    fireEvent.press(screen.getByLabelText("ਾ"));
    expect(onChange).toHaveBeenCalledWith("ਆ");
  });

  it("dims a matra no vowel letter can take", () => {
    renderAt(REFERENCE, { value: "ਅ" });
    fireEvent.press(screen.getByLabelText("Matras and signs"));
    expect(screen.getByLabelText("ਿ").props.accessibilityState.disabled).toBe(true);
  });
});
