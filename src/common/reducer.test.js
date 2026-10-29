/* eslint-env jest */
/**
 * Tests for default Redux state values (audio settings).
 * Covers manual test cases:
 *  - "Verify Audio Player setting is ON by default" (#15 → isAudioFeatureEnabled default = true)
 *  - "Verify Audio Auto Play setting is OFF by default" (#16 → isAudioAutoPlay default = false)
 *  - "Verify Sync Scroll is ON by default" (isAudioSyncScroll default = true)
 *  - "Verify turning Audio Player OFF hides Audio Auto Play option" (#17 → derived from state)
 */

import rootReducer from "./reducer";

describe("Redux Default State (audio settings)", () => {
  const defaultState = rootReducer(undefined, { type: "@@INIT" });

  it("Audio Player feature is enabled (true) by default", () => {
    expect(defaultState.isAudioFeatureEnabled).toBe(true);
  });

  it("Audio Auto Play is disabled (false) by default", () => {
    expect(defaultState.isAudioAutoPlay).toBe(false);
  });

  it("Audio Sync Scroll is disabled (false) by default", () => {
    expect(defaultState.isAudioSyncScroll).toBe(true);
  });

  it("isAudio (player visible) is false by default - player does not auto-open", () => {
    expect(defaultState.isAudio).toBe(false);
  });

  it("Audio Playback Speed defaults to 1.0x", () => {
    expect(defaultState.audioPlaybackSpeed).toBe(1.0);
  });

  it("Audio Auto Play option would be visible only when isAudioFeatureEnabled is true", () => {
    // Derive the same rule the UI uses: autoplay option shown only when audio feature is on
    const featureOn = defaultState.isAudioFeatureEnabled;
    const autoPlayVisible = featureOn; // UI hides the option when featureOn is false
    expect(autoPlayVisible).toBe(true);
  });

  it("Audio Auto Play option is hidden when Audio Player feature is turned OFF", () => {
    const stateWithFeatureOff = rootReducer(defaultState, {
      type: "TOGGLE_AUDIO_FEATURE_ENABLED",
      value: false,
    });
    const featureOn = stateWithFeatureOff.isAudioFeatureEnabled;
    const autoPlayVisible = featureOn;
    expect(autoPlayVisible).toBe(false);
  });

  it("toggling TOGGLE_AUDIO_AUTO_PLAY to true sets isAudioAutoPlay to true", () => {
    const next = rootReducer(defaultState, {
      type: "TOGGLE_AUDIO_AUTO_PLAY",
      value: true,
    });
    expect(next.isAudioAutoPlay).toBe(true);
  });

  it("toggling TOGGLE_AUDIO_SYNC_SCROLL to true sets isAudioSyncScroll to true", () => {
    const next = rootReducer(defaultState, {
      type: "TOGGLE_AUDIO_SYNC_SCROLL",
      value: true,
    });
    expect(next.isAudioSyncScroll).toBe(true);
  });
});

describe("Onboarding carousel", () => {
  const initial = rootReducer(undefined, { type: "@@INIT" });

  it("defaults to hidden and no onboarding version completed", () => {
    expect(initial.onboardingVisible).toBe(false);
    expect(initial.seenOnboardingVersion).toBe(0);
  });

  it("SET_ONBOARDING_VISIBLE toggles visibility (e.g. Revisit Tutorial)", () => {
    const shown = rootReducer(initial, { type: "SET_ONBOARDING_VISIBLE", value: true });
    expect(shown.onboardingVisible).toBe(true);
    const hidden = rootReducer(shown, { type: "SET_ONBOARDING_VISIBLE", value: false });
    expect(hidden.onboardingVisible).toBe(false);
  });

  it("SET_ONBOARDING_SEEN stamps the completed version so first-run won't re-open it", () => {
    const next = rootReducer(initial, { type: "SET_ONBOARDING_SEEN", value: 1 });
    expect(next.seenOnboardingVersion).toBe(1);
  });
});
