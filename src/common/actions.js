import constant from "./constant";
import STRINGS from "./localization";

export const TOGGLE_NIGHT_MODE = "TOGGLE_NIGHT_MODE";
export const SET_FONT_SIZE = "SET_FONT_SIZE";
export const SET_FONT_FACE = "SET_FONT_FACE";
export const SET_LANGUAGE = "SET_LANGUAGE";
export const TOGGLE_TRANSLITERATION = "TOGGLE_TRANSLITERATION";
export const SET_TRANSLITERATION = "SET_TRANSLITERATION";
export const SET_THEME = "SET_THEME";
export const TOGGLE_SCREEN_AWAKE = "TOGGLE_SCREEN_AWAKE";
export const TOGGLE_STATUS_BAR = "TOGGLE_STATUS_BAR";
export const TOGGLE_AUTO_SCROLL = "TOGGLE_AUTO_SCROLL";
export const SET_BANI_LENGTH = "SET_BANI_LENGTH";
export const TOGGLE_LARIVAAR = "TOGGLE_LARIVAAR";
export const TOGGLE_LARIVAAR_ASSIST = "TOGGLE_LARIVAAR_ASSIST";
export const TOGGLE_PARAGRAPH_MODE = "TOGGLE_PARAGRAPH_MODE";
export const SET_PADCHHED = "SET_PADCHHED";
export const TOGGLE_VISHRAAM = "TOGGLE_VISHRAAM";
export const SET_VISHRAAM_OPTION = "SET_VISHRAAM_OPTION";
export const SET_VISHRAAM_SOURCE = "SET_VISHRAAM_SOURCE";
export const TOGGLE_STATISTICS = "TOGGLE_STATISTICS";
export const TOGGLE_ENGLISH_TRANSLATION = "TOGGLE_ENGLISH_TRANSLATION";
export const TOGGLE_PUNJABI_TRANSLATION = "TOGGLE_PUNJABI_TRANSLATION";
export const TOGGLE_SPANISH_TRANSLATION = "TOGGLE_SPANISH_TRANSLATION";
export const SET_BOOKMARK_POSITION = "SET_BOOKMARK_POSITION";
export const TOGGLE_REMINDERS = "TOGGLE_REMINDERS";
export const SET_REMINDER_BANIS = "SET_REMINDER_BANIS";
export const SET_REMINDER_SOUND = "SET_REMINDER_SOUND";
export const SET_AUTO_SCROLL_SPEED = "SET_AUTO_SCROLL_SPEED";
export const SET_CACHE_SHABAD = "SET_CACHE_SHABAD";
export const SET_BANI_ORDER = "SET_BANI_ORDER";
export const SET_BANI_LIST = "SET_BANI_LIST";
export const SET_SAVE_POSITION = "SET_SAVE_POSITION";

export const THEMES = ["Default", "Light", "Dark"];

export const FONT_SIZES = [
  { key: "EXTRA_SMALL", title: `${STRINGS.extra_small}` },
  { key: "SMALL", title: `${STRINGS.small_default}` },
  { key: "MEDIUM", title: `${STRINGS.medium}` },
  { key: "LARGE", title: `${STRINGS.large}` },
  { key: "EXTRA_LARGE", title: `${STRINGS.extra_large}` },
];
export const FONT_FACES = [
  { key: "AnmolLipiSG", title: `${STRINGS.anmol_lipi}` },
  { key: "GurbaniAkharTrue", title: `${STRINGS.gurbani_akhar_default}` },
  { key: "GurbaniAkharHeavyTrue", title: `${STRINGS.gurbani_akhar_heavy}` },
  { key: "GurbaniAkharThickTrue", title: `${STRINGS.gurbani_akhar_think}` },
];

export const LANGUAGES = [
  { key: "DEFAULT", title: `${STRINGS.default}` },
  { key: "en-US", title: constant.ENGLISH },
  { key: "es", title: constant.ESPANOL },
  { key: "fr", title: constant.FRANCAIS },
  { key: "it", title: constant.ITALIANO },
  { key: "hi", title: constant.HINDI },
  { key: "pa", title: constant.PUNJABI },
];

export const TRANSLITERATION_LANGUAGES = [
  { key: "ENGLISH", title: `${STRINGS.english}` },
  { key: "HINDI", title: STRINGS.hindi },
  { key: "SHAHMUKHI", title: STRINGS.shahmukhi },
  { key: "IPA", title: STRINGS.ipa },
];
export const BANI_LENGTHS = [
  { key: "SHORT", title: STRINGS.short },
  { key: "MEDIUM", title: STRINGS.medium },
  { key: "LONG", title: STRINGS.long },
  { key: "EXTRA_LONG", title: STRINGS.extra_long },
];

export const PADCHED_SETTINGS = [
  { key: "SAT_SUBHAM_SAR", title: STRINGS.sat_subham_sat_default },
  { key: "MAST_SABH_MAST", title: STRINGS.mast_sabh_mast },
];

export const VISHRAAM_OPTIONS = [
  { key: "VISHRAAM_COLORED", title: STRINGS.colored_words },
  { key: "VISHRAAM_GRADIENT", title: STRINGS.gradient_background },
];

export const VISHRAAM_SOURCES = [
  { key: "sttm", title: STRINGS.banidb_living_default },
  { key: "igurbani", title: STRINGS.iGurbani },
  { key: "sttm2", title: STRINGS.sttm2 },
];

export const REMINDER_SOUNDS = [
  {
    key: "default",
    title: STRINGS.default,
  },
  { key: "wake_up_jap.mp3", title: STRINGS.wake_up_jap },
  { key: "waheguru_soul.mp3", title: STRINGS.waheguru_soul },
];
export const toggleNightMode = (value) => {
  return { type: TOGGLE_NIGHT_MODE, value };
};

export function setFontSize(size) {
  return { type: SET_FONT_SIZE, size };
}
export function setFontFace(font) {
  return { type: SET_FONT_FACE, font };
}

export function setLanguage(language) {
  STRINGS.setLanguage(language);
  return { type: SET_LANGUAGE, language };
}
export function toggleTransliteration(value) {
  return { type: TOGGLE_TRANSLITERATION, value };
}
export function setTransliteration(language) {
  return { type: SET_TRANSLITERATION, language };
}
export function setTheme(theme) {
  return { type: SET_THEME, theme };
}

export function toggleAutoScroll(value) {
  return { type: TOGGLE_AUTO_SCROLL, value };
}

export function toggleStatusBar(value) {
  return { type: TOGGLE_STATUS_BAR, value };
}
export function toggleScreenAwake(value) {
  return { type: TOGGLE_SCREEN_AWAKE, value };
}

export function setBaniLength(length) {
  return { type: SET_BANI_LENGTH, length };
}
export function toggleLarivaar(value) {
  return { type: TOGGLE_LARIVAAR, value };
}

export function toggleLarivaarAssist(value) {
  return { type: TOGGLE_LARIVAAR_ASSIST, value };
}

export function toggleParagraphMode(value) {
  return { type: TOGGLE_PARAGRAPH_MODE, value };
}

export function setPadched(setting) {
  return { type: SET_PADCHHED, setting };
}

export function toggleVishraam(value) {
  return { type: TOGGLE_VISHRAAM, value };
}

export function setVishraamOption(option) {
  return { type: SET_VISHRAAM_OPTION, option };
}

export function setVishraamSource(source) {
  return { type: SET_VISHRAAM_SOURCE, source };
}

export function toggleStatistics(value) {
  return { type: TOGGLE_STATISTICS, value };
}

export function toggleEnglishTranslation(value) {
  return { type: TOGGLE_ENGLISH_TRANSLATION, value };
}

export function togglePunjabiTranslation(value) {
  return { type: TOGGLE_PUNJABI_TRANSLATION, value };
}
export function toggleSpanishTranslation(value) {
  return { type: TOGGLE_SPANISH_TRANSLATION, value };
}
export function setBookmarkPosition(value) {
  return { type: SET_BOOKMARK_POSITION, value };
}
export function toggleReminders(value) {
  return { type: TOGGLE_REMINDERS, value };
}

export function setReminderBanis(list) {
  return { type: SET_REMINDER_BANIS, list };
}
export function setReminderSound(sound) {
  return { type: SET_REMINDER_SOUND, sound };
}

export function setAutoScrollSpeed(speed, shabad) {
  const shabadSpeed = { [shabad]: speed };
  return { type: SET_AUTO_SCROLL_SPEED, shabadSpeed };
}
export function setCacheShabad(shabad, shabadID) {
  const cache = { [shabadID]: shabad };
  return { type: SET_CACHE_SHABAD, cache };
}

export function setBaniOrder(order) {
  return { type: SET_BANI_ORDER, order };
}

export function setBaniList(list) {
  return { type: SET_BANI_LIST, list };
}
export function setPosition(pos, shabadID) {
  const position = { [shabadID]: pos };
  return { type: SET_SAVE_POSITION, position };
}
