import { useEffect } from "react";
import { useSelector } from "react-redux";
import { showToast, STRINGS } from "@common";

// Once per app launch, not once per visit. Module scope rather than component
// state so the two entry points into the list — the Folders tab and the My
// Pothis screen — share the same latch and cannot toast twice between them.
let hinted = false;

/** Test-only: the latch outlives a render, so a suite has to clear it. */
export const resetSignedOutHint = () => {
  hinted = false;
};

/**
 * Tells a signed-out user, once, that their pothis are safe on this device and
 * that signing in is what carries them to the account.
 *
 * Informational, never a gate: everything on the Folders tab works signed out
 * (see usePothiSync), so this says what signing in ADDS rather than what it
 * unlocks.
 *
 * A toast rather than the banner that used to sit above the list: the banner
 * was permanent furniture for a message that only needs saying once, and it
 * pushed the list down on every visit for a user who had already read it.
 *
 * @param enabled whether the list is the one the user is actually looking at.
 * The Folders tab is mounted alongside the bani list so the two can slide past
 * each other, so being mounted no longer means being on screen — and a toast
 * about pothis while reading the bani list would come out of nowhere.
 */
const useSignedOutPothiHint = (enabled = true) => {
  const status = useSelector((state) => state.auth?.status);
  useEffect(() => {
    // Only the settled "signedOut" state. On a cold start the status is
    // "unknown" until the Keychain read resolves, and toasting then would tell
    // an already signed-in user to sign in.
    if (!enabled || status !== "signedOut" || hinted) return;
    hinted = true;
    showToast(STRINGS.POTHI_SIGN_IN_HINT);
  }, [enabled, status]);
};

export default useSignedOutPothiHint;
