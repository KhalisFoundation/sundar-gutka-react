/* eslint-env jest */
import React from "react";
import { Platform } from "react-native";

import { render, fireEvent, within } from "@testing-library/react-native";

import PothiActionsSheet from "./PothiActionsSheet";

// Deleting a pothi asks first, and the ASK has to survive the tap.
//
// The sheet closes BEFORE the confirm is raised, so the dialog has nothing
// underneath it: left open, the system back gesture dismisses the dialog alone
// and lands the user back on a sheet whose Delete is dead (Android 16 tells the
// app nothing, so it still believes a dialog is open).
//
// The order is delicate because of WHICH host answers. showConfirm delivers to
// the innermost mounted ConfirmDialogHost, and on iOS that is the one this
// sheet renders — it unmounts with the sheet, so a confirm raised in the same
// commit reaches a host that no longer exists and nothing appears. There the
// ask waits for `onDismiss`. Android has no inner host and asks immediately.
// These pin that order rather than the wording.

const mockConfirmDelete = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (fn) => fn({ pothis: [] }),
}));


jest.mock("@common/hooks/useTokens", () => () => ({
  space: { sm: 8, md: 12, lg: 16 },
}));

let mockIsDefault = false;
jest.mock("@common/pothi/model", () => ({
  isDefaultPothi: () => mockIsDefault,
  isValidName: () => true,
  MAX_NAME_LENGTH: 40,
}));

jest.mock("@common", () => {
  const { View, Text } = require("react-native");
  const { useScreenRolesScope } = require("@theme/ScreenRolesProvider");
  return {
    ConfirmDialogHost: () => (
      <View testID="confirm-host">
        <Text testID="confirm-scope">{String(useScreenRolesScope())}</Text>
      </View>
    ),
    actions: { renamePothi: jest.fn() },
    STRINGS: {
      POTHI_DELETE: "Delete",
      POTHI_RENAME: "Rename",
      POTHI_KEYBOARD_TOGGLE: "Gurmukhi keyboard",
      CANCEL: "Cancel",
      SAVE: "Save",
    },
    trackPothiEvent: jest.fn(),
  };
});

// Stand-ins that make containment observable: anything nested renders INSIDE
// the sheet testID, anything left as a sibling does not.
jest.mock("../../common/components/ui", () => {
  const { View, Pressable, Text } = require("react-native");
  const { useScreenRolesScope } = require("@theme/ScreenRolesProvider");
  return {
    Sheet: ({ children, header, footer, keyboard, onDismiss }) => (
      <View testID="sheet">
        <Text testID="sheet-scope">{String(useScreenRolesScope())}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="dismissed"
          onPress={() => onDismiss?.()}
        >
          <Text>dismissed</Text>
        </Pressable>
        {header}
        {children}
        {footer}
        {keyboard}
      </View>
    ),
    SheetActions: ({ onCancel, cancelLabel }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={cancelLabel} onPress={onCancel}>
        <Text>{cancelLabel}</Text>
      </Pressable>
    ),
    Button: ({ title, onPress }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
    GurmukhiKeyboard: () => null,
    GurmukhiKeyboardToggle: () => null,
  };
});

jest.mock("./PothiNameField", () => () => null);

jest.mock("../hooks/useDeletePothi", () => () => mockConfirmDelete);

const pothi = { id: "p1", name: "Nitnem", count: 3 };

const renderSheet = (onClose = jest.fn()) => ({
  onClose,
  ...render(<PothiActionsSheet pothi={pothi} visible onClose={onClose} />),
});

const originalOS = Platform.OS;

beforeEach(() => {
  mockConfirmDelete.mockClear();
  mockIsDefault = false;
  Platform.OS = "android";
});

afterEach(() => {
  Platform.OS = originalOS;
});

describe("the pothi actions sheet", () => {
  it("hosts its own confirm dialog inside the sheet", () => {
    const { getByTestId } = renderSheet();

    expect(within(getByTestId("sheet")).getByTestId("confirm-host")).toBeTruthy();
  });

  // The sheet borrows the Settings palette, which is dark-mode only. A dialog
  // that inherited it came up navy on the Folders tab while every other confirm
  // in the app stayed on the default elevated surface.
  it("raises the confirm on the app palette, not the sheet's own", () => {
    const { getByTestId } = renderSheet();

    expect(getByTestId("sheet-scope")).toHaveTextContent("settings");
    expect(getByTestId("confirm-scope")).toHaveTextContent("null");
  });

  // Nothing may be left under the dialog: the system back gesture dismisses the
  // dialog's window alone, and a sheet still open behind it is what the user
  // lands on — with a Delete that no longer does anything.
  it("closes the sheet before asking, on Android", () => {
    Platform.OS = "android";
    const { getByLabelText, onClose } = renderSheet();

    fireEvent.press(getByLabelText("Delete"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockConfirmDelete).toHaveBeenCalledTimes(1);
    expect(mockConfirmDelete.mock.calls[0][0]).toEqual(pothi);
  });

  // iOS answers from the host inside this sheet, which unmounts with it, so the
  // ask has to wait for the window to be gone and the root host to take over.
  it("waits for the sheet to be gone before asking, on iOS", () => {
    Platform.OS = "ios";
    const { getByLabelText, onClose } = renderSheet();

    fireEvent.press(getByLabelText("Delete"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockConfirmDelete).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText("dismissed"));

    expect(mockConfirmDelete).toHaveBeenCalledTimes(1);
    expect(mockConfirmDelete.mock.calls[0][0]).toEqual(pothi);
  });

  // A dismissal with no delete pending — the scrim, the back gesture — asks
  // nothing.
  it("asks nothing when the sheet is dismissed on its own", () => {
    Platform.OS = "ios";
    const { getByLabelText } = renderSheet();

    fireEvent.press(getByLabelText("dismissed"));

    expect(mockConfirmDelete).not.toHaveBeenCalled();
  });

  it("closes the sheet when an untouched rename is cancelled", () => {
    const { getByLabelText, onClose } = renderSheet();

    fireEvent.press(getByLabelText("Rename"));
    fireEvent.press(getByLabelText("Cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers rename and delete on an ordinary pothi", () => {
    const { queryByLabelText } = renderSheet();

    expect(queryByLabelText("Rename")).toBeTruthy();
    expect(queryByLabelText("Delete")).toBeTruthy();
  });

  // Morning and Evening Nitnem are what Today's Nitnem follows. A device with no
  // recorded pointer finds them by their banis or their name, so a rename on
  // top of an edit loses them there — see resolveDefaultId.
  it("offers neither rename nor delete on Morning or Evening Nitnem", () => {
    mockIsDefault = true;
    const { queryByLabelText } = renderSheet();

    expect(queryByLabelText("Rename")).toBeNull();
    expect(queryByLabelText("Delete")).toBeNull();
  });

  it("renders safely when pothi transitions from null without hook order violation", () => {
    const { rerender, queryByLabelText } = render(
      <PothiActionsSheet pothi={null} visible={false} onClose={jest.fn()} />
    );
    expect(queryByLabelText("Delete")).toBeNull();

    rerender(<PothiActionsSheet pothi={pothi} visible onClose={jest.fn()} />);
    expect(queryByLabelText("Delete")).toBeTruthy();
  });
});
