/* eslint-env jest */
//
// Regression test for the Android 12+ foreground-service crash
// (ForegroundServiceStartNotAllowedException @ MusicModule.setupPlayer):
// TrackPlayer.setupPlayer() must never run while the app is in the background.

// TrackPlayerUtils pulls logError/logMessage from the heavy @common barrel —
// stub the two it uses so the module loads in isolation.
jest.mock("./index", () => ({
  logError: jest.fn(),
  logMessage: jest.fn(),
}));

import { AppState } from "react-native";
import TrackPlayer from "react-native-track-player";
import { TrackPlayerSetup } from "./TrackPlayerUtils";

describe("TrackPlayerSetup foreground guard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The singleton initializes at most once per module registry, so this single
  // test (starting from a fresh, uninitialized singleton) exercises the guard:
  // backgrounded → setupPlayer deferred → 'active' → setupPlayer runs once.
  it("defers setupPlayer while backgrounded, then runs it on the next 'active' state", async () => {
    TrackPlayer.setupPlayer.mockClear();

    const listeners = [];
    AppState.currentState = "background";
    jest.spyOn(AppState, "addEventListener").mockImplementation((event, cb) => {
      listeners.push(cb);
      return { remove: jest.fn() };
    });

    const promise = TrackPlayerSetup();
    // Flush microtasks — setup must still be waiting on the foreground.
    await Promise.resolve();
    await Promise.resolve();
    expect(TrackPlayer.setupPlayer).not.toHaveBeenCalled();

    // App returns to the foreground → setup proceeds exactly once.
    AppState.currentState = "active";
    listeners.forEach((cb) => cb("active"));
    await promise;
    expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1);
  });
});

// Regression tests for the rollout's most frequent non-fatal: "Error pausing
// track: The player is not initialized. Call setupPlayer first." The global
// focus-loss hook pauses on every background transition, in sessions that never
// touched audio, and the native module rejects every call while its service is
// unbound — never set up, or set up and lost since.
//
// Each case starts from a fresh singleton via isolateModules, and reaches for
// the mocks INSIDE the isolate so it holds the same instances the module does.
describe("player calls without a player", () => {
  // The mocks from setupTests are shared across isolates, so their call
  // counts are cleared here rather than trusted to be fresh.
  const fresh = () => {
    jest.clearAllMocks();
    let mods;
    jest.isolateModules(() => {
      mods = {
        utils: require("./TrackPlayerUtils"),
        player: require("react-native-track-player").default,
        log: require("./index"),
      };
    });
    return mods;
  };
  const notInitialized = () =>
    Object.assign(new Error("The player is not initialized. Call setupPlayer first."), {
      code: "player_not_initialized",
    });

  beforeEach(() => {
    AppState.currentState = "active";
  });

  it("skips pause, stop and reset before the player was ever set up, and logs nothing", async () => {
    const { utils, player, log } = fresh();

    await utils.pauseTrack();
    await utils.stopTrack();
    await utils.resetPlayer();

    expect(player.pause).not.toHaveBeenCalled();
    expect(player.stop).not.toHaveBeenCalled();
    expect(player.reset).not.toHaveBeenCalled();
    expect(log.logError).not.toHaveBeenCalled();
  });

  it("pauses once set up, and treats a lost player as nothing to pause — then sets up again", async () => {
    const { utils, player, log } = fresh();
    await utils.TrackPlayerSetup();
    expect(player.setupPlayer).toHaveBeenCalledTimes(1);

    await utils.pauseTrack();
    expect(player.pause).toHaveBeenCalledTimes(1);

    // The service went away underneath us (task removed, OS reclaimed it).
    player.pause.mockRejectedValueOnce(notInitialized());
    await utils.pauseTrack();
    expect(log.logError).not.toHaveBeenCalled();
    expect(utils.getTrackPlayerState().isInitialized).toBe(false);

    // With the flag reset, the next setup binds again instead of being skipped.
    await utils.TrackPlayerSetup();
    expect(player.setupPlayer).toHaveBeenCalledTimes(2);
  });

  it("still reports a real pause failure", async () => {
    const { utils, player, log } = fresh();
    await utils.TrackPlayerSetup();
    player.pause.mockRejectedValueOnce(new Error("audio focus denied"));

    await utils.pauseTrack();

    expect(log.logError).toHaveBeenCalledTimes(1);
    expect(log.logError.mock.calls[0][0]).toMatch(/pausing track.*audio focus denied/);
  });

  it("attempts play regardless, and reports a missing player after forgetting it", async () => {
    const { utils, player, log } = fresh();
    await utils.TrackPlayerSetup();
    player.play.mockRejectedValueOnce(notInitialized());

    await utils.playTrack();

    expect(player.play).toHaveBeenCalledTimes(1);
    expect(log.logError).toHaveBeenCalledTimes(1);
    expect(utils.getTrackPlayerState().isInitialized).toBe(false);
  });

  it("tells subscribers when the player is set up and when it is lost", async () => {
    const { utils, player } = fresh();
    const seen = [];
    const unsubscribe = utils.subscribeTrackPlayerState((value) => seen.push(value));

    await utils.TrackPlayerSetup();
    player.pause.mockRejectedValueOnce(notInitialized());
    await utils.pauseTrack();
    unsubscribe();
    await utils.TrackPlayerSetup();

    expect(seen).toEqual([true, false]);
  });

  it("judges an error once for every caller: a missing player is forgotten, not logged", () => {
    const { utils, log } = fresh();

    expect(utils.handlePlayerError("seeking", notInitialized())).toBe(true);
    expect(log.logError).not.toHaveBeenCalled();
    expect(utils.handlePlayerError("seeking", new Error("boom"))).toBe(false);
    expect(log.logError).toHaveBeenCalledTimes(1);
  });
});
