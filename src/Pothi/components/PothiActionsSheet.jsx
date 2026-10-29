import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import { NEST_OVERLAYS_IN_SHEET } from "@common/components/ui/Overlay";
import useTokens from "@common/hooks/useTokens";
import { isDefaultPothi, isValidName, MAX_NAME_LENGTH } from "@common/pothi/model";
import { actions, ConfirmDialogHost, showConfirm, STRINGS, trackPothiEvent } from "@common";
import { Button, GurmukhiKeyboard, Sheet, SheetActions } from "../../common/components/ui";
import useDeletePothi from "../hooks/useDeletePothi";
import usePunjabiKeyboard from "../hooks/usePunjabiKeyboard";
import PothiNameField from "./PothiNameField";

// Rename and delete, reached by long-pressing a pothi.
//
// Long-press rather than a permanent overflow button on every row: these are
// the two rarest actions on the screen and a third control in each row would
// crowd the pin and the chevron, which are used constantly.
//
// Same layout language as CreatePothiSheet and TimePickerSheet — Sheet owns the
// padding, one gapped column, a right-aligned ghost + primary action row.
//
// Deleting asks first, and the confirmation says explicitly that the banis
// themselves survive — a folder of scripture disappearing is alarming enough
// that "Delete" alone is not an honest label.
const PothiActionsSheet = ({ pothi = null, visible, onClose, startRenaming = false }) => {
  const { space } = useTokens();
  const dispatch = useDispatch();
  const confirmDelete = useDeletePothi();
  // Morning and Evening Nitnem cannot be deleted or renamed. Morning Nitnem IS
  // Today's Nitnem on the Dashboard, and the API seeds the pair exactly once per
  // user, so a deletion is permanent. A rename breaks the link on any other
  // device, which has to find the pair by its banis or its name — see
  // resolveDefaultId. Their banis still edit like any other pothi's.
  const isDefault = useSelector((state) => isDefaultPothi(state.pothis, pothi?.id));
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [gurmukhi, setGurmukhi, toggleGurmukhi] = usePunjabiKeyboard();
  // The sheet closes FIRST, and only then is the confirm raised.
  //
  // Left open behind the dialog, it is a second window underneath: the system
  // back gesture dismisses the dialog's window alone and the sheet is simply
  // there again — with its Delete now dead, because the app is never told the
  // dialog went (Android 16 dispatches no back key to it, so `onRequestClose`
  // never fires) and still believes one is open. With nothing underneath,
  // backing out of the dialog leaves the screen, which is what it should do.
  //
  // WHICH host answers is what makes the order delicate. On iOS the innermost
  // host is the one this sheet renders (see NEST_OVERLAYS_IN_SHEET), and it
  // unmounts with the sheet — a confirm raised in the same commit would be
  // handed to a host that no longer exists, and nothing would appear. So there
  // the ask waits until the window is actually gone and the root host has taken
  // over; `onDismiss` is iOS-only and fires exactly then. Android has no inner
  // host and the root one can always open a Dialog, so it asks straight away.
  // The same shape the folder screen's overflow uses.
  const pendingAsk = useRef(null);

  const runPendingAsk = useCallback(() => {
    const ask = pendingAsk.current;
    pendingAsk.current = null;
    // Nothing pending whenever the sheet was closed any other way, which is the
    // common case.
    if (ask) ask();
  }, []);

  // Reopening on a different pothi starts from that pothi's current name.
  useEffect(() => {
    if (visible) {
      // Opened from the folder screen's overflow, rename IS the action, so the
      // sheet starts there rather than on the delete/rename choice row.
      setRenaming(startRenaming);
      setGurmukhi(false);
      setName(pothi?.name ?? "");
    }
  }, [visible, pothi, startRenaming]);

  if (!pothi) return null;

  const submitRename = () => {
    if (!isValidName(name) || isDefault) return;
    dispatch(actions.renamePothi(pothi.id, name));
    trackPothiEvent("renamed");
    onClose();
  };

  const askDelete = () => {
    const target = pothi;
    const ask = () => confirmDelete(target);
    onClose();
    if (Platform.OS === "ios") {
      pendingAsk.current = ask;
      return;
    }
    ask();
  };

  // Asked only when there is something to lose. Backing out of a name the
  // user never changed is not a discard, and being questioned about it is one
  // more tap for nothing.
  const cancelRename = () => {
    // Cancelling a rename closes the sheet — from the Folders tab as from the
    // folder screen — rather than going back to the Delete/Rename row.
    if (name === pothi.name) {
      onClose();
      return;
    }
    showConfirm({
      title: STRINGS.formatString(STRINGS.POTHI_DISCARD_EDITS_CONFIRM, { name: pothi.name }),
      cancelText: STRINGS.POTHI_KEEP_EDITING,
      confirmText: STRINGS.POTHI_DISCARD,
      destructive: true,
      onConfirm: onClose,
    });
  };

  const actionRow = (children) => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: space.sm,
        paddingTop: space.md,
      }}
    >
      {children}
    </View>
  );

  const grow = { flexGrow: 1, flexBasis: "auto" };

  return (
    // Same settings-scoped palette as the reminder sheets — see CreatePothiSheet.
    <ScreenRolesProvider screen="settings">
      <Sheet
        visible={visible}
        onClose={onClose}
        // iOS only — where a delete waits for this window to be gone before it
        // asks. See askDelete.
        onDismiss={runPendingAsk}
        title={pothi.name}
        // While renaming, the field is fixed at the top and Cancel and Save are
        // fixed at the bottom, above the keys — see SheetActions. The choice
        // row stays in the body as buttons, because Delete and Rename are
        // choices, not a confirmation.
        header={
          renaming ? (
            <PothiNameField
              value={name}
              onChange={setName}
              onSubmit={submitRename}
              gurmukhiOpen={gurmukhi}
              receivingKeys={gurmukhi}
              onFocus={() => {}}
              onToggleGurmukhi={() => toggleGurmukhi("rename_pothi")}
            />
          ) : null
        }
        // Scrollable, so on a short screen the choice row can still be reached.
        scrollable
        // Pinned while renaming: Cancel and Save as words, then the keys under
        // them, so neither can be pushed past the bottom edge.
        footer={
          renaming ? (
            <SheetActions
              onCancel={cancelRename}
              cancelLabel={STRINGS.CANCEL}
              confirmLabel={STRINGS.SAVE}
              onConfirm={submitRename}
              confirmDisabled={!isValidName(name)}
            />
          ) : null
        }
        keyboard={
          renaming && gurmukhi ? (
            <GurmukhiKeyboard
              lettersLabel={STRINGS.POTHI_KEYBOARD_LETTERS}
              signsLabel={STRINGS.POTHI_KEYBOARD_SIGNS}
              value={name}
              onChange={(next) => setName(next.slice(0, MAX_NAME_LENGTH))}
            />
          ) : null
        }
      >
        <View style={{ gap: space.lg }}>
          {renaming
            ? null
            : actionRow(
                <>
                  {isDefault ? null : (
                    <Button
                      title={STRINGS.POTHI_DELETE}
                      onPress={askDelete}
                      // A red button, not red text: it sits beside Rename and
                      // has to read as the other button in the pair, not as a
                      // link. The fill is the theme's error role, so it follows
                      // the palette and keeps its label legible — `onError`
                      // flips between themes for exactly that.
                      variant="destructive"
                      style={grow}
                    />
                  )}
                  {isDefault ? null : (
                    <Button
                      title={STRINGS.POTHI_RENAME}
                      onPress={() => setRenaming(true)}
                      style={grow}
                    />
                  )}
                </>
              )}
        </View>

        {/* Confirms raised from in here are presented BY this sheet.
            `showConfirm`'s host is normally the one at the app root, which on
            iOS is presented by the root controller — and that controller is
            already presenting this sheet, so the dialog never appeared and the
            screen sat frozen. A host mounted here registers as the innermost
            and takes over for as long as the sheet is open. See ConfirmDialog.

            Outside the settings scope, though. That scope dresses this SHEET in
            the Settings palette and is dark-mode only, so a dialog inheriting it
            came up navy on the Folders tab while every other confirm in the app
            stayed on the default elevated surface. The dialog is app-wide
            furniture, not part of the sheet.

            iOS only — see NEST_OVERLAYS_IN_SHEET. On Android a Modal inside a
            Modal is a second React root whose teardown races the sheet's, and
            the app-root host has always been able to open a Dialog over this
            sheet anyway. */}
        {NEST_OVERLAYS_IN_SHEET && (
          <ScreenRolesProvider screen={null}>
            <ConfirmDialogHost />
          </ScreenRolesProvider>
        )}
      </Sheet>
    </ScreenRolesProvider>
  );
};

PothiActionsSheet.propTypes = {
  /** Null when no row is targeted — the sheet renders nothing. */
  pothi: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    count: PropTypes.number,
  }),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /** Opens straight into rename, for a caller whose only action is renaming. */
  startRenaming: PropTypes.bool,
};

export default PothiActionsSheet;
