import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { getMockDispatch, setMockState } from "@common/test-utils/mocks/react-redux";

import KidsModeSetting from "./KidsModeSetting";
import { setKidsScoringOptIn, toggleKidsMode } from "./state/actions";

jest.mock("@common", () => {
  const { Switch, Text } = require("react-native");
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: {
      KIDS_MODE: "Kids Mode",
      KIDS_SCORING_OPT_IN: "Check pronunciation online",
      KIDS_SCORING_OPT_IN_INFO: "Recordings are sent for checking and not kept.",
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
});
