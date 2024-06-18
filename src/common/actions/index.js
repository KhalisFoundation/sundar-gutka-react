import * as actionTypes from "./actionTypes";
import STRINGS from "../localization";
import { trackSettingEvent } from "../analytics";
import constant from "../constant";

export const toggleNightMode = (value) => {
  trackSettingEvent(constant.NIGHT_MODE, value);
  return { type: actionTypes.TOGGLE_NIGHT_MODE, value };
};

export function setFontSize(size) {
  trackSettingEvent(constant.FONT_SIZE, size);
  return { type: actionTypes.SET_FONT_SIZE, size };
}
export function setFontFace(font) {
  trackSettingEvent(constant.FONT_FACE, font);
  return { type: actionTypes.SET_FONT_FACE, font };
}

export function setLanguage(language) {
  trackSettingEvent(constant.LANGUAGE, language);
  STRINGS.setLanguage(language);
  return { type: actionTypes.SET_LANGUAGE, language };
}
export function toggleTransliteration(value) {
  trackSettingEvent(constant.TRANSLITERATION, value);
  return { type: actionTypes.TOGGLE_TRANSLITERATION, value };
}
export function setTransliteration(language) {
  trackSettingEvent(constant.TRANSLITERATION, language);
  return { type: actionTypes.SET_TRANSLITERATION, language };
}
export function setTheme(theme) {
  trackSettingEvent(constant.THEME, theme);
  return { type: actionTypes.SET_THEME, theme };
}

export function toggleAutoScroll(value) {
  trackSettingEvent(constant.AUTO_SCROLL, value);
  return { type: actionTypes.TOGGLE_AUTO_SCROLL, value };
}

export function toggleStatusBar(value) {
  trackSettingEvent(constant.STATUS_BAR, value);
  return { type: actionTypes.TOGGLE_STATUS_BAR, value };
}
export function toggleScreenAwake(value) {
  trackSettingEvent(constant.KEEP_AWAKE, value);
  return { type: actionTypes.TOGGLE_SCREEN_AWAKE, value };
}

export function setBaniLength(length) {
  trackSettingEvent(constant.BANI_LENGTH, length);
  return { type: actionTypes.SET_BANI_LENGTH, length };
}
export function toggleLarivaar(value) {
  trackSettingEvent(constant.LARIVAAR, value);
  return { type: actionTypes.TOGGLE_LARIVAAR, value };
}

export function toggleLarivaarAssist(value) {
  trackSettingEvent(constant.LARIVAAR_ASSIST, value);
  return { type: actionTypes.TOGGLE_LARIVAAR_ASSIST, value };
}

export function toggleParagraphMode(value) {
  trackSettingEvent(constant.PARAGRAPH, value);
  return { type: actionTypes.TOGGLE_PARAGRAPH_MODE, value };
}

export function setPadched(setting) {
  trackSettingEvent(constant.PADCHED, setting);
  return { type: actionTypes.SET_PADCHHED, setting };
}

export function toggleVishraam(value) {
  trackSettingEvent(constant.VISHRAAM, value);
  return { type: actionTypes.TOGGLE_VISHRAAM, value };
}

export function setVishraamOption(option) {
  trackSettingEvent(constant.VISHRAAM_OPTION, option);
  return { type: actionTypes.SET_VISHRAAM_OPTION, option };
}

export function setVishraamSource(source) {
  trackSettingEvent(constant.VISHRAAM_SOURCE, source);
  return { type: actionTypes.SET_VISHRAAM_SOURCE, source };
}

export function toggleStatistics(value) {
  trackSettingEvent(constant.STATISTICS, value);
  return { type: actionTypes.TOGGLE_STATISTICS, value };
}

export function toggleEnglishTranslation(value) {
  trackSettingEvent(constant.ENGLISH, value);
  return { type: actionTypes.TOGGLE_ENGLISH_TRANSLATION, value };
}

export function togglePunjabiTranslation(value) {
  trackSettingEvent(constant.PUNJABI, value);
  return { type: actionTypes.TOGGLE_PUNJABI_TRANSLATION, value };
}
export function toggleSpanishTranslation(value) {
  trackSettingEvent(constant.SPANISH, value);
  return { type: actionTypes.TOGGLE_SPANISH_TRANSLATION, value };
}
export function setBookmarkPosition(value) {
  trackSettingEvent(constant.BOOKMARKS, value);
  return { type: actionTypes.SET_BOOKMARK_POSITION, value };
}
export function toggleReminders(value) {
  trackSettingEvent(constant.REMINDERS, value);
  return { type: actionTypes.TOGGLE_REMINDERS, value };
}

export function setReminderBanis(list) {
  return { type: actionTypes.SET_REMINDER_BANIS, list };
}
export function setReminderSound(sound) {
  trackSettingEvent(constant.REMINDER_SOUND, sound);
  return { type: actionTypes.SET_REMINDER_SOUND, sound };
}

export function setAutoScrollSpeed(speed, shabad) {
  const shabadSpeed = { [shabad]: speed };
  return { type: actionTypes.SET_AUTO_SCROLL_SPEED, shabadSpeed };
}
export function setCacheShabad(shabad, shabadID) {
  const cache = { [shabadID]: shabad };
  return { type: actionTypes.SET_CACHE_SHABAD, cache };
}

export function setBaniOrder(order) {
  return { type: actionTypes.SET_BANI_ORDER, order };
}

export function setBaniList(list) {
  return { type: actionTypes.SET_BANI_LIST, list };
}

export function setPosition(pos, shabadID) {
  const position = { [shabadID]: pos };
  return { type: actionTypes.SET_SAVE_POSITION, position };
}

export function setScrollPosition(position) {
  return { type: actionTypes.SET_SCROLL_POSITION, position };
}
export function toggleHeaderFooter(isHeadFoot) {
  return { type: actionTypes.TOGGLE_HEADER_FOOTER, isHeadFoot };
}

export function setFontSizeNumber(size) {
  return { type: actionTypes.FONT_SIZE_NUMBER, size };
}
