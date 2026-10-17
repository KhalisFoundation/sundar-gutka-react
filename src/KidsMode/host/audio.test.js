import TrackPlayer from "react-native-track-player";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useReferenceAudio } from "./audio";

jest.mock("@common/TrackPlayerUtils", () => ({
  TrackPlayerSetup: jest.fn(() => Promise.resolve()),
}));

describe("useReferenceAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TrackPlayer.setRate = jest.fn(() => Promise.resolve());
  });

  it("says the reference is unavailable when the bani has no recording", () => {
    const { result } = renderHook(() => useReferenceAudio(null, "Sukhmani Sahib"));
    act(() => result.current.listen(1, 2));
    expect(result.current.error).toBe("Reference audio is currently unavailable.");
    expect(TrackPlayer.add).not.toHaveBeenCalled();
  });

  it("loads the new track when the bani or reciter changes", async () => {
    const first = "https://cdn.example/BhaiJarnailSingh/JapjiSahib.m4a";
    const second = "https://cdn.example/GianiGurdevSingh/JapjiSahib.m4a";
    const { result, rerender, unmount } = renderHook(({ url }) => useReferenceAudio(url, "Japji"), {
      initialProps: { url: first },
    });
    await act(async () => result.current.listen(18.3, 21.5));
    await waitFor(() =>
      expect(TrackPlayer.add).toHaveBeenCalledWith(
        expect.objectContaining({ id: `kids-reference-${first}`, url: first, title: "Japji" })
      )
    );
    expect(TrackPlayer.seekTo).toHaveBeenCalledWith(18.3);
    // The player reports whatever was last added, as the real queue would.
    TrackPlayer.getActiveTrack.mockImplementation(async () => TrackPlayer.add.mock.calls.at(-1)[0]);

    rerender({ url: second });
    await act(async () => result.current.listen(20, 24));
    await waitFor(() =>
      expect(TrackPlayer.add).toHaveBeenLastCalledWith(expect.objectContaining({ url: second }))
    );
    unmount();
  });
});
