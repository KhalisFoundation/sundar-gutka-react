import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { requestFlush } from "../../services/dashboard/syncSignal";
import { syncAll } from "../../services/sync/syncRegistry";
import { setAuthBusy } from "../actions";
import { showConfirm } from "../components/ConfirmDialog";
import { trackSsoEvent } from "../firebase/analytics";
import STRINGS from "../localization";
import { destroyLocalAccountData, leaveLocalAccount } from "../sso/accountScope";
import { requestAccountDeletion } from "../sso/deleteAccount";
import { startLogin, startLogout } from "../sso/khalisSso";
import { beginSession, endSession } from "../sso/session";
import { readToken } from "../sso/tokenStore";
import { showErrorToast, showInfoToast } from "../toast";
import withDeadline from "../withDeadline";

// How long a sign-out waits for the last push before giving up on it. Long
// enough for one round trip on a slow connection, short enough that nobody
// watching a spinner thinks the app has hung.
const SIGN_OUT_FLUSH_MS = 6000;

/**
 * Sign-in / sign-out actions for the Settings account row (and, with the
 * Dashboard, its header avatar), so the busy-state, toast and dispatch handling
 * lives in exactly one place.
 *
 * Session *restoration* and expiry are not here — those belong to
 * useSsoSession, which owns the lifecycle for the whole app.
 *
 * `entryPoint` names the surface the action was started from and rides along on
 * every event: the dashboard avatar and the Settings row convert very
 * differently, and one combined total hides which of them is doing the work.
 */
const useSsoActions = ({ entryPoint = "unknown" } = {}) => {
  const dispatch = useDispatch();
  const { status, user, busy } = useSelector((state) => state.auth);

  const signIn = useCallback(async () => {
    if (busy) return;
    dispatch(setAuthBusy(true));
    trackSsoEvent("sign_in_started", { entry_point: entryPoint });
    try {
      const result = await startLogin();
      // One event per outcome, so the funnel shows where sign-ins are lost.
      trackSsoEvent(`sign_in_${result.status === "error" ? "failed" : result.status}`, {
        entry_point: entryPoint,
      });
      if (result.status === "success") {
        // Through the session's own begin, as a redirect caught by
        // useSsoSession is: the account check, then the session, then its
        // expiry timer. On iOS the browser hands the URL straight back and no
        // Linking event fires, so this is the ONLY path a sign-in takes there.
        // On Android both paths run; the account checks run one at a time and
        // the second finds the owner already recorded.
        await beginSession(result.user, result.expiresAt);
      } else if (result.status === "error") {
        showErrorToast(STRINGS.SIGN_IN_FAILED);
      }
      // "cancelled" — deliberate user action, stay silent.
      // "pending"  — the system browser took over; useSsoSession's deep-link
      //              listener completes the session when it returns.
    } finally {
      dispatch(setAuthBusy(false));
    }
  }, [busy, dispatch, entryPoint]);

  const signOut = useCallback(() => {
    if (busy) return;
    showConfirm({
      title: STRINGS.SIGN_OUT_CONFIRM_TITLE,
      message: STRINGS.SIGN_OUT_CONFIRM_MESSAGE,
      cancelText: STRINGS.CANCEL,
      confirmText: STRINGS.SIGN_OUT,
      destructive: true,
      onConfirm: async () => {
        dispatch(setAuthBusy(true));
        try {
          // Push before the session goes. Everything this device changed but
          // has not sent yet — a setting, a reminder, a pothi — belongs to the
          // account being left, and leaveLocalAccount below drops the outbox
          // that was holding it. Sending afterwards is impossible: the token
          // is gone and so is the queue.
          //
          // Deadlined, because signing out must work on a phone with no
          // signal. A sync that cannot finish in time is abandoned and the
          // sign-out carries on; the alternative is a dialog that hangs.
          // The dashboard is not a registered feature, so it is flushed beside
          // the rest: a nitnem tick or layout edit still in its debounce.
          await withDeadline(
            Promise.all([syncAll({ fresh: true }), requestFlush("sign-out")]),
            SIGN_OUT_FLUSH_MS,
            false
          );

          // Signing out is an explicit "I am done on this device", so the
          // account's data goes with the session. Without this the next
          // person to open the app — signed in as someone else, or not signed
          // in at all — still holds this account's. Its preferences are
          // dropped and its dashboard history detached, not deleted: the
          // history's file stays on the phone for this account's next
          // sign-in, unpushed reading included.
          //
          // Before the logout browser, not after: the token is cleared as it
          // opens, and an app swiped away while it is in front would
          // otherwise launch signed out with the account's data still here.
          //
          // Deliberately here and NOT in useSsoSession.endSession, which also
          // fires on token expiry: resetting there would cost a user their own
          // setup for the crime of not opening the app for a week.
          await leaveLocalAccount(dispatch);

          // Read before clearing: /logout/all needs the token to end the IdP
          // session. startLogout clears local storage itself.
          const token = await readToken();
          const { remote } = await startLogout(token);
          // `remote` says whether the IdP session ended too, or only this device's.
          trackSsoEvent("sign_out", { remote, entry_point: entryPoint });
          await endSession();
          // An expired token can't end the IdP session (the SP 401s it), so be
          // honest rather than implying a full sign-out happened.
          if (!remote) showInfoToast(STRINGS.SIGN_OUT_LOCAL_ONLY);
        } finally {
          dispatch(setAuthBusy(false));
        }
      },
    });
  }, [busy, dispatch, entryPoint]);

  /**
   * Delete the Khalis account itself, not just this device's session.
   *
   * Confirmed once, in the app's own dialog, with copy that says what actually
   * happens: every Khalis app signs out, the history goes, and there are 30
   * days to change their mind. One dialog and not two — the second would be
   * theatre, since the deletion is reversible for a month either way.
   *
   * Local data is destroyed ONLY when the server accepted (200, or 409 for a
   * request already in flight). A refused or unreachable call leaves the device
   * exactly as it was: wiping a phone for a request that never landed would
   * take the history while the account carried on existing.
   *
   * A 401 is the exception that looks like a failure but is not — the session
   * is unusable, so the user is signed out locally without the account being
   * touched, and can sign in again to retry.
   *
   * `/logout/all` is deliberately NOT called on success. The IdP has already
   * ended the session; asking it again only errors.
   */
  const deleteAccount = useCallback(() => {
    if (busy) return;
    showConfirm({
      title: STRINGS.DELETE_ACCOUNT_CONFIRM_TITLE,
      message: STRINGS.DELETE_ACCOUNT_CONFIRM_MESSAGE,
      cancelText: STRINGS.CANCEL,
      confirmText: STRINGS.DELETE_ACCOUNT_CONFIRM_ACTION,
      destructive: true,
      onConfirm: async () => {
        dispatch(setAuthBusy(true));
        try {
          const result = await requestAccountDeletion();
          trackSsoEvent(result.ok ? "account_deleted" : "account_delete_failed", {
            reason: result.ok ? null : result.reason,
            entry_point: entryPoint,
          });

          if (result.ok) {
            // The session first: the account is disabled now, so a sync still
            // out comes back 401, and with the token still held that read as
            // an expiry — "session expired" beside "account deleted". Ending
            // it detaches the history, so the wipe names the account's file.
            await endSession();
            await destroyLocalAccountData(dispatch, user?.email);
            showInfoToast(STRINGS.DELETE_ACCOUNT_DONE);
            return;
          }

          if (result.reason === "session") {
            // The token is no good, so the account was never asked. End the
            // session locally — the same shape as an expiry — and leave the
            // data alone: the account still exists, and signing back in to
            // retry finds its settings and reminders where they were. The owner
            // stays recorded, so a different account signing in still purges.
            await endSession();
            showErrorToast(STRINGS.SESSION_EXPIRED);
            return;
          }

          showErrorToast(
            result.reason === "offline"
              ? STRINGS.DELETE_ACCOUNT_OFFLINE
              : STRINGS.DELETE_ACCOUNT_FAILED
          );
        } finally {
          dispatch(setAuthBusy(false));
        }
      },
    });
  }, [busy, dispatch, entryPoint, user]);

  return { status, user, busy, signIn, signOut, deleteAccount };
};

export default useSsoActions;
