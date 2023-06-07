import { combineReducers } from "redux";
import { TOGGLE_NIGHT_MODE, SET_FONT_SIZE } from "./actions";
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
const rootReducer = combineReducers({
  isNightMode,
  fontSize,
});
export default rootReducer;

// import { combineReducers } from "redux";

// const rootReducer = combineReducers({
//   // Add more reducers here if needed
// });

// export default rootReducer;
