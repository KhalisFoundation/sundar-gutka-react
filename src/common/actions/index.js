import * as actionTypes from "./actionTypes";
import STRINGS from "../localization";

export const toggleNightMode = (value) => {
  return { type: actionTypes.TOGGLE_NIGHT_MODE, value };
};

export function setFontSize(size) {
  return { type: actionTypes.SET_FONT_SIZE, size };
}
export function setFontFace(font) {
  return { type: actionTypes.SET_FONT_FACE, font };
}

export function setLanguage(language) {
  STRINGS.setLanguage(language);
  return { type: actionTypes.SET_LANGUAGE, language };
}
export function toggleTransliteration(value) {
  return { type: actionTypes.TOGGLE_TRANSLITERATION, value };
}
export function setTransliteration(language) {
  return { type: actionTypes.SET_TRANSLITERATION, language };
}
export function setTheme(theme) {
  return { type: actionTypes.SET_THEME, theme };
}

export function toggleAutoScroll(value) {
  return { type: actionTypes.TOGGLE_AUTO_SCROLL, value };
}

export function toggleStatusBar(value) {
  return { type: actionTypes.TOGGLE_STATUS_BAR, value };
}
export function toggleScreenAwake(value) {
  return { type: actionTypes.TOGGLE_SCREEN_AWAKE, value };
}

export function setBaniLength(length) {
  return { type: actionTypes.SET_BANI_LENGTH, length };
}
export function toggleLarivaar(value) {
  return { type: actionTypes.TOGGLE_LARIVAAR, value };
}

export function toggleLarivaarAssist(value) {
  return { type: actionTypes.TOGGLE_LARIVAAR_ASSIST, value };
}

export function toggleParagraphMode(value) {
  return { type: actionTypes.TOGGLE_PARAGRAPH_MODE, value };
}

export function setPadched(setting) {
  return { type: actionTypes.SET_PADCHHED, setting };
}

export function toggleVishraam(value) {
  return { type: actionTypes.TOGGLE_VISHRAAM, value };
}

export function setVishraamOption(option) {
  return { type: actionTypes.SET_VISHRAAM_OPTION, option };
}

export function setVishraamSource(source) {
  return { type: actionTypes.SET_VISHRAAM_SOURCE, source };
}

export function toggleStatistics(value) {
  return { type: actionTypes.TOGGLE_STATISTICS, value };
}

export function toggleEnglishTranslation(value) {
  return { type: actionTypes.TOGGLE_ENGLISH_TRANSLATION, value };
}

export function togglePunjabiTranslation(value) {
  return { type: actionTypes.TOGGLE_PUNJABI_TRANSLATION, value };
}
export function toggleSpanishTranslation(value) {
  return { type: actionTypes.TOGGLE_SPANISH_TRANSLATION, value };
}
export function setBookmarkPosition(value) {
  return { type: actionTypes.SET_BOOKMARK_POSITION, value };
}
export function toggleReminders(value) {
  return { type: actionTypes.TOGGLE_REMINDERS, value };
}

export function setReminderBanis(list) {
  return { type: actionTypes.SET_REMINDER_BANIS, list };
}
export function setReminderSound(sound) {
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

export function setPosition(pos, shabadID) {
  const position = { [shabadID]: pos };
  return { type: actionTypes.SET_SAVE_POSITION, position };
}
