/*
 * action types
 */
export const SET_FONT_SIZE = "SET_FONT_SIZE";
export const SET_FONT_FACE = "SET_FONT_FACE";
export const TOGGLE_ROMANIZED = "TOGGLE_ROMANIZED";
export const TOGGLE_ENGLISH_TRANSLATIONS = "TOGGLE_ENGLISH_TRANSLATIONS";
export const TOGGLE_NIGHT_MODE = "TOGGLE_NIGHT_MODE";
export const TOGGLE_SCREEN_AWAKE = "TOGGLE_SCREEN_AWAKE";
export const SET_BANI_ORDER = "SET_BANI_ORDER";
export const SET_BANI_LENGTH = "SET_BANI_LENGTH";
export const TOGGLE_LARIVAAR = "TOGGLE_LARIVAAR";
export const SET_MANGLACHARAN_POSITION = "SET_MANGLACHARAN_POSITION";
export const SET_PADCHHED_SETTINGS = "SET_PADCHHED_SETTINGS";
export const TOGGLE_STATISTICS = "TOGGLE_STATISTICS";
export const SET_MERGED_BANI_DATA = "SET_MERGED_BANI_DATA";
export const SET_CURRENT_SHABAD = "SET_CURRENT_SHABAD";
export const SET_SCROLL_INDEX = "SET_SCROLL_INDEX";

/*
 * other constants
 */

export const FONT_SIZES = [
  "EXTRA_SMALL",
  "SMALL",
  "MEDIUM",
  "LARGE",
  "EXTRA_LARGE"
];

export const fontSizeNames = [
  "Extra Small",
  "Small (default)",
  "Medium",
  "Large",
  "Extra Large"
];

export const FONT_FACES = [
  "AnmolLipiSG",
  "GurbaniAkharSG",
  "GurbaniAkharHeavySG",
  "GurbaniAkharThickSG"
];

export const fontFaceNames = [
  "Anmol Lipi",
  "Gurbani Akhar (default)",
  "Gurbani Akhar Heavy",
  "Gurbani Akhar Thick"
];

export const BANI_LENGTHS = ["LONG", "MEDIUM", "SHORT"];

export const baniLengthNames = ["Long (default)", "Medium", "Short", "Cancel"];

export const MANGLACHARAN_POSITIONS = [
  "CURRENT_SAROOPS",
  "ABOVE_RAAG_HEADINGS"
];

export const manglacharanPositionNames = [
  "Current Saroops (default)",
  "Above Raag Headings"
];

export const PADCHHED_SETTINGS = ["SAT_SUBHAM_SAT", "MAST_SABH_MAST"];

export const padchhedSettingNames = [
  "Sat Subham Sat (default)",
  "Mast Sabh Mast"
];

/*
 * action creators
 */

export function setFontSize(size) {
  return { type: SET_FONT_SIZE, size };
}

export function setFontFace(font) {
  return { type: SET_FONT_FACE, font };
}

export function toggleRomanized(value) {
  return { type: TOGGLE_ROMANIZED, value };
}

export function toggleEnglishTranslations(value) {
  return { type: TOGGLE_ENGLISH_TRANSLATIONS, value };
}

export function toggleNightMode(value) {
  return { type: TOGGLE_NIGHT_MODE, value };
}

export function toggleScreenAwake(value) {
  return { type: TOGGLE_SCREEN_AWAKE, value };
}

export function setBaniOrder(order) {
  return { type: SET_BANI_ORDER, order };
}

export function setBaniLength(length) {
  return { type: SET_BANI_LENGTH, length };
}

export function toggleLarivaar(value) {
  return { type: TOGGLE_LARIVAAR, value };
}

export function setManglacharanPosition(position) {
  return { type: SET_MANGLACHARAN_POSITION, position };
}

export function setPadchhedSetting(setting) {
  return { type: SET_PADCHHED_SETTINGS, setting };
}

export function toggleStatistics(value) {
  return { type: TOGGLE_STATISTICS, value };
}

export function setMergedBaniData(list) {
  return { type: SET_MERGED_BANI_DATA, list };
}

export function setCurrentShabad(shabadId) {
  return { type: SET_CURRENT_SHABAD, shabadId };
}

export function setScrollIndex(index) {
  return { type: SET_SCROLL_INDEX, index };
}