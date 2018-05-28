import { combineReducers } from "redux";
import { defaultBaniOrderArray } from "../utils/helpers";
import {
  SET_FONT_SIZE,
  SET_FONT_FACE,
  TOGGLE_ROMANIZED,
  TOGGLE_ENGLISH_TRANSLATIONS,
  TOGGLE_NIGHT_MODE,
  TOGGLE_SCREEN_AWAKE,
  SET_BANI_ORDER,
  SET_BANI_LENGTH,
  TOGGLE_LARIVAAR,
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
  TOGGLE_VISRAM
} from "../actions/actions";

function fontSize(state = "SMALL", action) {
  switch (action.type) {
    case SET_FONT_SIZE:
      return action.size;
    default:
      return state;
  }
}

function fontFace(state = "GurbaniAkharSG", action) {
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

function baniOrder(state = defaultBaniOrderArray, action) {
  switch (action.type) {
    case SET_BANI_ORDER:
      return action.order;
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

function autoScrollSpeed(state = 10, action) {
  switch (action.type) {
    case SET_AUTO_SCROLL_SPEED:
      return action.speed;
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

// Combine all the reducers
const rootReducer = combineReducers({
  fontSize,
  fontFace,
  romanized,
  englishTranslations,
  nightMode,
  screenAwake,
  baniOrder,
  baniLength,
  larivaar,
  manglacharanPosition,
  padchhedSetting,
  statistics,
  mergedBaniData,
  currentShabad,
  scrollIndex,
  statusBar,
  paragraphMode,
  autoScroll,
  autoScrollSpeed,
  visram
});

export default rootReducer;
