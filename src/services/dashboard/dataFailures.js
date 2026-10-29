// Thrown by services when every source they have was asked and none had an
// answer — the day's hukamnama not published yet, a feed empty. Not a fault:
// whatever failed behind it was already logged where it happened, so this is a
// state for the card to render, never an error of its own. Sits beside
// OfflineError (connectivity.js), the other answer a section renders as a
// state.
export class UnavailableError extends Error {
  constructor(message = "unavailable") {
    super(message);
    this.name = "UnavailableError";
    this.unavailable = true;
  }
}

/**
 * True for the two answers a dashboard section shows as a state rather than
 * reports: offline, and nothing to show. Read from the flags, not the classes,
 * so a section can ask without importing every service that might throw.
 */
export const isExpectedDataFailure = (error) => Boolean(error?.offline || error?.unavailable);

export default UnavailableError;
