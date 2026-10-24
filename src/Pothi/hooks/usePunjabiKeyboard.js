import { useCallback, useState } from "react";
import { trackPunjabiKeyboardEvent } from "@common";

/**
 * A sheet's in-app Punjabi keyboard: whether it is up, and the switch for it.
 *
 * The switch reports each time the keyboard is turned ON, with the field it was
 * turned on from, so the feature's use is counted in one place for every sheet
 * that offers it. Turning it off reports nothing — that includes the hand-over
 * when the phone's own keyboard comes up (GurmukhiTextField).
 *
 * @returns {[boolean, Function, (surface: string) => void]} whether it is up,
 *   its setter (for a sheet resetting on reopen), and the switch.
 */
const usePunjabiKeyboard = () => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(
    (surface) => {
      if (!open) trackPunjabiKeyboardEvent("opened", { surface });
      setOpen(!open);
    },
    [open]
  );
  return [open, setOpen, toggle];
};

export default usePunjabiKeyboard;
