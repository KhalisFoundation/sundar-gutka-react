import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import { NEST_OVERLAYS_IN_SHEET } from "@common/components/ui/Overlay";
import { baniItems } from "@common/pothi/model";
import { ConfirmDialogHost, showConfirm, STRINGS } from "@common";
import { GurmukhiKeyboard, Sheet, SheetActions } from "../../common/components/ui";
import usePothiTitle from "../hooks/usePothiTitle";
import usePunjabiKeyboard from "../hooks/usePunjabiKeyboard";
import useSetPothiBanis from "../hooks/useSetPothiBanis";
import reportPothiEmptied from "../reportPothiEmptied";
import PickBanisStep from "./PickBanisStep";

// Fill a pothi that already exists.
//
// The step itself is `PickBanisStep`, the same component the second step of
// creating a pothi renders — not a copy of it. This file is only the two things
// that actually differ: where the selection lives, and what Done means.
//
// Every row applies immediately rather than staging a draft. The list can be
// long, `Done` is really just "close", and a staged draft would silently lose
// ticks if the sheet were dismissed by the scrim.
//
// Which is why cancelling has to UNDO rather than simply close: the ticks are
// already in the store by then. The selection the sheet opened with is kept so
// that discarding can put it back, and it is asked for first, because there is
// nothing to take back afterwards.
const AddBanisSheet = ({ visible, onClose, pothiId = null, baniListData }) => {
  const setBanis = useSetPothiBanis();
  const { titleFor } = usePothiTitle();
  // Read LIVE from the store, by id. Holding the row object the list handed
  // over froze the ticks: every add produced a new pothi in the store while
  // this still pointed at the snapshot taken when the sheet opened.
  const pothi = useSelector((state) => (state.pothis?.folders ?? []).find((f) => f.id === pothiId));
  const [query, setQuery] = useState("");
  const [gurmukhi, setGurmukhi, toggleGurmukhi] = usePunjabiKeyboard();
  // What discarding restores. Taken once per opening and null until then —
  // a sentinel rather than an empty array, because a pothi opened with no
  // banis in it would otherwise be re-snapshotted after the first tick and
  // discarding would put that tick back.
  const [openedWith, setOpenedWith] = useState(null);

  // A reopened sheet starts from a clean search with the keyboard down.
  useEffect(() => {
    if (visible) {
      setQuery("");
      setGurmukhi(false);
    }
  }, [visible]);

  // Separate from the reset above because it depends on the pothi as well, and
  // the pothi changes on every tick — the sentinel is what stops the snapshot
  // following those edits and making discard a no-op.
  useEffect(() => {
    if (visible && pothi && openedWith === null) setOpenedWith(baniItems(pothi));
    if (!visible && openedWith !== null) setOpenedWith(null);
  }, [visible, pothi, openedWith]);

  if (!pothi) return null;

  // Done and dismissing both keep the edits, so both are the commit. Discard
  // puts the opening selection back and closes without passing through here.
  const commit = () => {
    const banis = baniItems(pothi).length;
    reportPothiEmptied(openedWith ? openedWith.length : banis, banis, "add_banis_sheet");
    onClose();
  };

  const discard = () =>
    showConfirm({
      title: STRINGS.formatString(STRINGS.POTHI_DISCARD_EDITS_CONFIRM, { name: titleFor(pothi) }),
      cancelText: STRINGS.POTHI_KEEP_EDITING,
      confirmText: STRINGS.POTHI_DISCARD,
      destructive: true,
      onConfirm: () => {
        setBanis(pothi, openedWith ?? []);
        onClose();
      },
    });

  return (
    // Settings-scoped, like the other pothi sheets — see CreatePothiSheet.
    <ScreenRolesProvider screen="settings">
      <Sheet
        visible={visible}
        onClose={commit}
        title={STRINGS.POTHI_ADD_BANIS}
        // Fixed above the list, so browsing never scrolls the search away.
        header={
          <PickBanisStep.Search
            pickedCount={baniItems(pothi).length}
            query={query}
            onQueryChange={setQuery}
            gurmukhiOpen={gurmukhi}
            onToggleGurmukhi={() => toggleGurmukhi("add_banis_search")}
          />
        }
        // The list is the one and only scroller. Nested scrollers fought for
        // every drag.
        scrollable
        // Pinned: Cancel and Done as words, then the keys under them, so
        // neither can be pushed past the bottom edge however long the list is.
        footer={
          <SheetActions
            onCancel={discard}
            cancelLabel={STRINGS.CANCEL}
            confirmLabel={STRINGS.POTHI_DONE}
            onConfirm={commit}
          />
        }
        keyboard={
          gurmukhi ? (
            <GurmukhiKeyboard
              lettersLabel={STRINGS.POTHI_KEYBOARD_LETTERS}
              signsLabel={STRINGS.POTHI_KEYBOARD_SIGNS}
              value={query}
              onChange={setQuery}
            />
          ) : null
        }
      >
        {/* The step hands back the whole next selection, which is what a draft
            wants; `setBanis` turns it into the adds and removes an existing
            pothi is edited with. */}
        <PickBanisStep
          picked={baniItems(pothi)}
          onChange={(next) => setBanis(pothi, next)}
          baniListData={baniListData}
          query={query}
        />
        {/* The sheet stays open behind the discard question, so the question has
            to be presented BY the sheet — see modalHosts.test.js. Outside the
            settings scope, so the dialog keeps the same surface it wears
            everywhere else in the app rather than this sheet's navy. */}
        {NEST_OVERLAYS_IN_SHEET && (
          <ScreenRolesProvider screen={null}>
            <ConfirmDialogHost />
          </ScreenRolesProvider>
        )}
      </Sheet>
    </ScreenRolesProvider>
  );
};

AddBanisSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /** Id of the pothi being filled. Null closes the sheet. */
  pothiId: PropTypes.string,
  baniListData: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

export default AddBanisSheet;
