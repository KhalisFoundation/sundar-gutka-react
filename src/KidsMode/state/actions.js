import * as actionTypes from "@common/actions/actionTypes";

export const toggleKidsMode = (value) => ({ type: actionTypes.KIDS_MODE_TOGGLE, value });

export const setKidsScoringOptIn = (value) => ({
  type: actionTypes.KIDS_MODE_SCORING_OPT_IN,
  value,
});

export const setKidsExperience = (value) => ({
  type: actionTypes.KIDS_MODE_SET_EXPERIENCE,
  value,
});

export const setKidsReciter = (id) => ({ type: actionTypes.KIDS_MODE_SET_RECITER, value: id });
