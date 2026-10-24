import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { actions, showConfirm, showToast, STRINGS, trackPothiEvent } from "@common";

/**
 * Confirm, then delete a whole pothi.
 *
 * Shared by the two places that offer it — long-pressing a row in the Folders
 * tab, and the folder screen's overflow — so the wording, the destructive
 * styling and the gate cannot drift apart between them.
 *
 * The pothi is named in the question rather than described in a second line of
 * body text: "Delete Nitnem pothi?" already says which one and what happens, and
 * a dialog with a title alone is one line to read instead of three.
 *
 * @returns {(pothi: {id: string, name: string, count: number}, onDeleted?: Function,
 *   onCancelled?: Function) => void}
 */
const useDeletePothi = () => {
  const dispatch = useDispatch();

  return useCallback(
    ({ id, name, count }, onDeleted = null, onCancelled = null) => {
      showConfirm({
        title: STRINGS.formatString(STRINGS.POTHI_DELETE_CONFIRM, { name }),
        cancelText: STRINGS.CANCEL,
        confirmText: STRINGS.POTHI_DELETE,
        destructive: true,
        onCancel: onCancelled,
        onConfirm: () => {
          dispatch(actions.deletePothi(id));
          trackPothiEvent("deleted", { size: count });
          showToast(STRINGS.POTHI_DELETED, "success");
          if (onDeleted) onDeleted();
        },
      });
    },
    [dispatch]
  );
};

export default useDeletePothi;
