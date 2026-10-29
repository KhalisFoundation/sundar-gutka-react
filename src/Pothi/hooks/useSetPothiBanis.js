import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { baniItems } from "@common/pothi/model";
import { actions, trackPothiEvent } from "@common";

/**
 * Replaces a pothi's banis with a given set, as the adds and removes between
 * the two.
 *
 * NOT a wholesale write. The model has no "replace all items" transition on
 * purpose: a whole-list write rewrites items the user never touched, stamping
 * `updatedAt` on each and losing to the other device's copy on the next merge.
 * The difference is dispatched instead, one add or remove per bani that
 * actually changed.
 *
 * Two callers want exactly this and had it written twice: the Add Banis sheet,
 * where the selection is a list of ticks, and the Dashboard's Today's Nitnem
 * editor, which edits the Morning Nitnem pothi.
 *
 * Ungated. The edit lands in redux first and reaches the account when there is
 * one, so it is applied whether or not the user is signed in or online.
 *
 * @returns {(pothi: object, next: Array) => boolean} true if it was applied.
 */
const useSetPothiBanis = () => {
  const dispatch = useDispatch();

  return useCallback(
    (pothi, next) => {
      if (!pothi) return false;
      // Banis on both sides. Diffing every item made each non-bani look
      // unticked, and it was removed. See isBaniItem.
      const current = baniItems(pothi);
      const before = new Set(current.map((item) => item.baaniId));
      const after = new Set(next.map((item) => item.baaniId));
      next
        .filter((item) => !before.has(item.baaniId))
        .forEach((item) => {
          trackPothiEvent("bani_added", { bani_id: item.baaniId, size: after.size });
          dispatch(actions.addBaniToPothi(pothi.id, item));
        });
      current
        .filter((item) => !after.has(item.baaniId))
        .forEach((item) => {
          trackPothiEvent("bani_removed", { bani_id: item.baaniId });
          dispatch(actions.removeBaniFromPothi(pothi.id, item.baaniId));
        });
      return true;
    },
    [dispatch]
  );
};

export default useSetPothiBanis;
