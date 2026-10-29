/* eslint-env jest */
import React from "react";

import { act, fireEvent, render } from "@testing-library/react-native";

import ConfirmDialogHost, { showConfirm } from "./index";

// A dialog can leave the screen without this host hearing about it.
//
// Android 16 dispatches no back key to a Modal, so React Native's
// `onRequestClose` never fires: the system takes the window down while the host
// still holds the options and believes a dialog is showing. The next
// `showConfirm` then only swapped those options, React Native saw a Modal it
// already considered visible, and nothing appeared — which is how the pothi
// sheet's Delete came to do nothing at all after a back gesture.
//
// Every request now mounts its own window, so a request always produces a
// dialog whatever became of the one before it.

jest.mock("@theme/reader", () => ({
  useReaderScopedTheme: () => ({
    theme: {
      c: {
        surfaceElevated: "#fff",
        scrim: "#0008",
        textPrimary: "#000",
        textSecondary: "#555",
        primary: "#00f",
        onPrimary: "#fff",
        accent: "#06c",
        error: "#c00",
        onError: "#fff",
        border: "#ccc",
      },
      space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
      radii: { md: 8, lg: 12, pill: 999 },
      type: { subheading: {}, body: {}, label: {} },
      layout: { hitSlop: 8, screenGutter: 16 },
    },
  }),
}));

jest.mock("@common/readerFocus", () => ({ useReaderFocused: () => false }));

// Counts how many windows were mounted: one per request is the whole point.
const mockMounted = jest.fn();
jest.mock("@common/components/ui/Overlay", () => {
  const { View } = require("react-native");
  const { useEffect } = require("react");
  const MockOverlay = ({ children }) => {
    useEffect(() => {
      mockMounted();
    }, []);
    return <View testID="overlay">{children}</View>;
  };
  return { __esModule: true, default: MockOverlay, NEST_OVERLAYS_IN_SHEET: false };
});

const ask = (title) => ({ title, confirmText: "Delete", cancelText: "Cancel" });

beforeEach(() => mockMounted.mockClear());

describe("a dialog that was taken off screen without telling the host", () => {
  it("mounts a fresh window for every request", () => {
    const root = render(<ConfirmDialogHost />);

    act(() => showConfirm(ask("Delete Nitnem pothi?")));
    expect(mockMounted).toHaveBeenCalledTimes(1);

    // The system dismissed the first one; the host was never told, so its state
    // still says a dialog is up. Asking again has to produce a window anyway.
    act(() => showConfirm(ask("Delete Sukhmani pothi?")));

    expect(mockMounted).toHaveBeenCalledTimes(2);
    expect(root.queryByText("Delete Sukhmani pothi?")).toBeTruthy();
    expect(root.queryByText("Delete Nitnem pothi?")).toBeNull();
  });

  it("still closes on a choice, and re-opens after", () => {
    const root = render(<ConfirmDialogHost />);

    act(() => showConfirm(ask("Delete Nitnem pothi?")));
    fireEvent.press(root.getByText("Cancel"));
    expect(root.queryByText("Delete Nitnem pothi?")).toBeNull();

    act(() => showConfirm(ask("Delete Nitnem pothi?")));
    expect(root.queryByText("Delete Nitnem pothi?")).toBeTruthy();
  });
});
