import { sanitizeReaderColors } from "@theme/readerColors";
import { SET_READER_COLORS } from "./actions/actionTypes";

// redux-persist already persists root slices. Missing preferences on upgrades
// resolve to defaults; only validated overrides are saved for each mode.
const readerColorsReducer = (state = {}, action) => {
  if (action.type !== SET_READER_COLORS || !["light", "dark"].includes(action.mode)) return state;
  return { ...state, [action.mode]: sanitizeReaderColors(action.value) };
};

export default readerColorsReducer;
