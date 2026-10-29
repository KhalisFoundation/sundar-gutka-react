import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";
import PropTypes from "prop-types";
import { NEST_OVERLAYS_IN_SHEET } from "@common/components/ui/Overlay";
import {
  createPothi,
  isValidName,
  makeBaniItem,
  MAX_FOLDERS,
  MAX_NAME_LENGTH,
} from "@common/pothi/model";
import {
  actions,
  ConfirmDialogHost,
  showConfirm,
  showToast,
  STRINGS,
  trackPothiEvent,
} from "@common";
import { GurmukhiKeyboard, Sheet, SheetActions } from "../../common/components/ui";
import usePunjabiKeyboard from "../hooks/usePunjabiKeyboard";
import PickBanisStep from "./PickBanisStep";
import PothiNameField from "./PothiNameField";

// Name a new pothi, optionally seeding it with a shabad.
//
// Laid out like the reminder sheets: `Sheet` owns the padding, the body is one
// gapped column, and the actions are a right-aligned ghost + primary row that
// share the width. Full-width stacked blocks gave every action equal weight and
// doubled the sheet's height.
//
// `seedBani` is what makes the add-to-pothi flow work without leaving the
// reader: the pothi is created and the current shabad lands in it in one step,
// which is why the id is minted here rather than by the reducer. It is the
// whole bani row, not just an id, because the API requires each item to carry
// its own display title and stores it verbatim.
/** The reader's bani in the item shape the picker and the API use. */
const seedItemFor = (seedBani) =>
  makeBaniItem({ baaniId: seedBani.id, title: seedBani.gurmukhiUni || seedBani.gurmukhi });

const CreatePothiSheet = ({ visible, onClose, onCreated, seedBani = null, baniListData = [] }) => {
  const dispatch = useDispatch();
  // Counted from the store rather than passed in: both entry points (the
  // Folders tab and the reader's add-to-pothi sheet) would otherwise need to
  // know about the cap.
  const folderCount = useSelector((state) => state.pothis?.folders?.length ?? 0);
  const [name, setName] = useState("");
  // Chosen before the pothi exists, so they go in with it. Without this a new
  // pothi was always born empty and had to be filled in a second pass.
  const [picked, setPicked] = useState([]);
  const [query, setQuery] = useState("");
  // ONE keyboard for the sheet, switched on above the fields; `focused` says
  // which field its keys go into. Tapping a field moves the keys to it, which
  // is how a real keyboard behaves — the alternative was a switch per field,
  // several controls all claiming the same single keyboard.
  const [gurmukhi, setGurmukhi, toggleGurmukhi] = usePunjabiKeyboard();
  // Two steps: name the pothi, then fill it. Splitting them is what gives the
  // bani list room to browse in — sharing one sheet with the name field left it
  // a sliver. Each step owns the single keyboard, so there is no `focused`
  // question to answer any more: step 1 types the name, step 2 the search.
  const [step, setStep] = useState(1);

  // A reopened sheet starts clean rather than showing the last name typed —
  // except for the bani the sheet was opened FROM. Arriving from the reader's
  // add-to-pothi action, that bani is the reason the pothi is being made, so it
  // starts ticked in the picker instead of being added unseen on save. Being a
  // visible tick also means unticking it now actually leaves it out.
  useEffect(() => {
    if (visible) {
      setName("");
      setPicked(seedBani ? [seedItemFor(seedBani)] : []);
      setQuery("");
      setGurmukhi(false);
      setStep(1);
    }
  }, [visible, seedBani]);

  const submit = () => {
    if (!isValidName(name)) return;
    // The API 400s the whole PUT past MAX_FOLDERS, so `addPothi` refuses the
    // 51st and hands back the state untouched. Unchecked, the sheet went on to
    // report success and close for a pothi that was never created.
    if (folderCount >= MAX_FOLDERS) {
      showToast(STRINGS.formatString(STRINGS.POTHI_LIMIT, { count: MAX_FOLDERS }));
      onClose();
      return;
    }
    // The selection as shown. The seed bani is already in it when the sheet
    // came from the reader, so nothing is added that the user did not see ticked.
    const pothi = createPothi({ name, items: picked });
    dispatch(actions.createPothi(pothi));
    trackPothiEvent("created", {
      seeded: picked.some((item) => item.baaniId === seedBani?.id),
      size: picked.length,
    });
    onCreated(pothi);
    onClose();
  };

  // Nothing has been created yet, so this discards a draft rather than an
  // existing pothi — but the name and every bani ticked so far go with it,
  // which is worth one question.
  //
  // Except on an untouched step 1, where there is nothing to lose and being
  // asked to confirm closing an empty form is just an extra tap.
  const discard = () => {
    // The pre-ticked seed bani is not an edit: an untouched sheet from the
    // reader closes without asking, the same as one from the Folders tab.
    const untouchedSelection = seedBani
      ? picked.length === 1 && picked[0].baaniId === seedBani.id
      : picked.length === 0;
    if (!name && untouchedSelection) {
      onClose();
      return;
    }
    showConfirm({
      title: STRINGS.formatString(STRINGS.POTHI_DISCARD_NEW_CONFIRM, { name }),
      cancelText: STRINGS.POTHI_KEEP_EDITING,
      confirmText: STRINGS.POTHI_DISCARD,
      destructive: true,
      onConfirm: onClose,
    });
  };

  return (
    // Scoped to the SETTINGS palette — the same one the reminder sheets get
    // from `withScreenRoles(Settings, "settings")` at the route. Without it a
    // sheet opened from Home or the Reader falls back to the bare semantic
    // layer, whose dark `surfaceElevated` is a grey, so the same control looked
    // like two different sheets depending on where it was opened from.
    <ScreenRolesProvider screen="settings">
      <Sheet
        visible={visible}
        onClose={onClose}
        // Step 2 is about THIS pothi, so it wears the name just typed.
        title={step === 1 ? STRINGS.POTHI_NEW : name}
        // Fixed at the top: the field each step types into. Step 2's search
        // stays put while its list scrolls underneath.
        header={
          step === 1 ? (
            <PothiNameField
              value={name}
              onChange={setName}
              onSubmit={() => isValidName(name) && setStep(2)}
              gurmukhiOpen={gurmukhi}
              receivingKeys={gurmukhi}
              onFocus={() => {}}
              onToggleGurmukhi={() => toggleGurmukhi("create_pothi_name")}
            />
          ) : (
            <PickBanisStep.Search
              pickedCount={picked.length}
              query={query}
              onQueryChange={setQuery}
              gurmukhiOpen={gurmukhi}
              onToggleGurmukhi={() => toggleGurmukhi("create_pothi_search")}
            />
          )
        }
        // One scroller — the list. The field above and the buttons and keys
        // below are fixed, and on a short screen it is the list that gives
        // way, never a control. See Sheet's `header`.
        scrollable
        // Pinned: Cancel and Confirm as words, then the keys under them.
        // Step 1 confirms by going on to the banis, step 2 by creating the
        // pothi, which is the whole difference between them.
        footer={
          <SheetActions
            onCancel={discard}
            cancelLabel={STRINGS.CANCEL}
            confirmLabel={step === 1 ? STRINGS.NEXT : STRINGS.POTHI_CREATE}
            onConfirm={step === 1 ? () => setStep(2) : submit}
            confirmDisabled={!isValidName(name)}
          />
        }
        keyboard={
          gurmukhi ? (
            <GurmukhiKeyboard
              lettersLabel={STRINGS.POTHI_KEYBOARD_LETTERS}
              signsLabel={STRINGS.POTHI_KEYBOARD_SIGNS}
              value={step === 1 ? name : query}
              onChange={(next) =>
                step === 1
                  ? // Capped, never trimmed: trimming per keystroke would
                    // swallow the space key the moment it was pressed.
                    setName(next.slice(0, MAX_NAME_LENGTH))
                  : setQuery(next)
              }
            />
          ) : null
        }
      >
        {step === 2 ? (
          // The SAME list Add Banis renders on an existing pothi — one
          // component, so the two cannot drift. The only difference is what
          // confirming means: create the pothi here, close there.
          <PickBanisStep
            picked={picked}
            onChange={setPicked}
            baniListData={baniListData}
            query={query}
          />
        ) : null}
        {/* The sheet stays open behind the discard question, so the question
            has to be presented BY the sheet — see modalHosts.test.js. Outside
            the settings scope, so the dialog keeps the surface it wears
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

CreatePothiSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /** Receives the created pothi, so the caller can report which one it went into. */
  onCreated: PropTypes.func.isRequired,
  /** Rows from `useBaniList()`, so banis can be picked before the pothi exists. */
  baniListData: PropTypes.arrayOf(PropTypes.shape()),
  /** A bani row to drop into the new pothi immediately — the add-to-pothi flow. */
  seedBani: PropTypes.shape({
    id: PropTypes.number,
    gurmukhi: PropTypes.string,
    gurmukhiUni: PropTypes.string,
  }),
};

export default CreatePothiSheet;
