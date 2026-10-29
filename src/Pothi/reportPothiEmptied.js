import { trackPothiEvent } from "@common";

/**
 * Reports a pothi the user has left with no banis in it.
 *
 * Called where an edit is COMMITTED, never inside the shared apply. The Add
 * Banis sheet applies every tick to the store as it happens, so a pothi passes
 * through empty whenever someone unticks everything before ticking something
 * new, or before discarding — counted there, those would read as users
 * emptying their pothis. Only the state the pothi is left in counts.
 *
 * Fires on the transition alone: a pothi that was already empty is not
 * "emptied" again by closing a sheet over it.
 *
 * @param {number} heldBefore banis the pothi held before this edit
 * @param {number} heldAfter banis left once the edit is committed
 * @param {"folder_screen"|"add_banis_sheet"|"todays_nitnem"} surface where it happened
 * @returns {boolean} whether the event was sent
 */
const reportPothiEmptied = (heldBefore, heldAfter, surface) => {
  if (!(heldBefore > 0) || heldAfter !== 0) return false;
  trackPothiEvent("emptied", { size: heldBefore, surface });
  return true;
};

export default reportPothiEmptied;
