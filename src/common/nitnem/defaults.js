import { MORNING_NITNEM_IDS } from "../pothi/model";

// The banis Today's Nitnem falls back to.
//
// The card normally shows the Morning Nitnem pothi, which is where a signed-in
// account's own list arrives from (the /folders API). But `pothis` is
// person-owned data: the sign-out purge resets it, and the only thing that
// re-seeds the defaults is a hook mounted on the Home TAB — so signing out on
// the Dashboard left the card reading "No banis in this pothi" until the user
// happened to visit another tab.
//
// This is the floor under that. It needs nobody to be mounted and nothing to be
// dispatched, so the card can never render empty.
//
// Derived from MORNING_NITNEM_IDS rather than restated, so the fallback and the
// pothi the card normally shows can never drift apart. The dependency points at
// `pothi/model` because that module imports nothing, so there is no cycle.
export const DEFAULT_NITNEM_BANI_IDS = MORNING_NITNEM_IDS;

export default DEFAULT_NITNEM_BANI_IDS;
