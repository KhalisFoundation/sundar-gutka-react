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
} from "./actions";
import constant from "./constant";

function isNightMode(state = false, action) {
  switch (action.type) {
    case TOGGLE_NIGHT_MODE:
      return action.value;
    default:
      return state;
  }
}
function fontSize(state = constant.SMALL, action) {
  switch (action.type) {
    case SET_FONT_SIZE:
      return action.size;
    default:
      return state;
  }
}
function fontFace(state = constant.GURBANI_AKHAR_TRUE, action) {
  switch (action.type) {
    case SET_FONT_FACE:
      return action.font;
    default:
      return state;
  }
}
function language(state = constant.DEFAULT, action) {
  switch (action.type) {
    case SET_LANGUAGE:
      return action.language;
    default:
      return state;
  }
}
function isTransliteration(state = false, action) {
  switch (action.type) {
    case TOGGLE_TRANSLITERATION:
      return action.value;
    default:
      return state;
  }
}

function transliterationLanguage(state = constant.ENGLISH, action) {
  switch (action.type) {
    case SET_TRANSLITERATION:
      return action.language;
    default:
      return state;
  }
}
function theme(state = constant.Default, action) {
  switch (action.type) {
    case SET_THEME:
      return action.theme;
    default:
      return state;
  }
}
function isStatusBar(state = false, action) {
  switch (action.type) {
    case TOGGLE_STATUS_BAR:
      return action.value;
    default:
      return state;
  }
}

function isScreenAwake(state = false, action) {
  switch (action.type) {
    case TOGGLE_SCREEN_AWAKE:
      return action.value;
    default:
      return state;
  }
}
function isAutoScroll(state = false, action) {
  switch (action.type) {
    case TOGGLE_AUTO_SCROLL:
      return action.value;
    default:
      return state;
  }
}
function baniLength(state = "", action) {
  switch (action.type) {
    case SET_BANI_LENGTH:
      return action.length;
    default:
      return state;
  }
}
function isLarivaar(state = false, action) {
  switch (action.type) {
    case TOGGLE_LARIVAAR:
      return action.value;
    default:
      return state;
  }
}

function isLarivaarAssist(state = false, action) {
  switch (action.type) {
    case TOGGLE_LARIVAAR_ASSIST:
      return action.value;
    default:
      return state;
  }
}
function isParagraphMode(state = false, action) {
  switch (action.type) {
    case TOGGLE_PARAGRAPH_MODE:
      return action.value;
    default:
      return state;
  }
}
function padched(state = constant.SAT_SUBHAM_SAT, action) {
  switch (action.type) {
    case SET_PADCHHED:
      return action.setting;
    default:
      return state;
  }
}
function isVishraam(state = false, action) {
  switch (action.type) {
    case TOGGLE_VISHRAAM:
      return action.value;
    default:
      return state;
  }
}
function vishraamOption(state = "VISHRAAM_COLORED", action) {
  switch (action.type) {
    case SET_VISHRAAM_OPTION:
      return action.option;
    default:
      return state;
  }
}

function vishraamSource(state = "sttm", action) {
  switch (action.type) {
    case SET_VISHRAAM_SOURCE:
      return action.source;
    default:
      return state;
  }
}

function isStatistics(state = true, action) {
  switch (action.type) {
    case TOGGLE_STATISTICS:
      return action.value;
    default:
      return state;
  }
}
function isEnglishTranslation(state = false, action) {
  switch (action.type) {
    case TOGGLE_ENGLISH_TRANSLATION:
      return action.value;
    default:
      return state;
  }
}
function isPunjabiTranslation(state = false, action) {
  switch (action.type) {
    case TOGGLE_PUNJABI_TRANSLATION:
      return action.value;
    default:
      return state;
  }
}
function isSpanishTranslation(state = false, action) {
  switch (action.type) {
    case TOGGLE_SPANISH_TRANSLATION:
      return action.value;
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
});
export default rootReducer;
