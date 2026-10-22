/**
 * Resolves to `fallback` if `promise` has not settled within `ms`.
 *
 * For the places where waiting is worth a moment but never worth the user's
 * whole interaction: a permission probe on a slow device, a last sync before
 * signing out on a phone with one bar. A rejection is the same as a timeout —
 * both mean "no answer", and the caller wants the fallback either way.
 *
 * Shared rather than copied: the download manager and the sign-out flush want
 * exactly this, and two copies would drift.
 */
const withDeadline = (promise, ms, fallback) =>
  Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);

export default withDeadline;
