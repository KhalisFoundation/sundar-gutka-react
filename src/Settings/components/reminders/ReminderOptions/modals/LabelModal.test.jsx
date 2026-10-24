/* eslint-env jest */
import React from "react";
import { TextInput } from "react-native";

import { fireEvent, render } from "@testing-library/react-native";

import LabelModal, { MAX_TITLE_LENGTH, cleanTitle } from "./LabelModal";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) =>
    fn({
      reminderBanis: JSON.stringify([{ key: 2, title: "Time for japji", time: "3:30 AM" }]),
      isReminders: true,
      reminderSound: "default",
    }),
}));
jest.mock("@common/actions", () => ({ setReminderBanis: (list) => ({ type: "SET", list }) }));
jest.mock("@common/components/ui/Overlay", () => {
  const { View } = require("react-native");
  return ({ children }) => <View>{children}</View>;
});
jest.mock("@common/hooks/useTokens", () => () => ({
  c: {
    accent: "#2B5FD9",
    scrim: "#00000080",
    surfaceElevated: "#101820",
    surface: "#0B1220",
    textPrimary: "#F3F4F6",
    textDisabled: "#6B7280",
    borderStrong: "#374151",
  },
  space: { sm: 8, md: 12 },
  layout: {
    touchTarget: 44,
    borderWidth: { hairline: 1 },
    dialog: { marginHorizontal: 24, maxWidth: 400, padding: 20, gap: 16 },
  },
  radii: { sm: 8, xl: 24 },
  elevation: { overlay: {} },
}));
jest.mock("@common", () => ({
  logError: jest.fn(),
  scheduleReminders: jest.fn(() => Promise.resolve()),
  STRINGS: { notification_text: "Notification Text", cancel: "Cancel", ok: "OK" },
}));
jest.mock("../../../../../common/components/ui", () => {
  const { Text: RNText, Pressable } = require("react-native");
  return {
    Text: ({ children }) => <RNText>{children}</RNText>,
    Button: ({ title, onPress, disabled }) => (
      <Pressable
        testID={`button-${title}`}
        onPress={onPress}
        disabled={disabled}
        accessibilityState={{ disabled }}
      >
        <RNText>{title}</RNText>
      </Pressable>
    ),
  };
});

beforeEach(() => mockDispatch.mockClear());

describe("saving a title", () => {
  it("stores the new title and marks it as the user's own", () => {
    const { getByText } = render(
      <LabelModal section={{ key: 2, title: "Time for japji" }} onHide={jest.fn()} />
    );
    // Nothing typed: OK saves the field as it stands, which still counts as a
    // deliberate title.
    fireEvent.press(getByText("OK"));
    const saved = JSON.parse(mockDispatch.mock.calls[0][0].list);
    expect(saved[0]).toMatchObject({ key: 2, title: "Time for japji", titleCustom: true });
  });
});

// The field used to take anything: a cleared box saved as "" and fired a
// notification with no title, a pasted paragraph was stored whole and cut off
// by the notification, and line breaks survived a single-line field.
describe("input validation", () => {
  it("caps the field at the length a notification title can show", () => {
    const screen = render(
      <LabelModal section={{ key: 2, title: "Time for japji" }} onHide={jest.fn()} />
    );
    expect(screen.UNSAFE_getByType(TextInput).props.maxLength).toBe(MAX_TITLE_LENGTH);
  });

  it("keeps OK dead while the title would be empty, and saves nothing on submit", () => {
    const onHide = jest.fn();
    const screen = render(
      <LabelModal section={{ key: 2, title: "Time for japji" }} onHide={onHide} />
    );
    const input = screen.UNSAFE_getByType(TextInput);
    fireEvent.changeText(input, "   ");
    expect(screen.getByTestId("button-OK").props.accessibilityState).toEqual({ disabled: true });
    fireEvent(input, "submitEditing");
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onHide).not.toHaveBeenCalled();
  });

  it("stores the title cleaned: trimmed, with runs of whitespace and line breaks as one space", () => {
    const screen = render(
      <LabelModal section={{ key: 2, title: "Time for japji" }} onHide={jest.fn()} />
    );
    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "  Wake\n\nup   for  japji \t");
    fireEvent.press(screen.getByText("OK"));
    const saved = JSON.parse(mockDispatch.mock.calls[0][0].list);
    expect(saved[0].title).toBe("Wake up for japji");
  });

  it("cleanTitle is what both the save and the OK gate read", () => {
    expect(cleanTitle("   ")).toBe("");
    expect(cleanTitle(null)).toBe("");
    expect(cleanTitle("a".repeat(100))).toHaveLength(MAX_TITLE_LENGTH);
  });
});

describe("the notification-text field", () => {
  it("keeps the selected title readable — a translucent highlight, not an opaque block", () => {
    const screen = render(
      <LabelModal section={{ key: 2, title: "Time for japji" }} onHide={jest.fn()} />
    );
    const input = screen.UNSAFE_getByType(TextInput);
    // Selected on open so a replacement can be typed straight away…
    expect(input.props.selectTextOnFocus).toBe(true);
    // …and the highlight lets the text through. Opaque accent hid it entirely.
    expect(input.props.selectionColor).toMatch(/^rgba\(.*,0\.35\)$/);
    expect(input.props.style.color).toBe("#F3F4F6");
  });
});
