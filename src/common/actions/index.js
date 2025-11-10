import constant from "../constant";
import { trackSettingEvent } from "../firebase/analytics";
import STRINGS from "../localization";
import * as actionTypes from "./actionTypes";

export const toggleNightMode = (value) => {
  trackSettingEvent(constant.NIGHT_MODE, value);
  return { type: actionTypes.TOGGLE_NIGHT_MODE, value };
};

export const setFontSize = (value) => {
  trackSettingEvent(constant.FONT_SIZE, value);
  return { type: actionTypes.SET_FONT_SIZE, value };
};
export const setFontFace = (value) => {
  trackSettingEvent(constant.FONT_FACE, value);
  return { type: actionTypes.SET_FONT_FACE, value };
};

export const setLanguage = (value) => {
  trackSettingEvent(constant.LANGUAGE, value);
  STRINGS.setLanguage(value);
  return { type: actionTypes.SET_LANGUAGE, value };
};
export const toggleTransliteration = (value) => {
  trackSettingEvent(constant.TRANSLITERATION, value);
  return { type: actionTypes.TOGGLE_TRANSLITERATION, value };
};
export const setTransliteration = (value) => {
  trackSettingEvent(constant.TRANSLITERATION, value);
  return { type: actionTypes.SET_TRANSLITERATION, value };
};
export const setTheme = (value) => {
  trackSettingEvent(constant.THEME, value);
  return { type: actionTypes.SET_THEME, value };
};

export const toggleAutoScroll = (value) => {
  trackSettingEvent(constant.AUTO_SCROLL, value);
  return { type: actionTypes.TOGGLE_AUTO_SCROLL, value };
};

export const toggleAudio = (value) => {
  trackSettingEvent(constant.AUDIO, value);
  return { type: actionTypes.TOGGLE_AUDIO, value };
};

export const toggleAudioAutoPlay = (value) => {
  trackSettingEvent(constant.AUDIO_AUTO_PLAY, value);
  return { type: actionTypes.TOGGLE_AUDIO_AUTO_PLAY, value };
};

export const toggleAudioSyncScroll = (value) => {
  trackSettingEvent(constant.AUDIO_SYNC_SCROLL, value);
  return { type: actionTypes.TOGGLE_AUDIO_SYNC_SCROLL, value };
};

export const setDefaultAudio = (audio, shabadId) => {
  const value = { [shabadId]: audio };
  return { type: actionTypes.SET_DEFAULT_AUDIO, value };
};

export const setAudioPlaybackSpeed = (value) => {
  trackSettingEvent("AUDIO_PLAYBACK_SPEED", value);
  return { type: actionTypes.SET_AUDIO_PLAYBACK_SPEED, value };
};

export const setCurrentBani = (bani) => {
  return { type: actionTypes.SET_CURRENT_BANI, value: bani };
};

export const toggleStatusBar = (value) => {
  trackSettingEvent(constant.STATUS_BAR, value);
  return { type: actionTypes.TOGGLE_STATUS_BAR, value };
};
export const toggleScreenAwake = (value) => {
  trackSettingEvent(constant.KEEP_AWAKE, value);
  return { type: actionTypes.TOGGLE_SCREEN_AWAKE, value };
};

export const setBaniLength = (value) => {
  trackSettingEvent(constant.BANI_LENGTH, value);
  return { type: actionTypes.SET_BANI_LENGTH, value };
};
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

export const setPadched = (value) => {
  trackSettingEvent(constant.PADCHED, value);
  return { type: actionTypes.SET_PADCHHED, value };
};

export const toggleVishraam = (value) => {
  trackSettingEvent(constant.VISHRAAM, value);
  return { type: actionTypes.TOGGLE_VISHRAAM, value };
};

export const setVishraamOption = (value) => {
  trackSettingEvent(constant.VISHRAAM_OPTION, value);
  return { type: actionTypes.SET_VISHRAAM_OPTION, value };
};

export const setVishraamSource = (value) => {
  trackSettingEvent(constant.VISHRAAM_SOURCE, value);
  return { type: actionTypes.SET_VISHRAAM_SOURCE, value };
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

export const setReminderBanis = (value) => {
  return { type: actionTypes.SET_REMINDER_BANIS, value };
};
export const setReminderSound = (value) => {
  trackSettingEvent(constant.REMINDER_SOUND, value);
  return { type: actionTypes.SET_REMINDER_SOUND, value };
};

export const setAutoScrollSpeed = (speed, shabad) => {
  const value = { [shabad]: speed };
  return { type: actionTypes.SET_AUTO_SCROLL_SPEED, value };
};
export const setBaniOrder = (value) => {
  return { type: actionTypes.SET_BANI_ORDER, value };
};

export const setBaniList = (value) => {
  return { type: actionTypes.SET_BANI_LIST, value };
};

export const setPosition = (pos, shabadID) => {
  const value = { [shabadID]: pos };
  return { type: actionTypes.SET_SAVE_POSITION, value };
};

export const setScrollPosition = (value) => {
  return { type: actionTypes.SET_SCROLL_POSITION, value };
};
export const toggleHeaderFooter = (value) => {
  return { type: actionTypes.TOGGLE_HEADER_FOOTER, value };
};

export const toggleDatabaseUpdateAvailable = (value) => {
  return { type: actionTypes.TOGGLE_DATABASE_UPDATE_AVAILABLE, value };
};

// Manifest actions
export const setAudioManifest = (baniId, tracks) => {
  return {
    type: actionTypes.SET_AUDIO_MANIFEST,
    payload: { baniId, tracks },
  };
};

export const updateAudioManifest = (baniId, tracks) => {
  return {
    type: actionTypes.UPDATE_AUDIO_MANIFEST,
    payload: { baniId, tracks },
  };
};

export const clearAudioManifest = (baniId) => {
  return {
    type: actionTypes.CLEAR_AUDIO_MANIFEST,
    payload: { baniId },
  };
};

export const deleteManifestTrack = (baniId, trackId) => {
  return {
    type: actionTypes.DELETE_MANIFEST_TRACK,
    payload: { baniId, trackId },
  };
};
