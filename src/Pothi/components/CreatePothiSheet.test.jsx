/* eslint-env jest */
import React from "react";

import { act, fireEvent, render } from "@testing-library/react-native";

import { actions, showConfirm } from "@common";

import CreatePothiSheet from "./CreatePothiSheet";

// Creating a pothi from the reader's add-to-pothi action.
//
// The bani being read is the reason the pothi is being made, so it has to show
// up TICKED in the picker. It used to be added silently on save while the
// picker showed nothing selected: the user re-picked it by hand, and unticking
// it did nothing because it was forced in regardless.

let mockPicked = [];
let mockOnChange = null;

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (fn) => fn({ pothis: { folders: [] } }),
}));

jest.mock("@common/hooks/useTokens", () => () => ({ space: { sm: 8, md: 12, lg: 16 } }));
jest.mock("@common/icons", () => ({ ArrowRightIcon: () => null, SaveIcon: () => null }));

jest.mock("@common", () => ({
  actions: { createPothi: jest.fn((pothi) => ({ type: "CREATE_POTHI", value: pothi })) },
  ConfirmDialogHost: () => null,
  showConfirm: jest.fn(),
  showToast: jest.fn(),
  STRINGS: {
    POTHI_NEW: "New pothi",
    NEXT: "Next",
    POTHI_CREATE: "Create",
    CANCEL: "Cancel",
    POTHI_KEYBOARD_TOGGLE: "Gurmukhi keyboard",
    POTHI_DISCARD_NEW_CONFIRM: "Discard {name}?",
    POTHI_KEEP_EDITING: "Keep editing",
    POTHI_DISCARD: "Discard",
    POTHI_LIMIT: "Limit",
    formatString: (s) => s,
  },
  trackPothiEvent: jest.fn(),
}));

jest.mock("../../common/components/ui", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    Sheet: ({ children, header, footer, keyboard }) => (
      <View>
        {header}
        {children}
        {footer}
        {keyboard}
      </View>
    ),
    SheetActions: ({ onCancel, onConfirm }) => (
      <View>
        <Pressable accessibilityLabel="cancel" onPress={onCancel}>
          <Text>cancel</Text>
        </Pressable>
        <Pressable accessibilityLabel="confirm" onPress={onConfirm}>
          <Text>confirm</Text>
        </Pressable>
      </View>
    ),
    GurmukhiKeyboard: () => null,
  };
});

// The name field types straight into the sheet's state through its onChange.
jest.mock("./PothiNameField", () => {
  const { TextInput } = require("react-native");
  return ({ value, onChange }) => (
    <TextInput accessibilityLabel="name" value={value} onChangeText={onChange} />
  );
});

// Records exactly what the picker is shown as ticked, and lets a test untick.
// The search above the list is its own part, fixed in the sheet's header.
jest.mock("./PickBanisStep", () => {
  const Step = ({ picked, onChange }) => {
    mockPicked = picked;
    mockOnChange = onChange;
    return null;
  };
  Step.Search = () => null;
  return Step;
});

const japji = { id: 2, gurmukhi: "jpujI swihb", gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ" };

const openAndName = ({ seedBani = null } = {}) => {
  const utils = render(
    <CreatePothiSheet visible onClose={jest.fn()} onCreated={jest.fn()} seedBani={seedBani} />
  );
  fireEvent.changeText(utils.getByLabelText("name"), "Morning");
  fireEvent.press(utils.getByLabelText("confirm"));
  return utils;
};

const createdItems = () => actions.createPothi.mock.calls[0][0].items.map((i) => i.baaniId);

beforeEach(() => {
  jest.clearAllMocks();
  mockPicked = [];
  mockOnChange = null;
});

describe("creating a pothi from the reader", () => {
  it("shows the bani being read as already ticked", () => {
    openAndName({ seedBani: japji });
    expect(mockPicked.map((item) => item.baaniId)).toEqual([2]);
    expect(mockPicked[0].title).toBe("ਜਪੁਜੀ ਸਾਹਿਬ");
  });

  it("still adds it when the user saves without touching the list", () => {
    const { getByLabelText } = openAndName({ seedBani: japji });
    fireEvent.press(getByLabelText("confirm"));
    expect(createdItems()).toEqual([2]);
  });

  // A visible tick has to mean something: unticking it leaves the bani out.
  it("leaves it out when the user unticks it", () => {
    const { getByLabelText } = openAndName({ seedBani: japji });
    act(() => mockOnChange([]));
    fireEvent.press(getByLabelText("confirm"));
    expect(createdItems()).toEqual([]);
  });

  it("adds it exactly once alongside the banis the user picks", () => {
    const { getByLabelText } = openAndName({ seedBani: japji });
    act(() => mockOnChange([...mockPicked, { id: "i4", type: "bani", baaniId: 4, title: "Jaap" }]));
    fireEvent.press(getByLabelText("confirm"));
    expect(createdItems()).toEqual([2, 4]);
  });

  // The pre-ticked bani is not something the user did, so an untouched sheet
  // closes without a discard question — as one from the Folders tab does.
  it("closes an untouched sheet without asking", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <CreatePothiSheet visible onClose={onClose} onCreated={jest.fn()} seedBani={japji} />
    );
    fireEvent.press(getByLabelText("cancel"));
    expect(showConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("creating a pothi from the Folders tab", () => {
  it("starts with nothing ticked", () => {
    openAndName({});
    expect(mockPicked).toEqual([]);
  });
});
