/* eslint-env jest */
import { usePlaybackState } from "react-native-track-player";
import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";
import { renderHook } from "@testing-library/react-native";
import useKeepAwake from "./keepAwake";

let mockState;
jest.mock("react-redux", () => ({ useSelector: (fn) => fn(mockState) }));
jest.mock("@sayem314/react-native-keep-awake", () => ({
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

// Listening usually means reading along, so the screen stays on while audio
// plays even with Keep Screen Awake off. Unlike auto-scroll this never touches
// the saved setting — it only decides when the lock is held.

const renderWith = ({ isScreenAwake, playback }) => {
  mockState = { isScreenAwake };
  usePlaybackState.mockReturnValue({ state: playback });
  return renderHook(() => useKeepAwake());
};

beforeEach(() => jest.clearAllMocks());

describe("useKeepAwake", () => {
  it("keeps the screen on while audio plays, with the setting off", () => {
    renderWith({ isScreenAwake: false, playback: "playing" });
    expect(activateKeepAwake).toHaveBeenCalled();
    expect(deactivateKeepAwake).not.toHaveBeenCalled();
  });

  // A stall mid-track must not let the screen sleep.
  it("keeps it on while the track is buffering", () => {
    renderWith({ isScreenAwake: false, playback: "buffering" });
    expect(activateKeepAwake).toHaveBeenCalled();
  });

  it("lets the screen sleep once playback pauses, when the setting is off", () => {
    const { rerender } = renderWith({ isScreenAwake: false, playback: "playing" });
    usePlaybackState.mockReturnValue({ state: "paused" });
    rerender();
    expect(deactivateKeepAwake).toHaveBeenCalled();
  });

  it("releases nothing when the setting is on and playback stops", () => {
    const { rerender } = renderWith({ isScreenAwake: true, playback: "playing" });
    usePlaybackState.mockReturnValue({ state: "paused" });
    rerender();
    expect(deactivateKeepAwake).not.toHaveBeenCalled();
  });

  it("follows the setting alone when nothing is playing", () => {
    renderWith({ isScreenAwake: false, playback: undefined });
    expect(deactivateKeepAwake).toHaveBeenCalled();
    expect(activateKeepAwake).not.toHaveBeenCalled();
  });
});
