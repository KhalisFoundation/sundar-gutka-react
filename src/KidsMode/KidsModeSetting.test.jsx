import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import KidsModeSetting from "./KidsModeSetting";
import { setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./state/actions";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_MODE: "Kids Mode",
      KIDS_SCORING_OPT_IN: "Check pronunciation online",
      KIDS_SCORING_OPT_IN_INFO: "Recordings are sent for checking and not kept.",
      KIDS_RECITER: "Reciter",
    },
  });
});

// The real rows pull in the token hooks and an animated switch; this keeps their contract:
// a section with a title, and a toggle row that is a switch with a title and subtitle.
jest.mock("@settings/components/comon/SettingsRow", () => {
  const { Switch, Text, View } = require("react-native");
  return {
    SettingsSection: ({ title, children }) => (
      <View>
        <Text>{title}</Text>
        {children}
      </View>
    ),
    SettingsToggleRow: ({ title, subtitle, value, onValueChange }) => (
      <View>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
        <Switch accessibilityRole="switch" value={value} onValueChange={onValueChange} />
      </View>
    ),
  };
});

// The real sheet pulls in blur and sound-player natives; this keeps its contract: one row per
// choice, and a press dispatches the action with that choice's key.
jest.mock("@settings/components/comon", () => {
  const { Pressable, Text, View } = require("react-native");
  const { useDispatch } = require("react-redux");
  return {
    ListItemComponent: ({ title, value, actionConstant, onPressAction }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPressAction}>
        <Text>{actionConstant.find((item) => item.key === value).title}</Text>
      </Pressable>
    ),
    BottomSheetComponent: ({ isVisible, actionConstant, action }) => {
      const dispatch = useDispatch();
      if (!isVisible) return null;
      return (
        <View>
          {actionConstant.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="menuitem"
              onPress={() => dispatch(action(item.key))}
            >
              <Text>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      );
    },
  };
});

const kidsMode = { enabled: false, scoringOptIn: false, reciter: null, progress: {} };

describe("KidsModeSetting", () => {
  beforeEach(() => {
    getMockDispatch().mockClear();
  });

  it("shows only the Kids Mode toggle while Kids Mode is off", () => {
    setMockState({ kidsMode });
    const { getAllByText, queryByText, getAllByRole } = render(<KidsModeSetting />);
    expect(getAllByText("Kids Mode")).toHaveLength(2);
    expect(queryByText("Check pronunciation online")).toBeNull();
    expect(getAllByRole("switch")).toHaveLength(1);
    expect(queryByText("Bhai Jarnail Singh")).toBeNull();
  });

  it("dispatches toggleKidsMode when switched on", () => {
    setMockState({ kidsMode });
    const { getByRole } = render(<KidsModeSetting />);
    fireEvent(getByRole("switch"), "valueChange", true);
    expect(getMockDispatch()).toHaveBeenCalledWith(toggleKidsMode(true));
  });

  it("shows the opt-in toggle when enabled and dispatches it", () => {
    setMockState({ kidsMode: { ...kidsMode, enabled: true } });
    const { getAllByRole, getByText } = render(<KidsModeSetting />);
    expect(getByText("Check pronunciation online")).toBeTruthy();
    fireEvent(getAllByRole("switch")[1], "valueChange", true);
    expect(getMockDispatch()).toHaveBeenCalledWith(setKidsScoringOptIn(true));
  });

  it("defaults the reciter to Bhai Jarnail Singh and dispatches a new choice", () => {
    setMockState({ kidsMode: { ...kidsMode, enabled: true } });
    const { getByLabelText, getByText, getAllByRole } = render(<KidsModeSetting />);
    expect(getByText("Bhai Jarnail Singh")).toBeTruthy();
    fireEvent.press(getByLabelText("Reciter"));
    expect(getAllByRole("menuitem")).toHaveLength(3);
    fireEvent.press(getByText("Giani Gurdev Singh"));
    expect(getMockDispatch()).toHaveBeenCalledWith(setKidsReciter("ggs"));
  });

  it("shows the saved reciter", () => {
    setMockState({ kidsMode: { ...kidsMode, enabled: true, reciter: "imk" } });
    const { getByText } = render(<KidsModeSetting />);
    expect(getByText("Bibi Indermohan Kaur")).toBeTruthy();
  });
});
