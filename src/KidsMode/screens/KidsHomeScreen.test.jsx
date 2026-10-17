import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { render } from "@testing-library/react-native";

import KidsHomeScreen from "./KidsHomeScreen";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 }),
}));
jest.mock("@common", () => ({ StatusBarComponent: () => null }));
jest.mock("../design/KidsApp", () => {
  const { Text: MockText } = require("react-native");
  return ({ host, pauris }) => {
    global.lastKidsHost = host;
    return <MockText testID="kids-app">{pauris.length}</MockText>;
  };
});
jest.mock("../host/layout", () => ({
  Sheet: () => null,
  Scroll: () => null,
  HorizontalScroll: () => null,
}));
jest.mock("../host/icons", () => ({ Icon: () => null }));
jest.mock("../host/images", () => ({ image: () => null }));
jest.mock("../host/audio", () => ({
  useReferenceAudio: () => ({}),
  useClipPlayer: () => ({}),
  referenceTrackUrl: (r) => r,
}));
jest.mock("../host/recitation", () => ({ useRecordedRecitation: () => ({}) }));

describe("KidsHomeScreen", () => {
  const dispatch = jest.fn();
  beforeEach(() => {
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((select) =>
      select({ kidsMode: { scoringOptIn: false, reciter: null, experience: null } })
    );
  });

  it("mounts KidsApp with a fresh experience when nothing is saved", () => {
    const { getByTestId } = render(<KidsHomeScreen />);
    expect(getByTestId("kids-app")).toBeTruthy();
  });

  it("saves the experience through redux", () => {
    render(<KidsHomeScreen />);
    const value = { v: 1 };
    expect(global.lastKidsHost.storage.save(value)).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "KIDS_MODE_SET_EXPERIENCE", value });
  });
});
