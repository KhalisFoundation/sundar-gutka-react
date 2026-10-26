import React from "react";
import { StatusBar } from "react-native";
import { useSelector, useDispatch } from "react-redux";

import { render } from "@testing-library/react-native";

import { freshExperience } from "../design/experience";

import KidsHomeScreen from "./KidsHomeScreen";

jest.mock("react-redux", () => ({ useSelector: jest.fn(), useDispatch: jest.fn() }));
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ goBack: mockGoBack }) }));
// Crashlytics is native; the app's own tests mock it the same way.
jest.mock("@common/firebase/crashlytics", () => ({ logError: jest.fn() }));
jest.mock("@common", () => ({ STRINGS: { GO_BACK: "Go back" } }));
jest.mock("../../common/components/ui", () => {
  const { Text } = require("react-native");
  return { Button: ({ title, onPress }) => <Text onPress={onPress}>{title}</Text> };
});
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 }),
}));
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
const mockAudio = jest.fn(() => ({}));
const mockRecitation = jest.fn(() => ({}));
const mockBani = jest.fn();
jest.mock("../host/audio", () => ({
  useReferenceAudio: (...args) => mockAudio(...args),
  useClipPlayer: () => ({}),
}));
jest.mock("../host/recitation", () => ({
  useRecordedRecitation: (...args) => mockRecitation(...args),
}));
jest.mock("../host/bani", () => ({ useBani: (...args) => mockBani(...args) }));

const japji = {
  pauris: [{ number: 1, lines: [{ seq: 5, text: "ਸੋਚੈ", start: 18.3, end: 21.5 }] }],
  baniId: 2,
  trackUrl: "https://cdn.example/audios/GianiGurdevSingh/JapjiSahib.m4a",
  reciter: "ggs",
  ready: true,
  error: null,
};

describe("KidsHomeScreen", () => {
  const dispatch = jest.fn();
  beforeEach(() => {
    mockBani.mockReturnValue(japji);
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

  // Kids night mode is separate from the app theme, so a white or theme-driven bar would clash with it.
  it("lets the status bar follow kids night mode", () => {
    const bar = () => render(<KidsHomeScreen />).UNSAFE_getByType(StatusBar).props;
    expect(bar()).toMatchObject({ barStyle: "dark-content", backgroundColor: "transparent" });
    expect(global.lastKidsHost.statusBarBackground).toBeUndefined();
    useSelector.mockImplementation((select) =>
      select({
        kidsMode: { scoringOptIn: false, experience: { ...freshExperience(), night: true } },
      })
    );
    expect(bar().barStyle).toBe("light-content");
  });

  it("saves the experience through redux", () => {
    render(<KidsHomeScreen />);
    const value = { v: 1 };
    expect(global.lastKidsHost.storage.save(value)).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "KIDS_MODE_SET_EXPERIENCE", value });
  });

  it("loads Japji for the parent's reciter, Bhai Jarnail Singh when none is chosen", () => {
    render(<KidsHomeScreen />);
    expect(mockBani).toHaveBeenLastCalledWith("japji", "bjs");
    useSelector.mockImplementation((select) =>
      select({ kidsMode: { scoringOptIn: false, reciter: "ggs", experience: null } })
    );
    render(<KidsHomeScreen />);
    expect(mockBani).toHaveBeenLastCalledWith("japji", "ggs");
  });

  it("plays and scores against the loaded bani and the reciter actually heard", () => {
    const { getByTestId } = render(<KidsHomeScreen />);
    expect(getByTestId("kids-app").props.children).toBe(1);
    expect(mockAudio).toHaveBeenLastCalledWith(japji.trackUrl, "ਜਪੁਜੀ ਸਾਹਿਬ");
    expect(mockRecitation).toHaveBeenLastCalledWith(japji.pauris, {
      optedIn: false,
      reciter: "ggs",
      bani: 2,
    });
    expect(global.lastKidsHost.reciterName).toBe("Giani Gurdev Singh");
  });

  it("waits for the bani before mounting the design", () => {
    mockBani.mockReturnValue({ ...japji, pauris: [], ready: false });
    const { queryByTestId } = render(<KidsHomeScreen />);
    expect(queryByTestId("kids-app")).toBeNull();
  });

  // parseExperience rejects a saved pauri past 38 and the child would lose all progress.
  it("waits for the bani before mounting the design, and shows a load error", () => {
    mockBani.mockReturnValue({ ...japji, pauris: [], ready: false });
    const loading = render(<KidsHomeScreen />);
    expect(loading.queryByTestId("kids-app")).toBeNull();
    mockBani.mockReturnValue({ ...japji, pauris: [], ready: false, error: new Error("No bani") });
    const failed = render(<KidsHomeScreen />);
    expect(failed.getByText("Kids Mode could not load. Please try again.")).toBeTruthy();
    expect(failed.queryByText("No bani")).toBeNull();
  });
});
