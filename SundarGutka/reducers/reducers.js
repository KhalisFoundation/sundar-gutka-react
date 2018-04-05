import { combineReducers } from "redux";
import {
  SET_FONT_SIZE,
  SET_FONT_FACE,
  TOGGLE_ROMANIZED,
  TOGGLE_ENGLISH_TRANSLATIONS,
  TOGGLE_NIGHT_MODE,
  TOGGLE_SCREEN_AWAKE,
  SET_BANI_LENGTH,
  TOGGLE_LARIVAAR,
  SET_MANGLACHARAN_POSITION,
  SET_PADCHHED_SETTINGS,
  TOGGLE_STATISTICS
} from "../actions/actions";

function fontSize(state = "SMALL", action) {
  switch (action.type) {
    case SET_FONT_SIZE:
      return action.size;
    default:
      return state;
  }
}

function fontFace(state = "GURBANI_AKHAR", action) {
  switch (action.type) {
    case SET_FONT_FACE:
      return action.font;
    default:
      return state;
  }
}

function romanized(state = false, action) {
  switch (action.type) {
    case TOGGLE_ROMANIZED:
      return action.value;
    default:
      return state;
  }
}

function englishTranslations(state = false, action) {
  switch (action.type) {
    case TOGGLE_ENGLISH_TRANSLATIONS:
      return action.value;
    default:
      return state;
  }
}

function nightMode(state = false, action) {
  switch (action.type) {
    case TOGGLE_NIGHT_MODE:
      return action.value;
    default:
      return state;
  }
}

function screenAwake(state = false, action) {
  switch (action.type) {
    case TOGGLE_SCREEN_AWAKE:
      return action.value;
    default:
      return state;
  }
}

function baniLength(state = "LONG", action) {
  switch (action.type) {
    case SET_BANI_LENGTH:
      return action.length;
    default:
      return state;
  }
}

function larivaar(state = false, action) {
  switch (action.type) {
    case TOGGLE_LARIVAAR:
      return action.value;
    default:
      return state;
  }
}

function manglacharanPosition(state = "CURRENT_SAROOPS", action) {
  switch (action.type) {
    case SET_MANGLACHARAN_POSITION:
      return action.position;
    default:
      return state;
  }
}

function padchhedSetting(state = "SAT_SUBHAM_SAT", action) {
  switch (action.type) {
    case SET_PADCHHED_SETTINGS:
      return action.setting;
    default:
      return state;
  }
}

function statistics(state = true, action) {
  switch (action.type) {
    case TOGGLE_STATISTICS:
      return action.value;
    default:
      return state;
  }
}

// Combine all the reducers
const rootReducer = combineReducers({
  fontSize,
  fontFace,
  romanized,
  englishTranslations,
  nightMode,
  screenAwake,
  baniLength,
  larivaar,
  manglacharanPosition,
  padchhedSetting,
  statistics
});

export default rootReducer;
