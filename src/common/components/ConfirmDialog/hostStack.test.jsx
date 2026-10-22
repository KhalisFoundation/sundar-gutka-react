/* eslint-env jest */
import React from "react";

import { act, fireEvent, render } from "@testing-library/react-native";

import ConfirmDialogHost, { showConfirm } from "./index";

// Which host answers `showConfirm` decides whether the dialog can appear at all
// on iOS.
//
// A React Native Modal is a UIViewController there, presented by the controller
// React resolves for its host view (RCTModalHostViewManager.m). The app-root
// host resolves to the root controller — which, while a sheet is open, is
// already presenting that sheet, and UIKit will not present twice from one
// controller. The dialog never arrived and the screen read as frozen; Android
// stacks Dialogs and never showed it.
//
// So a host rendered inside a sheet has to win for as long as it is mounted,
// and the root host has to take back over when it goes.

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

const titleOf = (screen) => screen.queryByText("Delete this?");

const options = { title: "Delete this?", confirmText: "Delete", cancelText: "Cancel" };

describe("showConfirm's host", () => {
  it("does nothing when no host is mounted, rather than throwing", () => {
    expect(() => showConfirm(options)).not.toThrow();
  });

  it("is answered by the only host when there is one", () => {
    const root = render(<ConfirmDialogHost />);

    act(() => showConfirm(options));
    expect(titleOf(root)).toBeTruthy();
  });

  it("is answered by the INNERMOST host, which is the one inside the sheet", () => {
    const root = render(<ConfirmDialogHost />);
    const nested = render(<ConfirmDialogHost />);

    act(() => showConfirm(options));

    // The nested host renders the dialog; the root one stays empty, so the
    // Modal is presented by the sheet's controller and not the root's.
    expect(titleOf(nested)).toBeTruthy();
    expect(titleOf(root)).toBeNull();
  });

  it("hands back to the root host once the sheet's host unmounts", () => {
    const root = render(<ConfirmDialogHost />);
    const nested = render(<ConfirmDialogHost />);

    nested.unmount();
    act(() => showConfirm(options));

    expect(titleOf(root)).toBeTruthy();
  });

  // The iOS delete-pothi path: the sheet's `onDismiss` fires inside the commit
  // that takes the sheet — and its host — away, and raises the confirm there.
  // The root host has to be answering by then, not the host just removed.
  it("hands back within the commit that removes the sheet's host", () => {
    const AskWhenClosed = ({ open }) => {
      React.useLayoutEffect(() => {
        if (!open) showConfirm(options);
      }, [open]);
      return open ? <ConfirmDialogHost /> : null;
    };
    const root = render(<ConfirmDialogHost />);
    const sheet = render(<AskWhenClosed open />);

    act(() => sheet.rerender(<AskWhenClosed open={false} />));

    expect(titleOf(root)).toBeTruthy();
  });
});

// A caller that has to react to being backed out of — a sheet that closes when
// its question is cancelled — hears about it. One that does not pass `onCancel`
// is unaffected, and confirming never counts as cancelling.
describe("showConfirm's onCancel", () => {
  it("runs when the dialog is cancelled", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const root = render(<ConfirmDialogHost />);

    act(() => showConfirm({ ...options, onCancel, onConfirm }));
    fireEvent.press(root.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(titleOf(root)).toBeNull();
  });

  it("does not run when the dialog is confirmed", () => {
    const onCancel = jest.fn();
    const root = render(<ConfirmDialogHost />);

    act(() => showConfirm({ ...options, onCancel }));
    fireEvent.press(root.getByText("Delete"));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("is optional", () => {
    const root = render(<ConfirmDialogHost />);

    act(() => showConfirm(options));
    expect(() => fireEvent.press(root.getByText("Cancel"))).not.toThrow();
    expect(titleOf(root)).toBeNull();
  });
});
