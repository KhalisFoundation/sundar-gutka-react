import React from "react";
import { useDispatch } from "react-redux";
import { setOnboardingVisible } from "@common/actions";
import { STRINGS, constant } from "@common";
import SettingsRow from "./comon/SettingsRow";

// "Revisit Tutorial" row (Other Options) — reopens the onboarding carousel
// (the text + screenshot guide) regardless of whether it's been seen before.
// The carousel is a root-level overlay (see app.js / OnboardingCarousel), so it
// appears on top of Settings and returns here when finished.
const RevisitTutorial = () => {
  const dispatch = useDispatch();

  // After the hooks, so hook order is unaffected by the flag. Hidden rather
  // than disabled: a row that cannot do anything is noise, not feedback.
  if (!constant.ONBOARDING_ENABLED) return null;

  return (
    <SettingsRow
      title={STRINGS.REVISIT_TUTORIAL}
      icon="help-outline"
      onPress={() => dispatch(setOnboardingVisible(true))}
    />
  );
};

export default RevisitTutorial;
