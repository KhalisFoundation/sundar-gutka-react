import { combineReducers } from "redux";
import {
  TOGGLE_NIGHT_MODE,
  SET_FONT_SIZE,
  SET_FONT_FACE,
  SET_LANGUAGE,
  SET_TRANSLITERATION,
  TOGGLE_TRANSLITERATION,
  SET_THEME,
  TOGGLE_AUTO_SCROLL,
  TOGGLE_STATUS_BAR,
  TOGGLE_SCREEN_AWAKE,
  SET_BANI_LENGTH,
  TOGGLE_LARIVAAR,
  TOGGLE_LARIVAAR_ASSIST,
  TOGGLE_PARAGRAPH_MODE,
  SET_PADCHHED,
  TOGGLE_VISHRAAM,
  SET_VISHRAAM_OPTION,
  SET_VISHRAAM_SOURCE,
  TOGGLE_STATISTICS,
  TOGGLE_ENGLISH_TRANSLATION,
  TOGGLE_PUNJABI_TRANSLATION,
  TOGGLE_SPANISH_TRANSLATION,
  SET_BOOKMARK_POSITION,
  TOGGLE_REMINDERS,
  SET_REMINDER_BANIS,
  SET_REMINDER_SOUND,
  SET_AUTO_SCROLL_SPEED,
  SET_CACHE_SHABAD,
  SET_SAVE_POSITION,
} from "./actions";
import constant from "./constant";

const createReducer =
  (initialState, handlers) =>
  (state = initialState, action) => {
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };

const isNightMode = createReducer(false, {
  [TOGGLE_NIGHT_MODE]: (state, action) => action.value,
});

const fontSize = createReducer(constant.SMALL, {
  [SET_FONT_SIZE]: (state, action) => action.size,
});

const transliterationLanguage = createReducer(constant.ENGLISH, {
  [SET_TRANSLITERATION]: (state, action) => action.language,
});

const fontFace = createReducer(constant.GURBANI_AKHAR_TRUE, {
  [SET_FONT_FACE]: (state, action) => action.font,
});
const language = createReducer(constant.Default.toUpperCase(), {
  [SET_LANGUAGE]: (state, action) => action.language,
});

const isTransliteration = createReducer(false, {
  [TOGGLE_TRANSLITERATION]: (state, action) => action.value,
});

const theme = createReducer(constant.Default, {
  [SET_THEME]: (state, action) => action.theme,
});

const isStatusBar = createReducer(false, {
  [TOGGLE_STATUS_BAR]: (state, action) => action.value,
});

const isScreenAwake = createReducer(false, {
  [TOGGLE_SCREEN_AWAKE]: (state, action) => action.value,
});

const isAutoScroll = createReducer(false, {
  [TOGGLE_AUTO_SCROLL]: (state, action) => action.value,
});

const baniLength = createReducer("", {
  [SET_BANI_LENGTH]: (state, action) => action.length,
});

const isLarivaar = createReducer(false, {
  [TOGGLE_LARIVAAR]: (state, action) => action.value,
});

const isLarivaarAssist = createReducer(false, {
  [TOGGLE_LARIVAAR_ASSIST]: (state, action) => action.value,
});

const isParagraphMode = createReducer(false, {
  [TOGGLE_PARAGRAPH_MODE]: (state, action) => action.value,
});

const padched = createReducer(constant.SAT_SUBHAM_SAT, {
  [SET_PADCHHED]: (state, action) => action.setting,
});

const isVishraam = createReducer(false, {
  [TOGGLE_VISHRAAM]: (state, action) => action.value,
});

const vishraamOption = createReducer(constant.VISHRAAM_COLORED, {
  [SET_VISHRAAM_OPTION]: (state, action) => action.option,
});

const vishraamSource = createReducer(constant.sttm, {
  [SET_VISHRAAM_SOURCE]: (state, action) => action.source,
});

const isStatistics = createReducer(false, {
  [TOGGLE_STATISTICS]: (state, action) => action.value,
});

const isEnglishTranslation = createReducer(false, {
  [TOGGLE_ENGLISH_TRANSLATION]: (state, action) => action.value,
});

const isSpanishTranslation = createReducer(false, {
  [TOGGLE_SPANISH_TRANSLATION]: (state, action) => action.value,
});

const isPunjabiTranslation = createReducer(false, {
  [TOGGLE_PUNJABI_TRANSLATION]: (state, action) => action.value,
});

const bookmarkPosition = createReducer(0, {
  [SET_BOOKMARK_POSITION]: (state, action) => action.value,
});

const isReminders = createReducer(false, {
  [TOGGLE_REMINDERS]: (state, action) => action.value,
});

const reminderBanis = createReducer(JSON.stringify([]), {
  [SET_REMINDER_BANIS]: (state, action) => action.list,
});

const reminderSound = createReducer(constant.Default.toLowerCase(), {
  [SET_REMINDER_SOUND]: (state, action) => action.sound,
});
function autoScrollSpeedObj(state = {}, action) {
  switch (action.type) {
    case SET_AUTO_SCROLL_SPEED:
      return { ...state, ...action.shabadSpeed };
    default:
      return state;
  }
}

function cacheShabad(state = {}, action) {
  switch (action.type) {
    case SET_CACHE_SHABAD:
      return { ...state, ...action.cache };
    default:
      return state;
  }
}
function savePosition(state = {}, action) {
  switch (action.type) {
    case SET_SAVE_POSITION:
      return { ...state, ...action.position };
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  isNightMode,
  fontSize,
  fontFace,
  language,
  transliterationLanguage,
  isTransliteration,
  theme,
  isAutoScroll,
  isScreenAwake,
  isStatusBar,
  baniLength,
  isLarivaar,
  isLarivaarAssist,
  isParagraphMode,
  padched,
  isVishraam,
  vishraamOption,
  vishraamSource,
  isStatistics,
  isEnglishTranslation,
  isPunjabiTranslation,
  isSpanishTranslation,
  bookmarkPosition,
  isReminders,
  reminderBanis,
  reminderSound,
  autoScrollSpeedObj,
  cacheShabad,
  savePosition,
});
export default rootReducer;
