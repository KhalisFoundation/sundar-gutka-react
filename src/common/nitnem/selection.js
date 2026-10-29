import { baniItems } from "../pothi/model";
import { DEFAULT_NITNEM_BANI_IDS } from "./defaults";

/**
 * The banis Today's Nitnem shows, and whether that is an emptied list.
 *
 * Two empties look the same on screen and mean opposite things:
 *
 *   - The morning pothi does not exist yet. Fresh state, or the account
 *     boundary reset it (CLEAR_USER_DATA), and the re-seed lives in a hook on
 *     the Home tab — so the Dashboard can be first. Nothing has been chosen;
 *     the built-in defaults stand in so the card is never blank for a reason
 *     the user cannot see.
 *   - The pothi exists with no banis in it. Someone emptied it: this user in
 *     the edit sheet, or the account from another device. That IS the choice,
 *     and the card says so — it used to substitute the same defaults here,
 *     which read as "the save did not work", and then dropped them again the
 *     moment one bani was picked.
 *
 * `emptied` is only ever true in the second case.
 */
export const nitnemSelection = (morning) => {
  if (!morning) return { ids: DEFAULT_NITNEM_BANI_IDS, emptied: false };
  const ids = baniItems(morning).map((item) => item.baaniId);
  return { ids, emptied: ids.length === 0 };
};

export default nitnemSelection;
