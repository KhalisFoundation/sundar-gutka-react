import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { isTransientStatus } from "@service/khalisRequest";
import { deleteFolder, fetchFolders, putFolders } from "@service/pothiApi";
import {
  OUTCOME_DONE,
  OUTCOME_FATAL,
  OUTCOME_RETRY,
  registerSyncFeature,
} from "@service/sync/syncRegistry";
import { buildDefaultPothis } from "@common/pothi/defaults";
import { SOURCE, toUpsertBody } from "@common/pothi/model";
import { actions, logMessage, STRINGS } from "@common";
import { getBaniList } from "@database";

// Keeps My Pothi in step with the account — and with every other device
// signed into it — and seeds the two default pothis.
//
// ── Signed out is fully usable ─────────────────────────────────────────────
// Creating, renaming, deleting, reordering, pinning and editing a pothi all
// work with no account and no connection. The edit lands in redux,
// redux-persist keeps it across launches, and the account CLAIMS it on the
// first sign-in rather than replacing it: `applyAccountScope` deliberately
// does not purge when there is no previous account on the device, so the
// guest's folders are still in the slice when `reconcile` below pushes them
// up, and `mergeRemote` keeps both sides folder by folder.
//
// A LATER change of account still purges — the slice is person-owned data,
// listed in `reducer.js`'s USER_DATA_SLICES — so account B never inherits
// account A's pothis. Signing out purges it too (useSsoActions.signOut) and
// forgets the last account, which is what makes the sign-in after it a first
// sign-in again: pothis made in between belong to whoever made them.
//
// ── Local-first, through the outbox ────────────────────────────────────────
// Every edit lands in redux (and redux-persist) first. The change is then
// queued in the persisted outbox (see common/sync/outboxModel) as one
// `put` of the whole source — coalesced, so a burst of edits is one upload —
// and one `delete` per removed pothi. The outbox drains them in order,
// retries them with backoff when the network is away, and survives the app
// being killed, which the old in-memory queue did not.
//
// ── Two devices ────────────────────────────────────────────────────────────
// The server merges per FOLDER, newest wins, and tells this device two
// things it could not know before: `deletedFolderIds` — pothis another device
// deleted since this one last read (so a deletion finally propagates) — and
// `rejectedFolderIds` — pothis whose upload lost to a newer copy from another
// device (so this device adopts that copy instead of believing its own).
export const FEATURE = "pothis";
const PUT_KEY = SOURCE;

// The API replaces a whole source per PUT, so a rename typed one letter at a
// time would otherwise re-upload every folder per keystroke. The outbox
// coalesces, but the drain runs at once; this holds the enqueue until the
// edit settles.
const PUSH_DEBOUNCE_MS = 2500;

const usePothiSync = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const pothis = useSelector((state) => state.pothis);
  const isSignedIn = useSelector((state) => state.auth?.status === "signedIn");
  const baniList = useSelector((state) => state.baniList);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  // The bani rows to seed FROM, when redux has none. `baniList` is blacklisted
  // from redux-persist and is only ever filled by HomeScreen's useBaniList, so
  // signing out from Settings can find it empty — and buildDefaultPothis is
  // all-or-nothing, so it returns [] and the effect quietly seeds nothing. That
  // is why the pothis came back only after a restart: the restart is what put
  // HomeScreen back on screen to fill it.
  const [fallbackBanis, setFallbackBanis] = useState(null);

  // The `pothis` object already dispatched a seed for — not a boolean, so it
  // guards the gap between dispatching and the next render reflecting
  // `seededDefaults` WITHOUT permanently blocking a later, legitimate reseed.
  const seededFor = useRef(null);
  // What was last handed to the outbox, so an unchanged state is not queued
  // again on every render.
  const lastEnqueued = useRef(null);
  const queuedDeletes = useRef(new Set());
  // Whether the first pull of this sign-in has landed. State, not a ref: the
  // enqueue effect must re-run the moment it flips.
  const [pullDone, setPullDone] = useState(false);
  const signedInRef = useRef(isSignedIn);
  signedInRef.current = isSignedIn;

  // ── Seed the two default pothis ───────────────────────────────────────────
  //
  // This app is what gives the account its Sundar Gutka Morning and Evening
  // Nitnem: the API seeds a pair only under the MyPothi source, which this app
  // does not read. The pair is seeded under fixed ids and uploaded like any
  // other pothi, so every device holds the one pair.
  //
  // Signed out, once per signed-out period, into an empty list. Signed in, only
  // once the first pull has landed — before it, the account's pair may simply
  // not have arrived — and only when that pull showed the account never had
  // one (`mergeRemote` marks `seededDefaults` when it did, even if deleted).
  const mayNeedSeed =
    Boolean(pothis) && !pothis.seededDefaults && (isSignedIn ? pullDone : !pothis.folders?.length);

  // Read the list straight from the database when redux has none, so the seed
  // does not depend on which screen the user happened to be on.
  useEffect(() => {
    if (!mayNeedSeed || baniList?.length || fallbackBanis) return undefined;
    let alive = true;
    getBaniList(transliterationLanguage)
      .then((rows) => {
        if (alive) setFallbackBanis(rows ?? []);
      })
      .catch((error) => logMessage(`usePothiSync: default seed read failed (${error})`));
    return () => {
      alive = false;
    };
  }, [mayNeedSeed, baniList, fallbackBanis, transliterationLanguage]);

  useEffect(() => {
    // Release the latch the moment the store has moved on from the object it
    // was set for. It only has to cover the render between dispatching the seed
    // and the store reflecting it. Left holding, it matched again on the NEXT
    // sign-out: the reducer's initial state is one object built at module load
    // and handed back by reference every time the slice is cleared, so the
    // second sign-out found the very object the first had seeded for and the
    // defaults never came back.
    if (seededFor.current && seededFor.current !== pothis) seededFor.current = null;
    if (!mayNeedSeed || seededFor.current === pothis) return;
    const defaults = buildDefaultPothis(baniList?.length ? baniList : fallbackBanis, {
      morning: STRINGS.POTHI_DEFAULT_MORNING,
      evening: STRINGS.POTHI_DEFAULT_EVENING,
    });
    // An empty result means the bani database has not loaded yet. Not latching
    // here is deliberate: latching would leave the user permanently without the
    // defaults because of a cold-start race.
    if (defaults.length === 0) return;
    seededFor.current = pothis;
    dispatch(actions.seedDefaultPothis(defaults));
  }, [mayNeedSeed, pothis, baniList, fallbackBanis, dispatch]);

  // ── Pull: the account's folders, and what it deleted since we last looked ─
  const applyRead = useCallback(
    (data) => {
      dispatch(actions.mergeRemotePothis(data?.folders ?? [], data?.deletedFolderIds ?? []));
      if (data?.syncedAt) dispatch(actions.setPothiSyncWatermark(data.syncedAt));
    },
    [dispatch]
  );

  const pull = useCallback(async () => {
    if (!signedInRef.current) return false;
    const since = store.getState().pothis?.syncWatermark ?? 0;
    const result = await fetchFolders(since);
    if (!result.ok) {
      logMessage(`usePothiSync: pull failed (${result.error ?? result.status})`);
      return false;
    }
    applyRead(result.data);
    setPullDone(true);
    return true;
  }, [store, applyRead]);

  // ── Bulk reconcile: pull, then push what we hold, then take the answer ────
  const reconcile = useCallback(async () => {
    if (!(await pull())) return false;
    const body = toUpsertBody(store.getState().pothis);
    if (body.folders.length === 0) return true;
    const result = await putFolders(body);
    if (!result.ok) {
      logMessage(`usePothiSync: reconcile push failed (${result.error ?? result.status})`);
      return false;
    }
    lastEnqueued.current = JSON.stringify(body);
    applyRead(result.data);
    dispatch(actions.setPothisSyncedAt(new Date().toISOString()));
    return true;
  }, [pull, store, dispatch, applyRead]);

  // ── One outbox op ─────────────────────────────────────────────────────────
  const drain = useCallback(
    async (op) => {
      const outcomeFor = (res) => {
        if (res.ok) return OUTCOME_DONE;
        if (res.status === 401 || isTransientStatus(res.status)) return OUTCOME_RETRY;
        return OUTCOME_FATAL;
      };
      if (op.kind === "put") {
        // Built at send time, not enqueue time: the freshest state is what
        // should go up, and a stale payload would only lose to itself.
        const body = toUpsertBody(store.getState().pothis);
        const result = await putFolders(body);
        if (!result.ok) return outcomeFor(result);
        lastEnqueued.current = JSON.stringify(body);
        dispatch(actions.setPothisSyncedAt(new Date().toISOString()));
        const rejected = result.data?.rejectedFolderIds ?? [];
        if (rejected.length) {
          // Another device wrote those pothis more recently. The response
          // already carries the winning copies; adopting them here is the
          // reconcile, so no separate round trip is needed.
          logMessage(`usePothiSync: ${rejected.length} pothi(s) superseded by another device`);
        }
        applyRead(result.data);
        return OUTCOME_DONE;
      }
      if (op.kind === "delete") {
        const result = await deleteFolder(op.key);
        // 204 says the row is gone right now; the tombstone is retired only
        // when a later read confirms it (see mergeRemote), so a stale upload
        // from elsewhere cannot bring the pothi back unnoticed.
        if (result.ok || result.status === 404) return OUTCOME_DONE;
        return outcomeFor(result);
      }
      return OUTCOME_FATAL;
    },
    [store, dispatch, applyRead]
  );

  useEffect(() => registerSyncFeature(FEATURE, { drain, reconcile }), [drain, reconcile]);

  // ── Sign-out forgets the pull; the next reconcile (dashboard sync) redoes it ─
  useEffect(() => {
    if (!isSignedIn) {
      // Signing out only forgets that we pulled — nothing is cleared. The
      // pothis stay on the device exactly as they were before signing in.
      setPullDone(false);
      lastEnqueued.current = null;
      queuedDeletes.current.clear();
    }
  }, [isSignedIn]);

  // ── Deletions go to the outbox once the first pull has landed ─────────────
  //
  // Waiting for the pull is what keeps a guest's history off the wire. Signed
  // out there is nothing to pull, so every pothi deleted before signing in
  // leaves a tombstone behind, and a long spell as a guest would send the
  // account a DELETE for each one — all of them ids it has never heard of. The
  // first `mergeRemote` retires every tombstone the server does not actually
  // hold (see `stillThere` there), so by the time this runs the list is exactly
  // the deletions the account still has to be told about.
  const buried = pothis?.deletedIds;
  useEffect(() => {
    if (!isSignedIn || !pullDone || !buried?.length) return;
    buried.forEach((id) => {
      if (queuedDeletes.current.has(id)) return;
      queuedDeletes.current.add(id);
      dispatch(actions.enqueueSyncOp({ feature: FEATURE, kind: "delete", key: id }));
    });
  }, [isSignedIn, pullDone, buried, dispatch]);

  // ── Edits go to the outbox once they settle ───────────────────────────────
  //
  // Nothing is queued before the first pull of this sign-in has landed: the
  // persisted list would otherwise go up ~2.5s after launch, ahead of the
  // pull on any slow network, and re-create every folder another device had
  // deleted while the app was closed.
  useEffect(() => {
    if (!isSignedIn || !pothis || !pullDone) return undefined;
    const serialised = JSON.stringify(toUpsertBody(pothis));
    if (serialised === lastEnqueued.current) return undefined;
    const timer = setTimeout(() => {
      lastEnqueued.current = serialised;
      dispatch(actions.enqueueSyncOp({ feature: FEATURE, kind: "put", key: PUT_KEY }));
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isSignedIn, pothis, pullDone, dispatch]);

  return { pull };
};

export default usePothiSync;
