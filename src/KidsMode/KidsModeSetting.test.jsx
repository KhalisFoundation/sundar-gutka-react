import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import KidsModeSetting from "./KidsModeSetting";
import { setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./state/actions";

jest.mock("@common", () => {
  const { Switch, Text } = require("react-native");
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_MODE: "Kids Mode",
      KIDS_SCORING_OPT_IN: "Check pronunciation online",
      KIDS_SCORING_OPT_IN_INFO: "Recordings are sent for checking and not kept.",
      KIDS_RECITER: "Reciter",
    },
    ListItemTitle: ({ title }) => <Text>{title}</Text>,
    // The real switch animates on mount, which logs act() warnings and keeps timers alive.
    ThemedSwitch: ({ value, onValueChange }) => (
      <Switch accessibilityRole="switch" value={value} onValueChange={onValueChange} />
    ),
  });
});

// @rneui/themed ships untranspiled ESM, which this Jest config does not transform.
jest.mock("@rneui/themed", () => {
  const { View } = require("react-native");
  const ListItem = ({ children }) => <View>{children}</View>;
  ListItem.Content = ({ children }) => <View>{children}</View>;
  return { ListItem, Icon: () => null };
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
    BottomSheetComponent: ({ actionConstant, action }) => {
      const dispatch = useDispatch();
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
