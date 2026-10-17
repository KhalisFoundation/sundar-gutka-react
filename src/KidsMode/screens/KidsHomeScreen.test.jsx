import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { render } from "@testing-library/react-native";

import { freshExperience } from "../design/experience";

import KidsHomeScreen from "./KidsHomeScreen";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: jest.fn() }));
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ goBack: mockGoBack }) }));
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

  it("opens on the explorer choice first, and on the journey once started", () => {
    render(<KidsHomeScreen />);
    expect(global.lastKidsHost.initialScreen).toBe("character");
    useSelector.mockImplementation((select) =>
      select({
        kidsMode: { scoringOptIn: false, experience: { ...freshExperience(), started: true } },
      })
    );
    render(<KidsHomeScreen />);
    expect(global.lastKidsHost.initialScreen).toBe("world");
  });

  // The design saves whenever host.storage changes identity, and a save re-renders this
  // screen through the store; a fresh storage object per render would loop forever.
  it("keeps the storage port stable across renders", () => {
    const screen = render(<KidsHomeScreen />);
    const { storage } = global.lastKidsHost;
    screen.rerender(<KidsHomeScreen />);
    expect(global.lastKidsHost.storage).toBe(storage);
  });

  it("leaves the journey through the navigator", () => {
    render(<KidsHomeScreen />);
    global.lastKidsHost.exit();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("saves the experience through redux", () => {
    render(<KidsHomeScreen />);
    const value = { v: 1 };
    expect(global.lastKidsHost.storage.save(value)).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "KIDS_MODE_SET_EXPERIENCE", value });
  });
});
