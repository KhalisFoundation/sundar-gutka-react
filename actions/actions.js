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
export const TOGGLE_PARAGRAPH_MODE = "TOGGLE_PARAGRAPH_MODE";
export const TOGGLE_AUTO_SCROLL = "TOGGLE_AUTO_SCROLL";
export const SET_AUTO_SCROLL_SPEED = "SET_AUTO_SCROLL_SPEED";
export const TOGGLE_VISRAM = "TOGGLE_VISRAM";
export const TOGGLE_REMINDERS = "TOGGLE_REMINDERS";
export const SET_REMINDER_BANIS = "SET_REMINDER_BANIS";
export const SET_APP_VERSION = "SET_APP_VERSION";

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

export const BANI_LENGTHS = ["SHORT", "MEDIUM", "LONG", "EXTRA_LONG"];

export const baniLengthNames = ["Short", "Medium", "Long", "Extra Long"];

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
  AnalyticsManager.getInstance().trackSettingsEvent("fontSize", size);
  return { type: SET_FONT_SIZE, size };
}

export function setFontFace(font) {
  AnalyticsManager.getInstance().trackSettingsEvent("fontFace", font);
  return { type: SET_FONT_FACE, font };
}

export function toggleRomanized(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("romanized", value);
  return { type: TOGGLE_ROMANIZED, value };
}

export function toggleEnglishTranslations(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("english", value);
  return { type: TOGGLE_ENGLISH_TRANSLATIONS, value };
}

export function toggleNightMode(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("nightMode", value);
  return { type: TOGGLE_NIGHT_MODE, value };
}

export function toggleScreenAwake(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("keepAwake", value);
  return { type: TOGGLE_SCREEN_AWAKE, value };
}

export function setBaniOrder(order) {
  return { type: SET_BANI_ORDER, order };
}

export function setBaniLength(length) {
  AnalyticsManager.getInstance().trackSettingsEvent("baniLength", length);
  return { type: SET_BANI_LENGTH, length };
}

export function toggleLarivaar(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("larivaar", value);
  return { type: TOGGLE_LARIVAAR, value };
}

export function setManglacharanPosition(position) {
  AnalyticsManager.getInstance().trackSettingsEvent("manglacharan", position);
  return { type: SET_MANGLACHARAN_POSITION, position };
}

export function setPadchhedSetting(setting) {
  AnalyticsManager.getInstance().trackSettingsEvent("padchhed", setting);
  return { type: SET_PADCHHED_SETTINGS, setting };
}

export function toggleStatistics(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("statistics", value);
  return { type: TOGGLE_STATISTICS, value };
}

export function toggleStatusBar(hidden) {
  AnalyticsManager.getInstance().trackSettingsEvent("statusBar", hidden);
  return { type: TOGGLE_STATUS_BAR, hidden };
}

export function toggleParagraphMode(paragraph) {
  AnalyticsManager.getInstance().trackSettingsEvent("paragraph", paragraph);
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
  AnalyticsManager.getInstance().trackSettingsEvent("autoScroll", value);
  return { type: TOGGLE_AUTO_SCROLL, value };
}

export function setAutoScrollSpeed(speed, shabad) {
  let shabadSpeed = { [shabad]: speed };
  return { type: SET_AUTO_SCROLL_SPEED, shabadSpeed };
}

export function toggleVisram(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("visram", value);
  return { type: TOGGLE_VISRAM, value };
}

export function toggleReminders(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("reminders", value);
  return { type: TOGGLE_REMINDERS, value };
}

export function setReminderBanis(list) {
  return { type: SET_REMINDER_BANIS, list };
}

export function setAppVersion(version) {
  return { type: SET_APP_VERSION, version };
}
