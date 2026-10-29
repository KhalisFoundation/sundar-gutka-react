import { useCallback, useState } from "react";
import { MAX_PINNED } from "@common/pothi/model";
import { constant, showToast, STRINGS } from "@common";

/**
 * Everything the Folders list needs from its host screen: opening a pothi, the
 * create sheet's state and the pin-limit toast. Kept out of HomeScreen, which
 * hosts the list in its Folders tab, so that screen stays about the tabs.
 *
 * @param {Function} navigate the host's navigation.navigate
 */
const usePothiActions = (navigate) => {
  const [creating, setCreating] = useState(false);

  // Opens a pothi's banis as an ordinary bani list on its own screen, rather
  // than expanding a second list inside the first. FolderScreen is that list —
  // it already renders `BaniList` and opens a bani exactly as All Banis does,
  // so a bani reached through a pothi behaves identically to one reached
  // anywhere else. The caller resolves the rows and the title; see PothiList.
  const openPothi = useCallback(
    (payload) => {
      navigate(constant.FOLDERSCREEN, { params: payload });
    },
    [navigate]
  );

  const onPinLimit = useCallback(
    () => showToast(STRINGS.formatString(STRINGS.POTHI_PIN_LIMIT, { count: MAX_PINNED })),
    []
  );

  // "+ New Pothi" is open to everyone. A pothi lives on the device first and
  // reaches the account when there is one (see usePothiSync), so nothing a
  // signed-out or offline user starts here is thrown away.
  const openCreate = useCallback(() => setCreating(true), []);

  return {
    openPothi,
    onPinLimit,
    creating,
    openCreate,
    closeCreate: useCallback(() => setCreating(false), []),
    onCreated: useCallback(() => showToast(STRINGS.POTHI_CREATED, "success"), []),
  };
};

export default usePothiActions;
