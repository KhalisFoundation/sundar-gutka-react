/*
 * action types
 */
 
export const TOGGLE_NIGHT_MODE = 'TOGGLE_NIGHT_MODE'

/*
 * other constants
 */
 
// export const VisibilityFilters = {
//   SHOW_ALL: 'SHOW_ALL',
//   SHOW_COMPLETED: 'SHOW_COMPLETED',
//   SHOW_ACTIVE: 'SHOW_ACTIVE'
// }
 
/*
 * action creators
 */
 
// export function addTodo(text) {
//   return { type: ADD_TODO, text }
// }
 
export function toggleNightMode(value) {
  return { type: TOGGLE_NIGHT_MODE, value }
}
 
// export function setVisibilityFilter(filter) {
//   return { type: SET_VISIBILITY_FILTER, filter }
// }