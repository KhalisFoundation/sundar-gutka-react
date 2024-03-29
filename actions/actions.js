import AnalyticsManager from "../utils/analytics";
import Strings from "../utils/localization";

/*
 * action types
 */

export const SET_FONT_SIZE = "SET_FONT_SIZE";
export const SET_FONT_FACE = "SET_FONT_FACE";
export const SET_LANGUAGE = "SET_LANGUAGE";
export const TOGGLE_TRANSLITERATION = "TOGGLE_TRANSLITERATION";
export const SET_TRANSLITERATION_LANGUAGE = "SET_TRANSLITERATION_LANGUAGE";
export const TOGGLE_ENGLISH_TRANSLATIONS = "TOGGLE_ENGLISH_TRANSLATIONS";
export const TOGGLE_PUNJABI_TRANSLATIONS = "TOGGLE_PUNJABI_TRANSLATIONS";
export const TOGGLE_SPANISH_TRANSLATIONS = "TOGGLE_SPANISH_TRANSLATIONS";
export const TOGGLE_NIGHT_MODE = "TOGGLE_NIGHT_MODE";
export const TOGGLE_SCREEN_AWAKE = "TOGGLE_SCREEN_AWAKE";
export const SET_BANI_ORDER = "SET_BANI_ORDER";
export const SET_BANI_LENGTH = "SET_BANI_LENGTH";
export const TOGGLE_LARIVAAR = "TOGGLE_LARIVAAR";
export const TOGGLE_LARIVAAR_ASSIST = "TOGGLE_LARIVAAR_ASSIST";
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
export const SET_VISHRAAM_OPTION = "SET_VISHRAAM_OPTION";
export const SET_VISHRAAM_SOURCE = "SET_VISHRAAM_SOURCE";
export const TOGGLE_REMINDERS = "TOGGLE_REMINDERS";
export const SET_REMINDER_BANIS = "SET_REMINDER_BANIS";
export const SET_REMINDER_SOUND = "SET_REMINDER_SOUND";
export const SET_APP_VERSION = "SET_APP_VERSION";
export const SET_START_BANI = "SET_START_BANI";

/*
 * other constants
 */

export const FONT_SIZES = ["EXTRA_SMALL", "SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"];

export const LANGUAGES = ["DEFAULT", "en-US", "es", "fr", "it", "hi", "pa"];

export const languageNames = [
  `${Strings.default}`,
  `English`,
  `Español`,
  `Français`,
  `Italiano`,
  `हिंदी`,
  `ਪੰਜਾਬੀ`,
];

export const fontSizeNames = [
  `${Strings.extra_small}`,
  `${Strings.small_default}`,
  `${Strings.medium}`,
  `${Strings.large}`,
  `${Strings.extra_large}`,
];

export const FONT_FACES = [
  "AnmolLipiSG",
  "GurbaniAkharTrue",
  "GurbaniAkharHeavyTrue",
  "GurbaniAkharThickTrue",
];

export const fontFaceNames = [
  `${Strings.anmol_lipi}`,
  `${Strings.gurbani_akhar_default}`,
  `${Strings.gurbani_akhar_heavy}`,
  `${Strings.gurbani_akhar_think}`,
];

export const TRANSLITERATION_LANGUAGES = ["ENGLISH", "HINDI", "SHAHMUKHI", "IPA"];

export const transliterationLanguageNames = [
  `${Strings.english}`,
  `${Strings.hindi}`,
  `${Strings.shahmukhi}`,
  `${Strings.ipa}`,
];

export const BANI_LENGTHS = ["SHORT", "MEDIUM", "LONG", "EXTRA_LONG"];

export const baniLengthNames = [
  `${Strings.short}`,
  `${Strings.medium}`,
  `${Strings.long}`,
  `${Strings.extra_long}`,
];

export const MANGLACHARAN_POSITIONS = ["CURRENT_SAROOPS", "ABOVE_RAAG_HEADINGS"];

export const manglacharanPositionNames = [
  `${Strings.current_saroops_default}`,
  `${Strings.above_raag_headings}`,
];

export const PADCHHED_SETTINGS = ["SAT_SUBHAM_SAT", "MAST_SABH_MAST"];

export const padchhedSettingNames = [
  `${Strings.sat_subham_sat_default}`,
  `${Strings.mast_sabh_mast}`,
];

export const REMINDER_SOUNDS = ["default", "wake_up_jap.mp3", "waheguru_soul.mp3"];

export const reminderSoundNames = [
  `${Strings.default}`,
  `${Strings.wake_up_jap}`,
  `${Strings.waheguru_soul}`,
];

export const VISHRAAM_OPTIONS = ["VISHRAAM_COLORED", "VISHRAAM_GRADIENT"];

export const vishraamOptionNames = [`${Strings.colored_words}`, `${Strings.gradient_background}`];

export const VISHRAAM_SOURCES = ["sttm", "igurbani", "sttm2"];

export const vishraamSourceNames = [
  `${Strings.banidb_living_default}`,
  `${Strings.iGurbani}`,
  `${Strings.sttm2}`,
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

export function setLanguage(language) {
  AnalyticsManager.getInstance().trackSettingsEvent("appLanguage", language);
  if (language !== "DEFAULT") {
    Strings.setLanguage(language);
  } else {
    Strings.setLanguage(Strings.getInterfaceLanguage());
  }
  return { type: SET_LANGUAGE, language };
}

export function toggleTransliteration(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("transliteration", value);
  return { type: TOGGLE_TRANSLITERATION, value };
}

export function setTransliterationLanguage(language) {
  AnalyticsManager.getInstance().trackSettingsEvent("transliterationLanguage", language);
  return { type: SET_TRANSLITERATION_LANGUAGE, language };
}

export function toggleEnglishTranslations(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("english", value);
  return { type: TOGGLE_ENGLISH_TRANSLATIONS, value };
}

export function togglePunjabiTranslations(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("punjabi", value);
  return { type: TOGGLE_PUNJABI_TRANSLATIONS, value };
}

export function toggleSpanishTranslations(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("spanish", value);
  return { type: TOGGLE_SPANISH_TRANSLATIONS, value };
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

export function toggleLarivaarAssist(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("larivaarAssist", value);
  return { type: TOGGLE_LARIVAAR_ASSIST, value };
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
  const shabadSpeed = { [shabad]: speed };
  return { type: SET_AUTO_SCROLL_SPEED, shabadSpeed };
}

export function toggleVisram(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("vishraam", value);
  return { type: TOGGLE_VISRAM, value };
}

export function setVishraamOption(option) {
  AnalyticsManager.getInstance().trackSettingsEvent("vishraamOption", option);
  return { type: SET_VISHRAAM_OPTION, option };
}

export function setVishraamSource(source) {
  AnalyticsManager.getInstance().trackSettingsEvent("vishraamSource", source);
  return { type: SET_VISHRAAM_SOURCE, source };
}

export function toggleReminders(value) {
  AnalyticsManager.getInstance().trackSettingsEvent("reminders", value);
  return { type: TOGGLE_REMINDERS, value };
}

export function setReminderBanis(list) {
  return { type: SET_REMINDER_BANIS, list };
}

export function setReminderSound(sound) {
  AnalyticsManager.getInstance().trackSettingsEvent("reminderSound", sound);
  return { type: SET_REMINDER_SOUND, sound };
}

export function setAppVersion(version) {
  return { type: SET_APP_VERSION, version };
}

export function setStartBani(progressList) {
  return { type: SET_START_BANI, progressList };
}
