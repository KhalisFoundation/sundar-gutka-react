import * as actionTypes from "./actionTypes";
import STRINGS from "../localization";
import { trackSettingEvent } from "../analytics";
import constant from "../constant";

export const toggleNightMode = (value) => {
  trackSettingEvent(constant.NIGHT_MODE, value);
  return { type: actionTypes.TOGGLE_NIGHT_MODE, value };
};

export const setFontSize = (size) => {
  trackSettingEvent(constant.FONT_SIZE, size);
  return { type: actionTypes.SET_FONT_SIZE, size };
};
export const setFontFace = (font) => {
  trackSettingEvent(constant.FONT_FACE, font);
  return { type: actionTypes.SET_FONT_FACE, font };
};

export const setLanguage = (language) => {
  trackSettingEvent(constant.LANGUAGE, language);
  STRINGS.setLanguage(language);
  return { type: actionTypes.SET_LANGUAGE, language };
};
export const toggleTransliteration = (value) => {
  trackSettingEvent(constant.TRANSLITERATION, value);
  return { type: actionTypes.TOGGLE_TRANSLITERATION, value };
};
export const setTransliteration = (language) => {
  trackSettingEvent(constant.TRANSLITERATION, language);
  return { type: actionTypes.SET_TRANSLITERATION, language };
};
export const setTheme = (theme) => {
  trackSettingEvent(constant.THEME, theme);
  return { type: actionTypes.SET_THEME, theme };
};

export const toggleAutoScroll = (value) => {
  trackSettingEvent(constant.AUTO_SCROLL, value);
  return { type: actionTypes.TOGGLE_AUTO_SCROLL, value };
};

export const toggleStatusBar = (value) => {
  trackSettingEvent(constant.STATUS_BAR, value);
  return { type: actionTypes.TOGGLE_STATUS_BAR, value };
};
export const toggleScreenAwake = (value) => {
  trackSettingEvent(constant.KEEP_AWAKE, value);
  return { type: actionTypes.TOGGLE_SCREEN_AWAKE, value };
};

export function toggleBookmarks(value) {
  return { type: actionTypes.TOGGLE_BOOKMARKS, value };
}

export function setBaniLength(length) {
  trackSettingEvent(constant.BANI_LENGTH, length);
  return { type: actionTypes.SET_BANI_LENGTH, length };
}
export const toggleLarivaar = (value) => {
  trackSettingEvent(constant.LARIVAAR, value);
  return { type: actionTypes.TOGGLE_LARIVAAR, value };
};

export const toggleLarivaarAssist = (value) => {
  trackSettingEvent(constant.LARIVAAR_ASSIST, value);
  return { type: actionTypes.TOGGLE_LARIVAAR_ASSIST, value };
};

export const toggleParagraphMode = (value) => {
  trackSettingEvent(constant.PARAGRAPH, value);
  return { type: actionTypes.TOGGLE_PARAGRAPH_MODE, value };
};

export const setPadched = (setting) => {
  trackSettingEvent(constant.PADCHED, setting);
  return { type: actionTypes.SET_PADCHHED, setting };
};

export const toggleVishraam = (value) => {
  trackSettingEvent(constant.VISHRAAM, value);
  return { type: actionTypes.TOGGLE_VISHRAAM, value };
};

export const setVishraamOption = (option) => {
  trackSettingEvent(constant.VISHRAAM_OPTION, option);
  return { type: actionTypes.SET_VISHRAAM_OPTION, option };
};

export const setVishraamSource = (source) => {
  trackSettingEvent(constant.VISHRAAM_SOURCE, source);
  return { type: actionTypes.SET_VISHRAAM_SOURCE, source };
};

export const toggleStatistics = (value) => {
  trackSettingEvent(constant.STATISTICS, value);
  return { type: actionTypes.TOGGLE_STATISTICS, value };
};

export const toggleEnglishTranslation = (value) => {
  trackSettingEvent(constant.ENGLISH, value);
  return { type: actionTypes.TOGGLE_ENGLISH_TRANSLATION, value };
};

export const togglePunjabiTranslation = (value) => {
  trackSettingEvent(constant.PUNJABI, value);
  return { type: actionTypes.TOGGLE_PUNJABI_TRANSLATION, value };
};
export const toggleSpanishTranslation = (value) => {
  trackSettingEvent(constant.SPANISH, value);
  return { type: actionTypes.TOGGLE_SPANISH_TRANSLATION, value };
};
export const setBookmarkPosition = (value) => {
  trackSettingEvent(constant.BOOKMARKS, value);
  return { type: actionTypes.SET_BOOKMARK_POSITION, value };
};
export const toggleReminders = (value) => {
  trackSettingEvent(constant.REMINDERS, value);
  return { type: actionTypes.TOGGLE_REMINDERS, value };
};

export const setReminderBanis = (list) => {
  return { type: actionTypes.SET_REMINDER_BANIS, list };
};
export const setReminderSound = (sound) => {
  trackSettingEvent(constant.REMINDER_SOUND, sound);
  return { type: actionTypes.SET_REMINDER_SOUND, sound };
};

export const setAutoScrollSpeed = (speed, shabad) => {
  const shabadSpeed = { [shabad]: speed };
  return { type: actionTypes.SET_AUTO_SCROLL_SPEED, shabadSpeed };
};
export const setCacheShabad = (shabad, shabadID) => {
  const cache = { [shabadID]: shabad };
  return { type: actionTypes.SET_CACHE_SHABAD, cache };
};

export const setBaniOrder = (order) => {
  return { type: actionTypes.SET_BANI_ORDER, order };
};

export const setBaniList = (list) => {
  return { type: actionTypes.SET_BANI_LIST, list };
};

export const setPosition = (pos, shabadID) => {
  const position = { [shabadID]: pos };
  return { type: actionTypes.SET_SAVE_POSITION, position };
};

export const setScrollPosition = (position) => {
  return { type: actionTypes.SET_SCROLL_POSITION, position };
};
export const toggleHeaderFooter = (isHeadFoot) => {
  return { type: actionTypes.TOGGLE_HEADER_FOOTER, isHeadFoot };
};
