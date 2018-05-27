import AnalyticsManager from "../utils/analytics";

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
export const TOGGLE_STATUS_BAR = "TOGGLE_STATUS_BAR";
export const TOGGLE_PARAGRAPH_MODE = "TOGGLE_PARAGRAPH_MODE"
export const TOGGLE_AUTO_SCROLL = "TOGGLE_AUTO_SCROLL";
export const SET_AUTO_SCROLL_SPEED = "SET_AUTO_SCROLL_SPEED";

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
  AnalyticsManager.getInstance().trackEvent("fontSize", size);
  return { type: SET_FONT_SIZE, size };
}

export function setFontFace(font) {
  AnalyticsManager.getInstance().trackEvent("fontFace", font);
  return { type: SET_FONT_FACE, font };
}

export function toggleRomanized(value) {
  AnalyticsManager.getInstance().trackEvent("romanized", value);
  return { type: TOGGLE_ROMANIZED, value };
}

export function toggleEnglishTranslations(value) {
  AnalyticsManager.getInstance().trackEvent("english", value);
  return { type: TOGGLE_ENGLISH_TRANSLATIONS, value };
}

export function toggleNightMode(value) {
  AnalyticsManager.getInstance().trackEvent("nightMode", value);
  return { type: TOGGLE_NIGHT_MODE, value };
}

export function toggleScreenAwake(value) {
  AnalyticsManager.getInstance().trackEvent("keepAwake", value);
  return { type: TOGGLE_SCREEN_AWAKE, value };
}

export function setBaniOrder(order) {
  return { type: SET_BANI_ORDER, order };
}

export function setBaniLength(length) {
  AnalyticsManager.getInstance().trackEvent("baniLength", length);
  return { type: SET_BANI_LENGTH, length };
}

export function toggleLarivaar(value) {
  AnalyticsManager.getInstance().trackEvent("larivaar", value);
  return { type: TOGGLE_LARIVAAR, value };
}

export function setManglacharanPosition(position) {
  AnalyticsManager.getInstance().trackEvent("manglacharan", position);
  return { type: SET_MANGLACHARAN_POSITION, position };
}

export function setPadchhedSetting(setting) {
  AnalyticsManager.getInstance().trackEvent("padchhed", setting);
  return { type: SET_PADCHHED_SETTINGS, setting };
}

export function toggleStatistics(value) {
  AnalyticsManager.getInstance().trackEvent("statistics", value);
  return { type: TOGGLE_STATISTICS, value };
}

export function toggleStatusBar(hidden) {
  AnalyticsManager.getInstance().trackEvent("statusBar", hidden);
  return { type: TOGGLE_STATUS_BAR, hidden };
}

export function toggleParagraphMode(paragraph) {
  AnalyticsManager.getInstance().trackEvent("paragraph", paragraph);
  return { type: TOGGLE_PARAGRAPH_MODE, paragraph };
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

export function toggleAutoScroll(value) {
  //AnalyticsManager.getInstance().trackEvent("autoScroll", value);
  return { type: TOGGLE_AUTO_SCROLL, value };
}

export function setAutoScrollSpeed(speed) {
  //AnalyticsManager.getInstance().trackEvent("autoScrollSpeed", speed);
  return { type: SET_AUTO_SCROLL_SPEED, speed };
}
