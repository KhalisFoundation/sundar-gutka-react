import { combineReducers } from "redux";
import { TOGGLE_NIGHT_MODE } from "../actions/actions";

function nightMode(state = false, action) {
  console.log("reducing", action.value);
  switch (action.type) {
    case TOGGLE_NIGHT_MODE:
      return action.value;
    default:
      return state;
  }
}

// Combine all the reducers
const rootReducer = combineReducers({
  nightMode
});

export default rootReducer;
