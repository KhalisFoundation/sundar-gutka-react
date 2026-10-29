import { AppState } from "react-native";
import { renderHook } from "@testing-library/react-native";
import usePauseAudioOnExit from "./usePauseAudioOnExit";

// Leaving the app pauses audio; a system permission prompt does not count as
// leaving, so the first download's notification prompt keeps the track playing.

let mockPromptOpen = false;
jest.mock("../notifications", () => ({ isPermissionPromptOpen: () => mockPromptOpen }));
jest.mock("../TrackPlayerUtils", () => ({ pauseTrack: jest.fn(() => Promise.resolve()) }));

let change;
beforeEach(() => {
  jest.clearAllMocks();
  mockPromptOpen = false;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_e, handler) => {
    change = handler;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.restoreAllMocks());

describe("usePauseAudioOnExit", () => {
  it.each(["background", "inactive"])("pauses when the app goes %s", (state) => {
    const { pauseTrack } = require("../TrackPlayerUtils");
    renderHook(() => usePauseAudioOnExit());
    change(state);
    expect(pauseTrack).toHaveBeenCalledTimes(1);
  });

  it("does not pause for the notification permission prompt", () => {
    const { pauseTrack } = require("../TrackPlayerUtils");
    mockPromptOpen = true;
    renderHook(() => usePauseAudioOnExit());
    change("inactive");
    change("background");
    expect(pauseTrack).not.toHaveBeenCalled();
  });
});
