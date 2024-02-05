import { combineReducers } from "redux";
import * as actionTypes from "./actions/actionTypes";
import { fetchDefaultBaniOrder } from "./components/BaniList/baniOrderHelper";
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
  [actionTypes.TOGGLE_NIGHT_MODE]: (state, action) => action.value,
});

const fontSize = createReducer(constant.SMALL, {
  [actionTypes.SET_FONT_SIZE]: (state, action) => action.size,
});

const transliterationLanguage = createReducer(constant.ENGLISH, {
  [actionTypes.SET_TRANSLITERATION]: (state, action) => action.language,
});

const fontFace = createReducer(constant.GURBANI_AKHAR_TRUE, {
  [actionTypes.SET_FONT_FACE]: (state, action) => action.font,
});
const language = createReducer(constant.Default.toUpperCase(), {
  [actionTypes.SET_LANGUAGE]: (state, action) => action.language,
});

const isTransliteration = createReducer(false, {
  [actionTypes.TOGGLE_TRANSLITERATION]: (state, action) => action.value,
});

const theme = createReducer(constant.Default, {
  [actionTypes.SET_THEME]: (state, action) => action.theme,
});

const isStatusBar = createReducer(false, {
  [actionTypes.TOGGLE_STATUS_BAR]: (state, action) => action.value,
});

const isScreenAwake = createReducer(false, {
  [actionTypes.TOGGLE_SCREEN_AWAKE]: (state, action) => action.value,
});

const isAutoScroll = createReducer(false, {
  [actionTypes.TOGGLE_AUTO_SCROLL]: (state, action) => action.value,
});

const baniLength = createReducer("", {
  [actionTypes.SET_BANI_LENGTH]: (state, action) => action.length,
});

const isLarivaar = createReducer(false, {
  [actionTypes.TOGGLE_LARIVAAR]: (state, action) => action.value,
});

const isLarivaarAssist = createReducer(false, {
  [actionTypes.TOGGLE_LARIVAAR_ASSIST]: (state, action) => action.value,
});

const isParagraphMode = createReducer(false, {
  [actionTypes.TOGGLE_PARAGRAPH_MODE]: (state, action) => action.value,
});

const padched = createReducer(constant.SAT_SUBHAM_SAT, {
  [actionTypes.SET_PADCHHED]: (state, action) => action.setting,
});

const isVishraam = createReducer(false, {
  [actionTypes.TOGGLE_VISHRAAM]: (state, action) => action.value,
});

const vishraamOption = createReducer(constant.VISHRAAM_COLORED, {
  [actionTypes.SET_VISHRAAM_OPTION]: (state, action) => action.option,
});

const vishraamSource = createReducer(constant.sttm, {
  [actionTypes.SET_VISHRAAM_SOURCE]: (state, action) => action.source,
});

const isStatistics = createReducer(true, {
  [actionTypes.TOGGLE_STATISTICS]: (state, action) => action.value,
});

const isEnglishTranslation = createReducer(false, {
  [actionTypes.TOGGLE_ENGLISH_TRANSLATION]: (state, action) => action.value,
});

const isSpanishTranslation = createReducer(false, {
  [actionTypes.TOGGLE_SPANISH_TRANSLATION]: (state, action) => action.value,
});

const isPunjabiTranslation = createReducer(false, {
  [actionTypes.TOGGLE_PUNJABI_TRANSLATION]: (state, action) => action.value,
});

const bookmarkPosition = createReducer(0, {
  [actionTypes.SET_BOOKMARK_POSITION]: (state, action) => action.value,
});

const isReminders = createReducer(false, {
  [actionTypes.TOGGLE_REMINDERS]: (state, action) => action.value,
});

const reminderBanis = createReducer(JSON.stringify([]), {
  [actionTypes.SET_REMINDER_BANIS]: (state, action) => action.list,
});

const reminderSound = createReducer(constant.Default.toLowerCase(), {
  [actionTypes.SET_REMINDER_SOUND]: (state, action) => action.sound,
});
const autoScrollSpeedObj = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_AUTO_SCROLL_SPEED:
      return { ...state, ...action.shabadSpeed };
    default:
      return state;
  }
};

const cacheShabad = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_CACHE_SHABAD:
      return { ...state, ...action.cache };
    default:
      return state;
  }
};
const baniOrder = (state = fetchDefaultBaniOrder(), action) => {
  switch (action.type) {
    case actionTypes.SET_BANI_ORDER:
      return action.order;
    default:
      return state;
  }
};

const baniList = (state = [], action) => {
  switch (action.type) {
    case actionTypes.SET_BANI_LIST:
      return action.list;
    default:
      return state;
  }
};
const savePosition = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_SAVE_POSITION:
      return { ...state, ...action.position };
    default:
      return state;
  }
};
const scrollPosition = (state = 0, action) => {
  switch (action.type) {
    case actionTypes.SET_SCROLL_POSITION:
      return action.position;
    default:
      return state;
  }
};

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
  baniOrder,
  baniList,
  savePosition,
  scrollPosition,
});
export default rootReducer;
