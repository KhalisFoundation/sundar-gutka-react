import * as actions from "./actions";
import reducer from "./reducer";

// Both mocks sit under the imports because Babel hoists jest.mock above them
// regardless, so the imports still resolve to the mocked modules.

// `actions` reaches Firebase Analytics, which jest cannot transform.
jest.mock("./firebase/analytics", () => ({
  trackSettingEvent: jest.fn(),
  trackBaniArtistDefault: jest.fn(),
}));

// react-native-localization reads a native module at import time. The actions
// file imports STRINGS; this suite uses none of them.
jest.mock("./localization", () => ({ __esModule: true, default: {} }));

// The auto-scroll speed is ONE value for every bani. It was kept per bani, so a
// speed chosen in one bani meant nothing in the next and every bani opened at
// the default again. It is also persisted like every other setting, which is
// what lets it survive switching auto-scroll off and on.

const initial = () => reducer(undefined, { type: "@@INIT" });

describe("the auto-scroll speed", () => {
  it("starts unset, so the component can fall back to the old per-bani map", () => {
    expect(initial().autoScrollSpeed).toBeNull();
  });

  it("is one number, not a map keyed by bani", () => {
    const state = reducer(initial(), actions.setAutoScrollSpeed(67));
    expect(state.autoScrollSpeed).toBe(67);
  });

  it("is replaced, not accumulated, by the next choice", () => {
    let state = reducer(initial(), actions.setAutoScrollSpeed(67));
    state = reducer(state, actions.setAutoScrollSpeed(40));
    expect(state.autoScrollSpeed).toBe(40);
  });

  it("no longer writes the per-bani map it replaced", () => {
    // The old map stays registered so an existing install's values can seed the
    // new one, but nothing may write to it again — or the two would drift.
    const state = reducer(initial(), actions.setAutoScrollSpeed(67));
    expect(state.autoScrollSpeedObj).toEqual({});
  });
});
