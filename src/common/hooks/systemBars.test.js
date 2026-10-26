/* eslint-env jest */
import reducer from "../reducer";
import { persistConfig } from "../store";

/**
 * The Hide Status Bar setting never worked.
 *
 * MainActivity hid `Type.systemBars()` — navigation bar AND status bar — and
 * re-applied it on every window focus change. React Native's StatusBar would
 * show the bar as the user asked, then the next shade pull, dialog dismissal or
 * unlock hid it again a moment later. The value was saved correctly the whole
 * time; it just never survived contact with that method, which is why toggling
 * it off also looked like it had not been remembered after a relaunch.
 *
 * Native now hides the navigation bar only. These pin the JS side of the
 * contract: the app opens full screen, and after that the switch — and nothing
 * else — decides.
 */
describe("the Hide Status Bar setting", () => {
  it("ships ON, so a first launch is full screen", () => {
    // `isStatusBar` is the value of the SWITCH, so true means "hidden".
    const state = reducer(undefined, { type: "@@INIT" });
    expect(state.isStatusBar).toBe(true);
  });

  it("holds the value the user sets, in both directions", () => {
    const shown = reducer(undefined, { type: "TOGGLE_STATUS_BAR", value: false });
    expect(shown.isStatusBar).toBe(false);
    const hidden = reducer(shown, { type: "TOGGLE_STATUS_BAR", value: true });
    expect(hidden.isStatusBar).toBe(true);
  });

  it("keeps a value the user turned OFF through unrelated actions", () => {
    // The bug read as "it forgets what I chose", so the guard is that nothing
    // short of the toggle itself puts it back.
    const shown = reducer(undefined, { type: "TOGGLE_STATUS_BAR", value: false });
    const later = reducer(shown, { type: "SET_FONT_SIZE", value: 5 });
    expect(later.isStatusBar).toBe(false);
  });
});

describe("persistence of the setting", () => {
  it("is written to storage, so it survives a relaunch", () => {
    // Blacklisting is the only way a key silently stops being remembered.
    expect(persistConfig.blacklist).not.toContain("isStatusBar");
  });

  it("is never rewritten by a migration", () => {
    // A migration would overwrite a choice the user had already made — the one
    // thing this setting must not do again.
    expect(persistConfig.migrate).toBeUndefined();
    expect(persistConfig.version).toBeUndefined();
  });
});
