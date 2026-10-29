import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { isTransientStatus } from "@service/khalisRequest";
import { deleteFolder, fetchFolders, putFolders } from "@service/pothiApi";
import {
  OUTCOME_CONFLICT,
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
// ── One account boundary at a time ─────────────────────────────────────────
// Signing out purges BEFORE the session ends — the logout browser is still to
// open — so for a while the list is empty while still signed in. Taken as the
// account's, that emptied list was re-seeded with the stock pair and uploaded
// over the account's own nitnem; and a foreground sync in that window pulled
// the account's pothis back onto a phone that was signing out. So sync only
// runs on the account boundary (`accountEpoch`) its session began on, and an
// answer that lands after the boundary moved is dropped.
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

// Which side of the last account boundary a request was made on. A purge
// (CLEAR_USER_DATA) moves it even while the session is still up.
const epochOf = (state) => state.accountEpoch ?? 0;
const signedInOf = (state) => state.auth?.status === "signedIn";

const usePothiSync = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const pothis = useSelector((state) => state.pothis);
  const isSignedIn = useSelector(signedInOf);
  const accountEpoch = useSelector(epochOf);
  // The boundary this session began on. Signed in on any other — the
  // account's data was purged under a session that is ending — is not synced.
  const sessionEpochRef = useRef(null);
  if (!isSignedIn) sessionEpochRef.current = null;
  else if (sessionEpochRef.current === null) sessionEpochRef.current = accountEpoch;
  const syncing = isSignedIn && sessionEpochRef.current === accountEpoch;
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
  // Read by the async verbs, which run outside render: the drain needs to know
  // whether this session has pulled yet, and every verb whether it may sync.
  const pullDoneRef = useRef(pullDone);
  pullDoneRef.current = pullDone;
  const syncingRef = useRef(syncing);
  syncingRef.current = syncing;
  const reconcilingRef = useRef(null);

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
  //
  // KNOWN: the first read of a device has no `since`, so it reports no
  // deletions, and a pair deleted on another client cannot be told from one the
  // account never had: a new phone (or one that seeded while signed out) seeds
  // and uploads the stock pair again. Needs the API to say whether a default
  // was ever deleted — to be settled with the backend in a follow-up.
  // Signed in on a boundary that has moved, nothing is seeded: that list was
  // emptied by a sign-out still under way, and the stock pair seeded into it
  // would go up over the account's own.
  const mayNeedSeed =
    Boolean(pothis) &&
    !pothis.seededDefaults &&
    (isSignedIn ? syncing && pullDone : !pothis.folders?.length);

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
  // Only a READ moves the watermark. A PUT is sent with no `since`, so its
  // answer cannot list what was deleted elsewhere since this device last read;
  // taking its `syncedAt` skipped those deletions for good, and the pothi
  // another device deleted went back up with every later PUT.
  const applyRead = useCallback(
    (data, { fromRead = true } = {}) => {
      dispatch(actions.mergeRemotePothis(data?.folders ?? [], data?.deletedFolderIds ?? []));
      if (fromRead && data?.syncedAt) dispatch(actions.setPothiSyncWatermark(data.syncedAt));
    },
    [dispatch]
  );

  // True while the answer to a request made at `epoch` may still be applied:
  // the same session, on the same side of the account boundary.
  const stillFor = useCallback(
    (epoch) => syncingRef.current && epochOf(store.getState()) === epoch,
    [store]
  );

  const pull = useCallback(async () => {
    if (!syncingRef.current) return false;
    const epoch = epochOf(store.getState());
    const since = store.getState().pothis?.syncWatermark ?? 0;
    const result = await fetchFolders(since);
    if (!stillFor(epoch)) return false;
    if (!result.ok) {
      logMessage(`usePothiSync: pull failed (${result.error ?? result.status})`);
      return false;
    }
    applyRead(result.data);
    setPullDone(true);
    pullDoneRef.current = true;
    return true;
  }, [store, applyRead, stillFor]);

  // ── Bulk reconcile: pull, send what is pending, then take the answer ─────
  //
  // Everything the outbox holds for pothis is in it: the deletions the account
  // still has to hear about, and the whole list. So when it lands, the ops it
  // carried are done — only those, matched by identity, because one queued (or
  // merged into a waiting op) while it was out holds a change it never saw.
  const reconcileNow = useCallback(async () => {
    const epoch = epochOf(store.getState());
    const carried = Object.values(store.getState().syncOutbox?.ops ?? {}).filter(
      (op) => op.feature === FEATURE
    );
    if (!(await pull())) return false;
    // After the pull, which retires every tombstone the account no longer has.
    const buried = store.getState().pothis?.deletedIds ?? [];
    // eslint-disable-next-line no-restricted-syntax
    for (const id of buried) {
      // eslint-disable-next-line no-await-in-loop
      const result = await deleteFolder(id);
      if (!stillFor(epoch)) return false;
      if (!result.ok && result.status !== 404) {
        logMessage(`usePothiSync: reconcile delete failed (${result.error ?? result.status})`);
        return false;
      }
      // Sent; the outbox need not send it again (see the deletions effect).
      queuedDeletes.current.add(id);
    }
    const body = toUpsertBody(store.getState().pothis);
    if (body.folders.length > 0) {
      const result = await putFolders(body);
      if (!stillFor(epoch)) return false;
      if (!result.ok) {
        logMessage(`usePothiSync: reconcile push failed (${result.error ?? result.status})`);
        return false;
      }
      lastEnqueued.current = JSON.stringify(body);
      applyRead(result.data, { fromRead: false });
      dispatch(actions.setPothisSyncedAt(new Date().toISOString()));
    }
    const { ops } = store.getState().syncOutbox ?? { ops: {} };
    carried.forEach((op) => {
      if (ops[op.id] === op) dispatch(actions.syncOpDone(op.id));
    });
    return true;
  }, [pull, store, dispatch, applyRead, stillFor]);

  // One at a time: the account-sync moments and a conflicting op can ask
  // together, and two runs would send the same list twice. `fresh` waits for a
  // run already out and then runs again rather than joining it: that run was
  // built before the latest edits, and sign-out's last push drops the outbox
  // straight after.
  const reconcile = useCallback(
    async ({ fresh = false } = {}) => {
      if (!syncingRef.current) return false;
      if (fresh && reconcilingRef.current) await reconcilingRef.current.catch(() => false);
      if (!reconcilingRef.current) {
        reconcilingRef.current = reconcileNow().finally(() => {
          reconcilingRef.current = null;
        });
      }
      return reconcilingRef.current;
    },
    [reconcileNow]
  );

  // ── One outbox op ─────────────────────────────────────────────────────────
  const drain = useCallback(
    async (op) => {
      const epoch = epochOf(store.getState());
      // After the request: purged while it was out, the account it was for is
      // gone, and so is the op; only the session ended (an expiry, a refused
      // token), it still belongs to this account and goes when it is back.
      const settle = (res) => {
        if (epochOf(store.getState()) !== epoch) return OUTCOME_DONE;
        if (!signedInOf(store.getState())) return OUTCOME_RETRY;
        if (res.ok) return null;
        // A fault in the request itself, not the network: retrying cannot help,
        // and the op would hold up every later one of this feature.
        if (res.status === 0 && res.error === "failed") return OUTCOME_FATAL;
        if (res.status === 401 || isTransientStatus(res.status)) return OUTCOME_RETRY;
        return OUTCOME_FATAL;
      };
      if (op.kind === "put") {
        // Not before this session's first pull: the list held here may predate
        // deletions made on another device, and the first sync with the
        // account is always the bulk one, which pulls before it pushes.
        if (!pullDoneRef.current) return OUTCOME_CONFLICT;
        // Built at send time, not enqueue time: the freshest state is what
        // should go up, and a stale payload would only lose to itself.
        const body = toUpsertBody(store.getState().pothis);
        const result = await putFolders(body);
        const outcome = settle(result);
        if (outcome) return outcome;
        lastEnqueued.current = JSON.stringify(body);
        dispatch(actions.setPothisSyncedAt(new Date().toISOString()));
        const rejected = result.data?.rejectedFolderIds ?? [];
        if (rejected.length) {
          // Another device wrote those pothis more recently. The response
          // already carries the winning copies; adopting them here is the
          // reconcile, so no separate round trip is needed.
          logMessage(`usePothiSync: ${rejected.length} pothi(s) superseded by another device`);
        }
        applyRead(result.data, { fromRead: false });
        return OUTCOME_DONE;
      }
      if (op.kind === "delete") {
        const result = await deleteFolder(op.key);
        // 204 says the row is gone right now; the tombstone is retired only
        // when a later read confirms it (see mergeRemote), so a stale upload
        // from elsewhere cannot bring the pothi back unnoticed.
        if (result.status === 404) return settle({ ok: true }) ?? OUTCOME_DONE;
        return settle(result) ?? OUTCOME_DONE;
      }
      return OUTCOME_FATAL;
    },
    [store, dispatch, applyRead]
  );

  useEffect(() => registerSyncFeature(FEATURE, { drain, reconcile }), [drain, reconcile]);

  // ── Leaving the session or its boundary forgets the pull ─────────────────
  // The next session's reconcile (useAccountSync, at sign-in) pulls again.
  useEffect(() => {
    if (!syncing) {
      setPullDone(false);
      pullDoneRef.current = false;
      lastEnqueued.current = null;
      queuedDeletes.current.clear();
    }
  }, [syncing]);

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
    if (!syncing || !pullDone || !buried?.length) return;
    buried.forEach((id) => {
      if (queuedDeletes.current.has(id)) return;
      queuedDeletes.current.add(id);
      dispatch(actions.enqueueSyncOp({ feature: FEATURE, kind: "delete", key: id }));
    });
  }, [syncing, pullDone, buried, dispatch]);

  // ── Edits go to the outbox once they settle ───────────────────────────────
  //
  // Nothing is queued before the first pull of this sign-in has landed: the
  // persisted list would otherwise go up ~2.5s after launch, ahead of the
  // pull on any slow network, and re-create every folder another device had
  // deleted while the app was closed.
  useEffect(() => {
    if (!syncing || !pothis || !pullDone) return undefined;
    const serialised = JSON.stringify(toUpsertBody(pothis));
    if (serialised === lastEnqueued.current) return undefined;
    const timer = setTimeout(() => {
      lastEnqueued.current = serialised;
      dispatch(actions.enqueueSyncOp({ feature: FEATURE, kind: "put", key: PUT_KEY }));
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [syncing, pothis, pullDone, dispatch]);

  return { pull };
};

export default usePothiSync;
