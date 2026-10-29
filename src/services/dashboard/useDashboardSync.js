import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import DeviceInfo from "react-native-device-info";
import { useStore, useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logNetworkError, useNetwork } from "@common";
import { syncAll } from "../sync/syncRegistry";
import {
  getDashboardSnapshot,
  getDashboardState,
  applyDashboardRestore,
  applyServerActivity,
  seedAnalyticsFromSnapshot,
  buildCachePayload,
  pushDashboardCache,
  buildActivityPayload,
  pushDailyActivity,
  hashPayload,
  isEmptySnapshot,
} from "./dashboardSync";
import { bumpRestoreTick } from "./restoreSignal";
import {
  DASHBOARD_RESTORED_KEY as RESTORED_KEY,
  DASHBOARD_LAST_PUSH_KEY as LAST_PUSH_KEY,
  DASHBOARD_APPLIED_AT_KEY as APPLIED_AT_KEY,
  DASHBOARD_PAYLOAD_HASH_KEY as HASH_KEY,
  DASHBOARD_LOCAL_MUTATED_AT_KEY as LOCAL_MUTATED_AT_KEY,
  DASHBOARD_ACTIVITY_PUSHED_AT_KEY as ACTIVITY_PUSHED_AT_KEY,
} from "./syncKeys";
import { subscribePush, subscribePull, requestPush } from "./syncSignal";
import {
  recordPush,
  recordPull,
  SKIP_SIGNED_OUT,
  SKIP_NOT_RESTORED,
  SKIP_COOLDOWN,
  SKIP_UNCHANGED,
  SKIP_EMPTY,
  SKIP_RESTORING,
} from "./syncStatus";

// Dedupes the near-simultaneous blur+background fire, NOT a once-a-day cap —
// real same-day activity must still reach the cloud.
const PUSH_COOLDOWN_MS = 60 * 1000;

// How often a foreground may pull. The snapshot only changes when another
// device pushes, so this is a courtesy poll, not a hot path — and a no-op pull
// is one cheap request that usually ends at the `syncedAt` comparison below.
const REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000;

// How long to wait after activity stops before pushing. Long enough that
// finishing five banis in a sitting is one push and not five; short enough that
// the other device has it by the time you pick it up.
const ACTIVITY_DEBOUNCE_MS = 20 * 1000;

// After a pull that failed for reasons we cannot judge (offline, timeout, 5xx).
// Short, because until the FIRST one succeeds pushing is gated too.
/**
 * Send this device's day rows written since the last successful push
 * (POST /dashboard/activity). Per-device rows the server SUMS across devices,
 * so a phone and a tablet used on the same day add up instead of overwriting
 * each other. The watermark advances only on success, so a failure re-sends
 * the same days rather than leaving a hole. Resolves true when the server now
 * holds everything this device has recorded.
 */
const pushPendingActivity = async (deviceId) => {
  try {
    const sinceRaw = await AsyncStorage.getItem(ACTIVITY_PUSHED_AT_KEY);
    const startedAt = Math.floor(Date.now() / 1000);
    const activity = await buildActivityPayload({
      deviceId,
      since: sinceRaw ? Number(sinceRaw) : 0,
    });
    const res = await pushDailyActivity(activity);
    if (!res?.ok) return false;
    if (activity.days.length) {
      await AsyncStorage.setItem(ACTIVITY_PUSHED_AT_KEY, String(startedAt));
    }
    return true;
  } catch (err) {
    logNetworkError(err, err);
    return false;
  }
};

/**
 * The account's activity from the rows every device has pushed, or null when
 * it cannot be had right now. Pushes this device's pending rows FIRST, so the
 * sum that comes back already contains them and overwriting local days with
 * it loses nothing.
 */
// No month: the whole retention window, so a reinstall gets its calendar back
// rather than the slice of the month it happened to be installed in. See
// getDashboardState for what asking for one month cost.
const pullServerActivity = async (deviceId) => {
  if (!(await pushPendingActivity(deviceId))) return null;
  const res = await getDashboardState();
  return res.status === "ok" && res.state ? res.state : null;
};

const RETRY_BASE_MS = 30 * 1000;
const RETRY_MAX_MS = 5 * 60 * 1000;

/**
 * Exponential backoff with ±50% jitter.
 *
 * The jitter is the part that matters at this user count. A fixed 30s retry
 * means every client that failed during one server blip comes back in the same
 * second, and keeps doing so in lockstep — the outage recovers into a
 * synchronised stampede. Spreading each client across a window breaks the
 * convoy. Nitnem is prayed at the same hours by everyone, so this app starts
 * out more correlated than most and needs the spread more, not less.
 */
const retryDelay = (attempt) => {
  const base = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
  return Math.round(base * (0.5 + Math.random()));
};

/**
 * Owns account dashboard sync for the whole app.
 *
 * ── Why this is mounted globally ───────────────────────────────────────────
 * It used to live in DashboardScreen, so both halves only existed while that
 * screen was mounted. Sign in from Settings, read banis, never open the
 * Dashboard, and nothing was ever pushed — the account's cloud snapshot stayed
 * empty, and the next device therefore had nothing to restore. That is the
 * "it doesn't sync on a different account" report. It now runs from
 * GlobalServices, above the navigator, and uses no navigation API.
 *
 * ── Two kinds of pull ──────────────────────────────────────────────────────
 * BOOTSTRAP  once per account per device. Local is empty (a fresh install, or
 *            an account switch that just purged), so the snapshot is applied
 *            wholesale — preferences included.
 * REFRESH    every time after that. Only completion history and analytics, and
 *            merged rather than overwritten, so a pull can never destroy work
 *            this device has done but not yet pushed. Skipped outright when the
 *            server's `syncedAt` is no newer than what we last applied.
 *
 * ── The gate, and the bug it used to cause ─────────────────────────────────
 * A push before the bootstrap has settled would overwrite real cloud history
 * with a fresh install's near-zero totals, so RESTORED_KEY gates pushing. The
 * old code wrote that marker only on the success path and had no retry, so ONE
 * failed request — a tunnel, a flaky connection during sign-in — left it unset
 * and blocked every push for the rest of the process. The marker is now written
 * for any AUTHORITATIVE answer (a snapshot, or a 404 saying there is none), and
 * a failure schedules a retry instead of giving up until the next launch.
 */
const useDashboardSync = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth?.status);
  const account = useSelector((state) => state.auth?.user?.email ?? null);
  const signedIn = status === "signedIn";
  const { isOnline } = useNetwork();

  // Which account this process has bootstrapped, not merely "have we". A
  // boolean was set once and never cleared, so signing out and back in
  // early-returned and left the dashboard empty until the app was killed.
  const bootstrappedForRef = useRef(null);
  const lastRefreshAtRef = useRef(0);
  const retryTimerRef = useRef(null);
  const retryAttemptRef = useRef(0);
  // Set when local data changed and has not yet reached the server. Survives a
  // cooldown skip, which is what stops a change being silently dropped when it
  // lands inside the 60s window after an earlier push.
  const pendingPushRef = useRef(false);
  const pushTimerRef = useRef(null);
  // pull() may decide the local copy wins and push it immediately, but pushNow
  // is declared after pull. A ref breaks the ordering without reordering the
  // two, which would put the reconciliation far from the code it belongs to.
  const pushNowRef = useRef(null);
  // True while a restore is being APPLIED, not merely while a pull is in
  // flight. Between clearing local SQLite and finishing seedAnalyticsFromSnapshot
  // the device holds no history, and anything built from it is a snapshot of
  // nothing. Any push during that window is refused.
  const restoringRef = useRef(false);
  // Guards against two triggers (foreground and reconnect often land together)
  // running the same pull twice.
  const inFlightRef = useRef(false);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Reading `signedIn`/`account` through refs keeps `pull` referentially stable,
  // so the AppState and connectivity effects below are not torn down and rebuilt
  // on every auth-state render.
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;
  const accountRef = useRef(account);
  accountRef.current = account;

  const pull = useCallback(
    async ({ force = false } = {}) => {
      if (!signedInRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      const forAccount = accountRef.current;
      let settled = false;
      try {
        const bootstrapped = !!(await AsyncStorage.getItem(RESTORED_KEY));
        const snapshot = await getDashboardSnapshot();

        await recordPull({ status: snapshot.status });
        if (snapshot.status === "unauthorized") return;

        if (snapshot.status === "failed") {
          // Decide NOTHING on a failure — in particular do not write the marker,
          // which would let a push of possibly-empty local state overwrite real
          // cloud history. Try again shortly.
          clearRetry();
          const wait = retryDelay(retryAttemptRef.current);
          retryAttemptRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            pull();
          }, wait);
          return;
        }

        if (snapshot.status === "empty") {
          // Authoritative: this account has never synced. Nothing to apply, but
          // the gate must lift — otherwise a brand-new account could never make
          // its FIRST push, and would stay empty forever.
          await AsyncStorage.setItem(RESTORED_KEY, "1");
          bootstrappedForRef.current = forAccount;
          retryAttemptRef.current = 0;
          settled = true;
          // Whatever this device did while signed out IS the account's history
          // now — there is nothing up there to weigh it against.
          await pushNowRef.current?.({ force: true });
          return;
        }

        const { payload, syncedAt } = snapshot;
        if (!payload) {
          await AsyncStorage.setItem(RESTORED_KEY, "1");
          bootstrappedForRef.current = forAccount;
          settled = true;
          return;
        }

        // History comes from the server's summed rows when they can be read.
        // The snapshot is applied first either way and the sums are laid over
        // it, so the days the server knows are exact and the days only the
        // snapshot remembers survive. Neither is ever pushed back up.
        const activity = await pullServerActivity(await DeviceInfo.getUniqueId());

        if (!bootstrapped) {
          // ── PULL → MERGE → PUSH ──────────────────────────────────────────
          //
          // The account's snapshot is applied FIRST, always. There is no longer
          // a "which side wins" decision, because there is no longer a side
          // that loses: history merges, so both copies survive.
          //
          // What this replaces, and why: the old code compared this device's
          // clock against the server's, and if local looked newer AND held any
          // history at all, it skipped the restore and force-pushed local over
          // the account. Both halves were unsound. A device that has just been
          // signed out ALWAYS looks newer — the sign-out itself stamps the
          // clock — and "any history at all" accepted three seconds of reading.
          // An account lost a real streak and every completed bani to a device
          // holding three seconds. There is no version of that comparison worth
          // keeping.
          //
          // Nothing is destroyed now: the snapshot is merged into local, then
          // the union is pushed straight back, so the account gains whatever
          // this device held rather than being replaced by it.
          //
          // Marked BEFORE applying: the restore writes preferences, including
          // reminder state. If applying threw halfway, an unmarked device would
          // restore again on the next launch and silently re-apply the
          // snapshot's reminders over whatever the user had since set. One
          // attempt is what a bootstrap gets.
          await AsyncStorage.setItem(RESTORED_KEY, "1");
          bootstrappedForRef.current = forAccount;

          // Held across BOTH calls. The marker above has already opened the
          // push gate, and applying takes long enough — Redux dispatches, a
          // bani-name lookup, a month of SQLite writes — for a push to land in
          // the middle of it and send a half-applied snapshot.
          restoringRef.current = true;
          try {
            // PREFERENCES wholesale: layout, reminders and the nitnem list are
            // single-valued, and this is the account's own copy of them. Merging
            // those would resurrect a reminder the user deleted elsewhere.
            await applyDashboardRestore(payload, dispatch, {
              reschedule: true,
              transliterationLanguage: store.getState().transliterationLanguage,
            });
            // HISTORY merged: `merge` floors every counter at what this device
            // already holds and takes the larger of the two for each day, so a
            // day the account has never seen — reading done signed out and
            // carried in, or an earlier session on this device that was never
            // pushed — survives the restore instead of being overwritten by it.
            await seedAnalyticsFromSnapshot(payload, { merge: true });
            if (activity) await applyServerActivity(activity);
          } finally {
            restoringRef.current = false;
          }

          settled = true;
          // Local is now the union of both copies, so send it up. This is what
          // makes a full-snapshot push safe: the client never pushes a SUBSET
          // of the server, because it has just merged the server into itself.
          await pushNowRef.current?.({ force: true });
        } else {
          // Refresh. `syncedAt` is the server's own clock and the only comparison
          // the client has — the payload carries no per-field modified-at. If it
          // has not moved past what we last applied, the snapshot up there is
          // either ours or older, and there is nothing to bring down.
          const appliedAt = await AsyncStorage.getItem(APPLIED_AT_KEY);
          // A manual refresh applies regardless. The freshness check is an
          // optimisation for background polling; honouring it here would make a
          // deliberate pull do visibly nothing.
          const nothingNew = syncedAt && appliedAt && new Date(syncedAt) <= new Date(appliedAt);
          if (nothingNew && !force) return;

          // Should this pull adopt the account's PREFERENCES — section order,
          // hidden sections, display name, reminders — or only its history?
          //
          // History is additive and always merges: completions union, day rows
          // and totals only ever move up. Preferences are single-valued, so one
          // side has to win, and the rule is the one the whole reconciliation
          // uses — whichever changed last.
          //
          //   remote newer than our last push  → another device wrote it; take it
          //   local changed since our last push → our edit has not reached the
          //                                       server yet; KEEP it and push
          //
          // `force` used to be enough on its own, which was wrong in a way that
          // showed up as "my change didn't reach the other phone": a manual
          // refresh would overwrite an edit this device had not yet pushed with
          // the server's older copy, and then push the reverted state back up.
          // A manual refresh is a request to reconcile, not a request to lose.
          const lastPushRaw = await AsyncStorage.getItem(LAST_PUSH_KEY);
          const lastPushAt = lastPushRaw ? Number(lastPushRaw) : 0;
          const mutatedRaw = await AsyncStorage.getItem(LOCAL_MUTATED_AT_KEY);
          const localMutatedAt = mutatedRaw ? Number(mutatedRaw) : 0;
          const remoteIsNewer =
            !!syncedAt && (!lastPushAt || new Date(syncedAt).getTime() > lastPushAt);
          // Both are this device's own clock, so unlike the bootstrap
          // comparison above this one does not cross clocks.
          const localUnpushed = localMutatedAt > lastPushAt;
          const preferences = remoteIsNewer && !localUnpushed;

          // Applying dispatches into every slice the store watcher below is
          // watching. Without this the merge would look exactly like the user
          // editing their layout: a pointless push, and — worse — a local-change
          // stamp that makes the NEXT pull refuse to adopt preferences, because
          // the device now appears to hold an unpushed edit it never made.
          restoringRef.current = true;
          try {
            const current = store.getState();
            await applyDashboardRestore(payload, dispatch, {
              merge: true,
              preferences,
              // Per-block clocks, so a snapshot from a device that edited only
              // its layout does not also overwrite this device's newer name.
              local: {
                profileModifiedAt: current.userProfile?.modifiedAt ?? 0,
                layoutModifiedAt: current.dashboardLayout?.modifiedAt ?? 0,
              },
              transliterationLanguage: current.transliterationLanguage,
            });
            await seedAnalyticsFromSnapshot(payload, { merge: true });
            if (activity) await applyServerActivity(activity);
          } finally {
            restoringRef.current = false;
          }
        }
        if (syncedAt) await AsyncStorage.setItem(APPLIED_AT_KEY, syncedAt);
        lastRefreshAtRef.current = Date.now();
        retryAttemptRef.current = 0;
        settled = true;
      } catch (err) {
        logNetworkError(err, err);
      } finally {
        // Reminders and pothis reconcile at the same moments the dashboard
        // does — sign-in, foreground, connectivity returning, pull-to-refresh.
        // Whatever the snapshot said: a brand-new account still has this
        // device's reminders to send up, and each feature checks the session
        // for itself.
        await syncAll();
        inFlightRef.current = false;
        // Tells the Dashboard's sections to look again — they fetch on mount and
        // would otherwise keep rendering whatever was there before these writes.
        if (settled) bumpRestoreTick();
      }
    },
    [dispatch, store, clearRetry]
  );

  // Declared before pushNow so the cooldown branch inside it can re-arm. Held
  // in a ref rather than closed over, because the two are mutually recursive.
  const schedulePushRef = useRef(null);
  const schedulePush = useCallback((delay = ACTIVITY_DEBOUNCE_MS) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null;
      schedulePushRef.current?.run();
    }, delay);
  }, []);

  const pushNow = useCallback(
    async ({ force = false } = {}) => {
      try {
        if (!signedInRef.current) {
          await recordPush({ skipped: SKIP_SIGNED_OUT });
          return;
        }
        // See the class comment: pushing before the bootstrap has settled would
        // overwrite real cloud history with a fresh install's near-zero totals.
        if (!(await AsyncStorage.getItem(RESTORED_KEY))) {
          await recordPush({ skipped: SKIP_NOT_RESTORED });
          return;
        }
        // The restore marker opens the gate BEFORE the snapshot is applied, so
        // the marker alone is not proof that local state is whole. Between the
        // purge and the end of seedAnalyticsFromSnapshot the device holds
        // nothing, and a push landing there uploads nothing over everything.
        if (restoringRef.current) {
          await recordPush({ skipped: SKIP_RESTORING });
          return;
        }
        const lastRaw = await AsyncStorage.getItem(LAST_PUSH_KEY);
        const sinceLast = lastRaw ? Date.now() - Number(lastRaw) : Infinity;
        if (sinceLast < PUSH_COOLDOWN_MS && !force) {
          // The change is NOT dropped. Re-arm for the moment the cooldown lifts,
          // or a genuine edit made 10s after a push would wait for the next
          // backgrounding — which is exactly the "it doesn't sync on its own"
          // complaint this whole path exists to fix.
          if (pendingPushRef.current) schedulePush(PUSH_COOLDOWN_MS - sinceLast);
          await recordPush({ skipped: SKIP_COOLDOWN });
          return;
        }
        const deviceId = await DeviceInfo.getUniqueId();

        // ── The additive half ────────────────────────────────────────────
        // Sent ALONGSIDE the snapshot, not instead of it: the snapshot still
        // drives restore for app versions that know nothing about this
        // endpoint. It can never fail the snapshot push.
        await pushPendingActivity(deviceId);

        const body = await buildCachePayload({
          state: store.getState(),
          version: DeviceInfo.getVersion(),
          // Metadata, and the key the server uses to adopt snapshots pushed
          // before this user had an account. No longer the sync identity.
          deviceId,
        });

        // ── Never upload nothing ───────────────────────────────────────────
        //
        // The last line of defence, and the only one that does not depend on
        // getting an ordering right. An empty snapshot means local SQLite is
        // empty, which in practice means a purge has just run and the restore
        // has not finished. Sending it replaces the account's real history with
        // zeros — observed in production, where a snapshot holding 1122 seconds
        // and a two-day streak became all zeroes with an empty month.
        //
        // `force` does NOT override this. A manual refresh must not be a way to
        // wipe your own account either. Declining costs a genuinely-empty
        // account nothing, because there is nothing to record.
        if (isEmptySnapshot(body.payload)) {
          await recordPush({ skipped: SKIP_EMPTY });
          return;
        }

        // Nothing to say? Then say nothing. Most backgrounding pushes carry a
        // payload identical to the last one, and each costs a full JSONB row
        // rewrite server-side for no change at all.
        const hash = hashPayload(body.payload);
        const lastHash = await AsyncStorage.getItem(HASH_KEY);
        if (hash === lastHash && !force) {
          pendingPushRef.current = false;
          // Identical to what we last sent, so there is nothing unpushed here
          // after all. The stamp has to go: `requestPush` writes it before any
          // of these checks run, and a slice that changes reference without
          // changing the payload (redux-persist rehydrating, a setting written
          // back to the value it already had) would otherwise leave it set
          // permanently — and a device that permanently looks like it holds a
          // pending edit stops accepting the account's preferences for good.
          await AsyncStorage.removeItem(LOCAL_MUTATED_AT_KEY);
          await recordPush({ skipped: SKIP_UNCHANGED });
          return;
        }

        const res = await pushDashboardCache(body);
        // `unauthorized` is a normal state (the token lapsed while the app sat
        // open), not a failure worth logging on every backgrounding.
        if (res?.ok) {
          await AsyncStorage.setItem(LAST_PUSH_KEY, String(Date.now()));
          await AsyncStorage.setItem(HASH_KEY, hash);
          pendingPushRef.current = false;
        }
        await recordPush({
          ok: !!res?.ok,
          status: res?.status,
          message: res?.message,
        });
      } catch (err) {
        // A throw here is the network layer itself failing (abort, DNS, TLS) —
        // record it too, or the header still reads a bare "never".
        await recordPush({ ok: false, error: err?.message || String(err) });
        logNetworkError(err, err);
      }
    },
    [store, schedulePush]
  );

  // Bootstrap on sign-in, and again whenever the account changes. Switching
  // straight from one account to another moves `account` without `signedIn`
  // ever going false, and that still needs its own pull.
  useEffect(() => {
    if (!signedIn) {
      // Forget what we bootstrapped, so the next sign-in pulls again even if it
      // is the same account returning.
      bootstrappedForRef.current = null;
      clearRetry();
      return;
    }
    if (bootstrappedForRef.current === account) return;
    pull();
  }, [signedIn, account, pull, clearRetry]);

  // Close the recursion: schedulePush's timer calls whatever is here, which is
  // the current pushNow. pull() reaches it the same way when reconciliation
  // decides the local copy should win.
  schedulePushRef.current = { run: pushNow };
  pushNowRef.current = pushNow;

  // ── Anything in the snapshot changed ─────────────────────────────────────
  //
  // A store subscription rather than a `requestPush` at each call site. The
  // call-site approach has now failed twice: the nitnem tick and the dashboard
  // layout both shipped with no trigger, and reminders alone are written from
  // eight different places. Watching the state that actually feeds
  // `buildCachePayload` cannot be forgotten when someone adds a ninth.
  //
  // Deliberately NOT watched:
  //   currentBani — changes on every bani opened, and the reading session that
  //                 follows triggers a push moments later anyway.
  //   pothis      — `nitnem.selectedBaaniIds` is written into the payload but
  //                 never read back out of it (see applyDashboardRestore), and
  //                 My Pothi syncs through the folders API on its own.
  //
  // A spurious fire is cheap: the debounce coalesces it and the unchanged-hash
  // check ends it before any request, which also covers redux-persist's
  // rehydrate on launch.
  useEffect(() => {
    const snapshotOf = (s) => [
      s.userProfile,
      s.dashboardLayout,
      s.todaysNitnem,
      s.isReminders,
      s.reminderBanis,
      s.reminderSound,
    ];
    let previous = snapshotOf(store.getState());
    return store.subscribe(() => {
      const next = snapshotOf(store.getState());
      if (next.every((slice, i) => slice === previous[i])) return;
      previous = next;
      // A restore dispatches profile, layout, nitnem and all three reminder
      // actions — every slice watched here. Treating that as "the user changed
      // something" both schedules a pointless push and stamps the local-change
      // clock, which would then make the NEXT launch believe this device holds
      // newer data than the account it just copied.
      if (restoringRef.current) return;
      requestPush("state-change");
    });
  }, [store]);

  // ── Local data changed ───────────────────────────────────────────────────
  // A finished bani or audio session rings syncSignal. Debounced, so a sitting
  // of five banis is one push; and the timer resets on each new signal, so the
  // push lands once the user has actually stopped rather than between banis.
  useEffect(
    () =>
      subscribePush(() => {
        pendingPushRef.current = true;
        schedulePush();
      }),
    [schedulePush]
  );

  // ── Pull to refresh: a FORCED round trip, PULL FIRST ─────────────────────
  //
  // The order is the whole fix for "changes on phone A never reached phone B".
  //
  // There is one snapshot row per account per day, so a push OVERWRITES it. When
  // this pushed first, every device clobbered the row with its own state and
  // then pulled back exactly what it had just sent — each phone could only ever
  // see itself, and the only way to get another device's data was to sign out
  // and back in, which restores from scratch. That is precisely what was
  // reported.
  //
  // Pulling first makes the refresh a real reconciliation: bring the account's
  // copy down, merge history (additive, so nothing can be lost either way),
  // decide preferences by whichever side changed last, and only then push the
  // reconciled result — so what goes up is the union of both devices rather
  // than one device's opinion. Both halves ignore the cooldown, the freshness
  // check and the unchanged-hash check; neither can bypass the empty-snapshot
  // refusal, because "sync at any cost" must still never mean "upload nothing
  // over everything".
  const syncNow = useCallback(async () => {
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    }
    await pull({ force: true });
    await pushNow({ force: true });
  }, [pull, pushNow]);

  useEffect(() => subscribePull(() => syncNow()), [syncNow]);

  // Push once the bootstrap has settled, so an account that signs in and never
  // opens the Dashboard still gets its local history up. Without this the very
  // first push waited for a backgrounding that might carry nothing new.
  useEffect(() => {
    if (!signedIn) return undefined;
    const t = setTimeout(() => pushNow(), 2000);
    return () => clearTimeout(t);
  }, [signedIn, account, pushNow]);

  // Foreground: refresh (throttled). Background: push.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        pushNow();
        return;
      }
      if (next !== "active") return;
      if (Date.now() - lastRefreshAtRef.current < REFRESH_MIN_INTERVAL_MS) return;
      pull();
    });
    return () => sub.remove();
  }, [pull, pushNow]);

  // Connectivity coming BACK is the other moment worth a pull: it is when a
  // failed bootstrap can finally succeed, and when a push that never left can
  // be followed by a snapshot we have not seen. The offline→online EDGE, not
  // the online state — NetworkContext starts optimistic, so keying on "is
  // online" would fire on mount.
  const wasOfflineRef = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (!wasOfflineRef.current) return;
    wasOfflineRef.current = false;
    pull();
  }, [isOnline, pull]);

  useEffect(
    () => () => {
      clearRetry();
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    },
    [clearRetry]
  );
};

export default useDashboardSync;
