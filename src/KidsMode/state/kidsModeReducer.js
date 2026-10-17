import * as actionTypes from "@common/actions/actionTypes";

const initialState = { enabled: false, scoringOptIn: false, reciter: null, progress: {} };

const kidsMode = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.KIDS_MODE_TOGGLE:
      return { ...state, enabled: action.value };
    case actionTypes.KIDS_MODE_SCORING_OPT_IN:
      return { ...state, scoringOptIn: action.value };
    case actionTypes.KIDS_MODE_SET_RECITER:
      return { ...state, reciter: action.value };
    default:
      return state;
  }
};

export default kidsMode;
