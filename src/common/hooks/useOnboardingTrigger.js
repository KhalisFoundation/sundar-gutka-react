import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOnboardingVisible } from "../actions";
import constant from "../constant";

/**
 * Auto-opens the onboarding carousel once per onboarding version, gated on the
 * persisted `seenOnboardingVersion` vs the current `constant.ONBOARDING_VERSION`.
 *
 * `seenOnboardingVersion` defaults to 0 (and old boolean state doesn't carry it,
 * so every existing user reads 0 too), so brand-new installs AND everyone
 * updating into a build with a higher ONBOARDING_VERSION see the carousel
 * exactly once. Finishing or skipping stamps the current version, so it never
 * re-opens until the constant is bumped again; "Revisit Tutorial" in Settings
 * reopens it on demand regardless.
 *
 * Mounted inside the Redux + PersistGate tree (see app.js GlobalServices), so it
 * reads already-rehydrated values.
 */
const useOnboardingTrigger = () => {
  const dispatch = useDispatch();
  const seenOnboardingVersion = useSelector((state) => state.seenOnboardingVersion);
  const firedRef = useRef(false);

  useEffect(() => {
    // Checked inside the effect, not before the hooks, so hook order stays
    // stable whichever way the flag is set.
    if (!constant.ONBOARDING_ENABLED) return;
    if (firedRef.current) return;
    if (seenOnboardingVersion < constant.ONBOARDING_VERSION) {
      firedRef.current = true;
      dispatch(setOnboardingVisible(true));
    }
  }, [seenOnboardingVersion, dispatch]);
};

export default useOnboardingTrigger;
