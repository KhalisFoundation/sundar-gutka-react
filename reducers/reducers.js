import { combineReducers } from "redux";
import { defaultBaniOrderArray } from "../utils/helpers";
import {
  SET_FONT_SIZE,
  SET_FONT_FACE,
  SET_LANGUAGE,
  TOGGLE_TRANSLITERATION,
  SET_TRANSLITERATION_LANGUAGE,
  TOGGLE_ENGLISH_TRANSLATIONS,
  TOGGLE_PUNJABI_TRANSLATIONS,
  TOGGLE_SPANISH_TRANSLATIONS,
  TOGGLE_NIGHT_MODE,
  TOGGLE_SCREEN_AWAKE,
  SET_BANI_ORDER,
  SET_BANI_LENGTH,
  TOGGLE_LARIVAAR,
  TOGGLE_LARIVAAR_ASSIST,
  SET_MANGLACHARAN_POSITION,
  SET_PADCHHED_SETTINGS,
  TOGGLE_STATISTICS,
  SET_MERGED_BANI_DATA,
  SET_CURRENT_SHABAD,
  SET_SCROLL_INDEX,
  TOGGLE_STATUS_BAR,
  TOGGLE_PARAGRAPH_MODE,
  TOGGLE_AUTO_SCROLL,
  SET_AUTO_SCROLL_SPEED,
  TOGGLE_VISRAM,
  SET_VISHRAAM_OPTION,
  SET_VISHRAAM_SOURCE,
  TOGGLE_REMINDERS,
  SET_REMINDER_BANIS,
  SET_REMINDER_SOUND,
  SET_APP_VERSION,
  SET_START_BANI
} from "../actions/actions";

function fontSize(state = "SMALL", action) {
  switch (action.type) {
    case SET_FONT_SIZE:
      return action.size;
    default:
      return state;
  }
}

function fontFace(state = "GurbaniAkharTrue", action) {
  switch (action.type) {
    case SET_FONT_FACE:
      return action.font;
    default:
      return state;
  }
}

function language(state = "DEFAULT", action) {
  switch (action.type) {
    case SET_LANGUAGE:
      return action.language;
    default:
      return state;
  }
}

function transliteration(state = false, action) {
  switch (action.type) {
    case TOGGLE_TRANSLITERATION:
      return action.value;
    default:
      return state;
  }
}

function transliterationLanguage(state = "ENGLISH", action) {
  switch (action.type) {
    case SET_TRANSLITERATION_LANGUAGE:
      return action.language;
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

function punjabiTranslations(state = false, action) {
  switch (action.type) {
    case TOGGLE_PUNJABI_TRANSLATIONS:
      return action.value;
    default:
      return state;
  }
}

function spanishTranslations(state = false, action) {
  switch (action.type) {
    case TOGGLE_SPANISH_TRANSLATIONS:
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

function baniOrder(state = defaultBaniOrderArray, action) {
  switch (action.type) {
    case SET_BANI_ORDER:
      return action.order;
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

function larivaar(state = false, action) {
  switch (action.type) {
    case TOGGLE_LARIVAAR:
      return action.value;
    default:
      return state;
  }
}

function larivaarAssist(state = false, action) {
  switch (action.type) {
    case TOGGLE_LARIVAAR_ASSIST:
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

function mergedBaniData(state = null, action) {
  switch (action.type) {
    case SET_MERGED_BANI_DATA:
      return action.list;
    default:
      return state;
  }
}

function currentShabad(state = null, action) {
  switch (action.type) {
    case SET_CURRENT_SHABAD:
      return action.shabadId;
    default:
      return state;
  }
}

function scrollIndex(state = -1, action) {
  switch (action.type) {
    case SET_SCROLL_INDEX:
      return action.index;
    default:
      return state;
  }
}

function statusBar(state = true, action) {
  switch (action.type) {
    case TOGGLE_STATUS_BAR:
      return action.hidden;
    default:
      return state;
  }
}

function paragraphMode(state = true, action) {
  switch (action.type) {
    case TOGGLE_PARAGRAPH_MODE:
      return action.paragraph;
    default:
      return state;
  }
}

function autoScroll(state = false, action) {
  switch (action.type) {
    case TOGGLE_AUTO_SCROLL:
      return action.value;
    default:
      return state;
  }
}

function autoScrollShabadSpeed(state = {}, action) {
  switch (action.type) {
    case SET_AUTO_SCROLL_SPEED:
      return Object.assign({}, state, action.shabadSpeed);
    default:
      return state;
  }
}

function visram(state = false, action) {
  switch (action.type) {
    case TOGGLE_VISRAM:
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

function reminders(state = false, action) {
  switch (action.type) {
    case TOGGLE_REMINDERS:
      return action.value;
    default:
      return state;
  }
}

function reminderBanis(state = JSON.stringify([]), action) {
  switch (action.type) {
    case SET_REMINDER_BANIS:
      return action.list;
    default:
      return state;
  }
}

function reminderSound(state = "default", action) {
  switch (action.type) {
    case SET_REMINDER_SOUND:
      return action.sound;
    default:
      return state;
  }
}

function appVersion(state = "", action) {
  switch (action.type) {
    case SET_APP_VERSION:
      return action.version;
    default:
      return state;
  }
}
function startBani(state = JSON.stringify([]), action) {
  switch (action.type) {
    case SET_START_BANI:
      return action.progressList
    default:
      return state
  }
}

function statusBar(state = true, action) {
  switch (action.type) {
    case TOGGLE_STATUS_BAR:
      return action.hidden;
    default:
      return state;
  }
}

// Combine all the reducers
const rootReducer = combineReducers({
  fontSize,
  fontFace,
  language,
  transliteration,
  transliterationLanguage,
  englishTranslations,
  punjabiTranslations,
  spanishTranslations,
  nightMode,
  screenAwake,
  baniOrder,
  baniLength,
  larivaar,
  larivaarAssist,
  manglacharanPosition,
  padchhedSetting,
  statistics,
  mergedBaniData,
  currentShabad,
  scrollIndex,
  statusBar,
  paragraphMode,
  autoScroll,
  autoScrollShabadSpeed,
  visram,
  vishraamOption,
  vishraamSource,
  reminders,
  reminderBanis,
  reminderSound,
  appVersion,
  startBani,
  statusBar
});

export default rootReducer;
