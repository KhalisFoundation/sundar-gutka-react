/* eslint-env jest */
import { act, renderHook } from "@testing-library/react-native";
import usePothiSync, { FEATURE } from "./usePothiSync";

const mockDispatch = jest.fn();
const mockFetchFolders = jest.fn();
const mockPutFolders = jest.fn();
const mockDeleteFolder = jest.fn();
const mockRegister = jest.fn(() => () => {});

let mockState = {};

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn(mockState),
  useStore: () => ({ getState: () => mockState, dispatch: mockDispatch }),
}));

// Pulls in anvaad-js, which touches `self` and cannot load under jsdom-less
// jest. A jest.fn() so the seeding describe block below can give it a real
// return value; every other test leaves it at this empty default.
jest.mock("@common/pothi/defaults", () => ({ buildDefaultPothis: jest.fn(() => []) }));
const { buildDefaultPothis } = jest.requireMock("@common/pothi/defaults");

// The bani rows the seed falls back to. redux's copy is blacklisted from
// persist and only HomeScreen fills it, so signing out from Settings can find
// it empty.
const mockGetBaniList = jest.fn(() => Promise.resolve([]));
jest.mock("@database", () => ({ getBaniList: (...a) => mockGetBaniList(...a) }));

jest.mock("@service/pothiApi", () => ({
  fetchFolders: (...args) => mockFetchFolders(...args),
  putFolders: (...args) => mockPutFolders(...args),
  deleteFolder: (...args) => mockDeleteFolder(...args),
}));
jest.mock("@service/khalisRequest", () => ({
  isTransientStatus: (status) => status === 0 || status === 429 || status >= 500,
}));
jest.mock("@service/sync/syncRegistry", () => ({
  OUTCOME_DONE: "done",
  OUTCOME_RETRY: "retry",
  OUTCOME_CONFLICT: "conflict",
  OUTCOME_FATAL: "fatal",
  registerSyncFeature: (...args) => mockRegister(...args),
}));

jest.mock("@common", () => ({
  actions: {
    mergeRemotePothis: (folders, deletedFolderIds) => ({
      type: "MERGE_REMOTE_POTHIS",
      folders,
      deletedFolderIds,
    }),
    setPothiSyncWatermark: (at) => ({ type: "SET_POTHI_SYNC_WATERMARK", at }),
    seedDefaultPothis: (folders) => ({ type: "SEED_DEFAULT_POTHIS", folders }),
    setPothisSyncedAt: (at) => ({ type: "SET_POTHIS_SYNCED_AT", at }),
    enqueueSyncOp: (op) => ({ type: "ENQUEUE_SYNC_OP", op }),
    syncOpDone: (id) => ({ type: "SYNC_OP_DONE", id }),
  },
  logMessage: jest.fn(),
  STRINGS: { POTHI_DEFAULT_MORNING: "Morning", POTHI_DEFAULT_EVENING: "Evening" },
}));

const pothi = (id) => ({
  id,
  name: id,
  source: "sundar-gutka",
  items: [],
  createdAt: 1,
  updatedAt: 1,
  isPublic: false,
  pinned: false,
});

const signedInWith = (folders, extra = {}) => {
  mockState = {
    auth: { status: "signedIn", user: { email: "a@x" } },
    baniList: [],
    pothis: {
      folders,
      seededDefaults: true,
      lastSyncedAt: null,
      deletedIds: [],
      syncWatermark: 0,
      ...extra,
    },
  };
};

const signedOutWith = ({ folders = [], seededDefaults = false } = {}) => {
  mockState = {
    auth: { status: "signedOut" },
    baniList: [{ id: 1 }],
    pothis: { folders, seededDefaults, lastSyncedAt: null, deletedIds: [] },
  };
};

// Signed out the way the app really is a moment after sign-out: the pothi slice
// reset AND no bani list in redux, because that slice never survives and only
// HomeScreen fills it.
const signedOutWithNoBaniList = () => {
  mockState = {
    auth: { status: "signedOut" },
    baniList: [],
    transliterationLanguage: 1,
    pothis: { folders: [], seededDefaults: false, lastSyncedAt: null, deletedIds: [] },
  };
};

const impl = () => mockRegister.mock.calls[mockRegister.mock.calls.length - 1][1];
const enqueued = () =>
  mockDispatch.mock.calls.map(([a]) => a).filter((a) => a.type === "ENQUEUE_SYNC_OP");
const flush = async (ms = 0) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
const okRead = (folders = [], extra = {}) => ({
  ok: true,
  data: { folders, deletedFolderIds: [], syncedAt: 1000, rejectedFolderIds: [], ...extra },
});

describe("usePothiSync edits and the outbox", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockRegister.mockClear();
    mockFetchFolders.mockReset();
    mockPutFolders.mockReset().mockResolvedValue(okRead());
    mockDeleteFolder.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it("registers itself with the sync registry", () => {
    signedOutWith();
    renderHook(() => usePothiSync());
    expect(mockRegister).toHaveBeenCalledWith(
      FEATURE,
      expect.objectContaining({
        drain: expect.any(Function),
        reconcile: expect.any(Function),
      })
    );
  });

  // The cold-start resurrection: without a gate the persisted list uploads
  // ~2.5s in and beats a slow pull, re-creating every folder another device
  // deleted while the app was closed.
  it("queues nothing before the first pull of this sign-in has landed", async () => {
    let releasePull;
    mockFetchFolders.mockReturnValue(
      new Promise((resolve) => {
        releasePull = resolve;
      })
    );
    signedInWith([pothi("stale-a")]);
    renderHook(() => usePothiSync());
    let reconciled;
    await act(async () => {
      reconciled = impl().reconcile();
    });
    await flush(10000);
    expect(enqueued()).toEqual([]);
    await act(async () => {
      releasePull(okRead([]));
      await reconciled;
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "MERGE_REMOTE_POTHIS",
      folders: [],
      deletedFolderIds: [],
    });
  });

  it("reconcile pulls with the watermark, pushes what it holds, takes the answer", async () => {
    mockFetchFolders.mockResolvedValue(okRead([], { deletedFolderIds: ["gone"], syncedAt: 777 }));
    signedInWith([pothi("mine")], { syncWatermark: 500 });
    renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    expect(mockFetchFolders).toHaveBeenCalledWith(500);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "MERGE_REMOTE_POTHIS",
      folders: [],
      deletedFolderIds: ["gone"],
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SET_POTHI_SYNC_WATERMARK", at: 777 });
    // The PUT that follows answers syncedAt 1000; only the read's counts.
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: "SET_POTHI_SYNC_WATERMARK", at: 1000 });
    expect(mockPutFolders).toHaveBeenCalledWith({
      source: "sundar-gutka",
      folders: [expect.objectContaining({ id: "mine" })],
    });
  });

  it("a later edit is queued as one coalesced put, once it settles", async () => {
    mockFetchFolders.mockResolvedValue(okRead([]));
    signedInWith([pothi("mine")]);
    const { rerender } = renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    mockDispatch.mockClear();
    signedInWith([pothi("mine"), pothi("second")]);
    rerender();
    await flush(1000);
    expect(enqueued()).toEqual([]);
    await flush(2000);
    expect(enqueued()).toEqual([
      { type: "ENQUEUE_SYNC_OP", op: { feature: FEATURE, kind: "put", key: "sundar-gutka" } },
    ]);
  });

  // Tombstones are the record of every pothi this device has ever deleted,
  // including months of them made before signing in — the pull is what prunes
  // that list down to the ids the account actually still holds (mergeRemote),
  // so nothing is sent until it has landed.
  it("holds a deletion back until the first pull has landed", async () => {
    mockFetchFolders.mockResolvedValue(okRead([]));
    signedInWith([], { deletedIds: ["guest-only"] });
    const { rerender } = renderHook(() => usePothiSync());
    await flush(0);
    rerender();
    await flush(0);

    expect(enqueued().filter((a) => a.op.kind === "delete")).toEqual([]);
  });

  // A sign-out flushes through reconcile and then drops the outbox, so a
  // deletion still waiting there would be lost with it.
  it("reconcile sends the deletions the account still has to hear about", async () => {
    mockFetchFolders.mockResolvedValue(okRead([]));
    mockDeleteFolder.mockResolvedValue({ ok: true, status: 204 });
    signedInWith([], { deletedIds: ["d1"] });
    const { rerender } = renderHook(() => usePothiSync());
    await act(async () => {
      expect(await impl().reconcile()).toBe(true);
    });
    expect(mockDeleteFolder).toHaveBeenCalledWith("d1");
    // Sent already, so not queued a second time.
    rerender();
    await flush(0);
    expect(enqueued().filter((a) => a.op.kind === "delete")).toEqual([]);
  });

  it("fails the reconcile when a deletion does not get through", async () => {
    mockFetchFolders.mockResolvedValue(okRead([]));
    mockDeleteFolder.mockResolvedValue({ ok: false, status: 503 });
    signedInWith([pothi("mine")], { deletedIds: ["d1"] });
    renderHook(() => usePothiSync());
    await act(async () => {
      expect(await impl().reconcile()).toBe(false);
    });
    expect(mockPutFolders).not.toHaveBeenCalled();
  });

  it("queues a deletion made after the pull, once per id", async () => {
    mockFetchFolders.mockResolvedValue(okRead([]));
    signedInWith([pothi("mine")]);
    const { rerender } = renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    signedInWith([], { deletedIds: ["mine"] });
    rerender();
    await flush(0);
    rerender();
    await flush(0);

    expect(enqueued().filter((a) => a.op.kind === "delete")).toEqual([
      { type: "ENQUEUE_SYNC_OP", op: { feature: FEATURE, kind: "delete", key: "mine" } },
    ]);
  });

  it("keeps everything queued when the pull fails", async () => {
    mockFetchFolders.mockResolvedValue({ ok: false, status: 500 });
    signedInWith([pothi("stale")]);
    renderHook(() => usePothiSync());
    await act(async () => {
      expect(await impl().reconcile()).toBe(false);
    });
    await flush(10000);
    expect(mockPutFolders).not.toHaveBeenCalled();
    expect(enqueued()).toEqual([]);
  });
});

describe("usePothiSync drain outcomes", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockRegister.mockClear();
    mockFetchFolders.mockReset().mockResolvedValue(okRead([]));
    mockPutFolders.mockReset().mockResolvedValue(okRead([]));
    mockDeleteFolder.mockReset();
    signedInWith([pothi("mine")]);
    renderHook(() => usePothiSync());
    // The session's first pull, after which a put may go on its own.
    await act(async () => {
      await impl().reconcile();
    });
    mockDispatch.mockClear();
    mockPutFolders.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it("a put sends the CURRENT state and adopts what the server returns", async () => {
    mockPutFolders.mockResolvedValue(
      okRead([pothi("mine"), pothi("theirs")], { rejectedFolderIds: ["mine"], syncedAt: 42 })
    );
    const outcome = await impl().drain({ kind: "put", key: "sundar-gutka" });
    expect(outcome).toBe("done");
    expect(mockPutFolders).toHaveBeenCalledWith({
      source: "sundar-gutka",
      folders: [expect.objectContaining({ id: "mine" })],
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MERGE_REMOTE_POTHIS", folders: expect.any(Array) })
    );
    // A PUT answer is no read: its syncedAt cannot vouch for deletions made
    // elsewhere since the last one, so the watermark stays where it was.
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_POTHI_SYNC_WATERMARK" })
    );
  });

  it("network and server errors are retried; a bad request is not", async () => {
    mockPutFolders.mockResolvedValueOnce({ ok: false, status: 0 });
    expect(await impl().drain({ kind: "put" })).toBe("retry");
    mockPutFolders.mockResolvedValueOnce({ ok: false, status: 503 });
    expect(await impl().drain({ kind: "put" })).toBe("retry");
    mockPutFolders.mockResolvedValueOnce({ ok: false, status: 413 });
    expect(await impl().drain({ kind: "put" })).toBe("fatal");
    // A fault in the request itself, not the network: retrying cannot help.
    mockPutFolders.mockResolvedValueOnce({ ok: false, status: 0, error: "failed" });
    expect(await impl().drain({ kind: "put" })).toBe("fatal");
  });

  it("a delete is done on 204 and on an already-gone 404", async () => {
    mockDeleteFolder.mockResolvedValueOnce({ ok: true, status: 204 });
    expect(await impl().drain({ kind: "delete", key: "d1" })).toBe("done");
    mockDeleteFolder.mockResolvedValueOnce({ ok: false, status: 404 });
    expect(await impl().drain({ kind: "delete", key: "d1" })).toBe("done");
    expect(mockDeleteFolder).toHaveBeenCalledWith("d1");
  });
});

describe("usePothiSync default-pothi reseeding", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    buildDefaultPothis.mockReset().mockReturnValue([{ id: "default_morning_nitnem" }]);
    mockFetchFolders.mockReset().mockResolvedValue(okRead([]));
    mockPutFolders.mockReset().mockResolvedValue(okRead([]));
  });
  afterEach(() => jest.useRealTimers());

  // Sign out once, and the Folders tab was empty forever after — the seeding
  // effect's re-entrancy latch tripped on the FIRST seed of the hook's lifetime
  // and never released.
  it("reseeds after sign-out even though this hook instance already seeded once before", async () => {
    signedOutWith({ seededDefaults: false });
    const { rerender } = renderHook(() => usePothiSync());
    await flush(0);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SEED_DEFAULT_POTHIS",
      folders: [{ id: "default_morning_nitnem" }],
    });
    mockDispatch.mockClear();

    signedInWith([{ id: "default_morning_nitnem" }]);
    rerender();
    signedOutWith({ seededDefaults: false });
    rerender();
    await flush(0);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SEED_DEFAULT_POTHIS",
      folders: [{ id: "default_morning_nitnem" }],
    });
  });

  // The test above builds a FRESH pothi object for each sign-out, which is not
  // what the reducer does. Its initial state is one object built at module load
  // and handed back by reference every time the slice is cleared. The latch was
  // set on that object by the first seed and matched it again on the second
  // sign-out, so the first sign-out showed the defaults and the second showed
  // an empty list — exactly what was reported.
  it("reseeds on a second sign-out when the reducer hands back the SAME initial object", async () => {
    const INITIAL = { folders: [], seededDefaults: false, lastSyncedAt: null, deletedIds: [] };
    const signedOutOn = (pothis) => {
      mockState = { auth: { status: "signedOut" }, baniList: [{ id: 1 }], pothis };
    };
    const seeded = () =>
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SEED_DEFAULT_POTHIS",
        folders: [{ id: "default_morning_nitnem" }],
      });

    signedOutOn(INITIAL);
    const { rerender } = renderHook(() => usePothiSync());
    await flush(0);
    seeded();
    mockDispatch.mockClear();

    // Three more sign-in / sign-out rounds, without a restart in between. Each
    // sign-out clears the slice and the reducer returns its ONE initial object
    // again, so every round has to seed afresh.
    for (let round = 0; round < 3; round += 1) {
      // The store reflects the seed, still signed out.
      signedOutOn({
        ...INITIAL,
        folders: [{ id: "default_morning_nitnem" }],
        seededDefaults: true,
      });
      rerender();
      signedInWith([{ id: "default_morning_nitnem" }]);
      rerender();
      signedOutOn(INITIAL);
      rerender();
      // eslint-disable-next-line no-await-in-loop
      await flush(0);

      seeded();
      mockDispatch.mockClear();
    }
  });
  // The API seeds a pair only under MyPothi, which this app does not read, so a
  // signed-in account with no Sundar Gutka pair gets this app's — but only once
  // the pull has shown it has none, or a pair still on its way would be doubled.
  it("seeds a signed-in account only after its first pull shows no pair", async () => {
    signedInWith([], { seededDefaults: false });
    mockState.baniList = [{ id: 1 }];
    const seededNow = () =>
      mockDispatch.mock.calls.some(([action]) => action.type === "SEED_DEFAULT_POTHIS");
    const { rerender } = renderHook(() => usePothiSync());
    await flush(0);
    expect(seededNow()).toBe(false);

    await act(async () => {
      await impl().reconcile();
    });
    rerender();
    await flush(0);
    expect(seededNow()).toBe(true);
  });

  it("does not reseed while already seeded", () => {
    signedOutWith({ folders: [{ id: "default_morning_nitnem" }], seededDefaults: true });
    renderHook(() => usePothiSync());
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SEED_DEFAULT_POTHIS" })
    );
  });
});

describe("seeding when redux has no bani list", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockGetBaniList.mockReset().mockResolvedValue([]);
    buildDefaultPothis.mockReset().mockReturnValue([]);
    mockFetchFolders.mockReset().mockResolvedValue(okRead([]));
  });
  afterEach(() => jest.useRealTimers());

  // The reported bug: sign out and the pothis were empty until the app was
  // closed and reopened. buildDefaultPothis is all-or-nothing, so with no bani
  // rows it returns [] and the effect seeds nothing; nothing then changes to
  // make it try again. Reopening worked only because that put HomeScreen back
  // on screen to fill the slice.
  it("reads the bani list from the database and seeds", async () => {
    mockGetBaniList.mockResolvedValueOnce([{ id: 1 }]);
    buildDefaultPothis.mockReturnValue([{ id: "default_morning_nitnem" }]);
    signedOutWithNoBaniList();

    renderHook(() => usePothiSync());
    await flush(0);

    expect(mockGetBaniList).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SEED_DEFAULT_POTHIS",
      folders: [{ id: "default_morning_nitnem" }],
    });
  });

  it("does not go to the database when redux already has the list", async () => {
    buildDefaultPothis.mockReturnValue([{ id: "default_morning_nitnem" }]);
    signedOutWith({ seededDefaults: false });

    renderHook(() => usePothiSync());
    await flush(0);

    expect(mockGetBaniList).not.toHaveBeenCalled();
  });

  it("does not read the database for a signed-in account that has its pair", async () => {
    signedInWith([]);

    renderHook(() => usePothiSync());
    await flush(0);

    expect(mockGetBaniList).not.toHaveBeenCalled();
  });
});

describe("usePothiSync and the outbox contract", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockRegister.mockClear();
    mockFetchFolders.mockReset().mockResolvedValue(okRead([]));
    mockPutFolders.mockReset().mockResolvedValue(okRead([]));
    mockDeleteFolder.mockReset().mockResolvedValue({ ok: true, status: 204 });
  });
  afterEach(() => jest.useRealTimers());

  const doneIds = () =>
    mockDispatch.mock.calls.map(([a]) => a).filter((a) => a.type === "SYNC_OP_DONE");

  // A put left in the outbox from an earlier launch must not go up ahead of
  // this session's pull: the list may predate deletions made elsewhere. Said
  // to be a conflict, the drainer hands it to the bulk sync, which pulls first.
  it("answers a put before this session's first pull as a conflict", async () => {
    signedInWith([pothi("mine")]);
    renderHook(() => usePothiSync());
    expect(await impl().drain({ kind: "put", key: "sundar-gutka" })).toBe("conflict");
    expect(mockPutFolders).not.toHaveBeenCalled();
  });

  it("marks done only the ops the reconcile carried", async () => {
    const carried = { id: "put-1", feature: FEATURE, kind: "put", key: "sundar-gutka" };
    const merged = { id: "put-2", feature: FEATURE, kind: "put", key: "x" };
    const other = { id: "set-1", feature: "settings", kind: "set", key: "fontSize" };
    signedInWith([pothi("mine")]);
    mockState.syncOutbox = { ops: { "put-1": carried, "put-2": merged, "set-1": other } };
    // While the push is out, put-2 takes in a later edit: same id, new object.
    mockPutFolders.mockImplementation(async () => {
      mockState.syncOutbox = {
        ops: { "put-1": carried, "put-2": { ...merged, payload: "newer" }, "set-1": other },
      };
      return okRead([]);
    });
    renderHook(() => usePothiSync());
    await act(async () => {
      expect(await impl().reconcile()).toBe(true);
    });
    expect(doneIds()).toEqual([{ type: "SYNC_OP_DONE", id: "put-1" }]);
  });

  it("marks nothing done when the push fails", async () => {
    signedInWith([pothi("mine")]);
    mockState.syncOutbox = {
      ops: { "put-1": { id: "put-1", feature: FEATURE, kind: "put", key: "sundar-gutka" } },
    };
    mockPutFolders.mockResolvedValue({ ok: false, status: 503 });
    renderHook(() => usePothiSync());
    await act(async () => {
      expect(await impl().reconcile()).toBe(false);
    });
    expect(doneIds()).toEqual([]);
  });

  it("joins a reconcile already running rather than sending the list twice", async () => {
    let release;
    mockFetchFolders.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    signedInWith([pothi("mine")]);
    renderHook(() => usePothiSync());
    let first;
    let second;
    await act(async () => {
      first = impl().reconcile();
      second = impl().reconcile();
    });
    await act(async () => {
      release(okRead([]));
      await Promise.all([first, second]);
    });
    expect(mockFetchFolders).toHaveBeenCalledTimes(1);
    expect(mockPutFolders).toHaveBeenCalledTimes(1);
  });

  // Sign-out's last push: an edit made after the running one built its list
  // must still go up before the outbox is dropped.
  it("a fresh reconcile runs again after the one already out", async () => {
    let release;
    mockFetchFolders.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    signedInWith([pothi("mine")]);
    renderHook(() => usePothiSync());
    let first;
    let fresh;
    await act(async () => {
      first = impl().reconcile();
    });
    signedInWith([pothi("mine"), pothi("later")]);
    await act(async () => {
      fresh = impl().reconcile({ fresh: true });
      release(okRead([]));
      await Promise.all([first, fresh]);
    });
    expect(mockPutFolders).toHaveBeenCalledTimes(2);
    expect(mockPutFolders).toHaveBeenLastCalledWith({
      source: "sundar-gutka",
      folders: [expect.objectContaining({ id: "mine" }), expect.objectContaining({ id: "later" })],
    });
  });
});

// Signing out purges the slice before the session ends — the logout browser
// is still to open — so for a while the list is empty while still signed in.
describe("usePothiSync across an account boundary", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockRegister.mockClear();
    buildDefaultPothis.mockReset().mockReturnValue([{ id: "default_morning_nitnem" }]);
    mockFetchFolders.mockReset().mockResolvedValue(okRead([]));
    mockPutFolders.mockReset().mockResolvedValue(okRead([]));
    mockDeleteFolder.mockReset().mockResolvedValue({ ok: true, status: 204 });
  });
  afterEach(() => jest.useRealTimers());

  const purged = () => {
    mockState = {
      ...mockState,
      accountEpoch: (mockState.accountEpoch ?? 0) + 1,
      baniList: [{ id: 1 }],
      pothis: { folders: [], seededDefaults: false, lastSyncedAt: null, deletedIds: [] },
    };
  };

  it("neither seeds nor uploads the emptied list of a sign-out under way", async () => {
    signedInWith([pothi("theirs")]);
    const { rerender } = renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    mockDispatch.mockClear();
    mockPutFolders.mockClear();

    purged();
    rerender();
    await flush(10000);
    rerender();
    await flush(10000);

    const types = mockDispatch.mock.calls.map(([a]) => a.type);
    expect(types).not.toContain("SEED_DEFAULT_POTHIS");
    expect(types).not.toContain("ENQUEUE_SYNC_OP");
    // Nor does a foreground sync in that window pull the account back down.
    await act(async () => {
      expect(await impl().reconcile()).toBe(false);
    });
    expect(mockFetchFolders).toHaveBeenCalledTimes(1);
  });

  it("seeds again once the session has ended", async () => {
    signedInWith([pothi("theirs")]);
    const { rerender } = renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    purged();
    rerender();
    mockState = { ...mockState, auth: { status: "signedOut" } };
    rerender();
    await flush(0);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SEED_DEFAULT_POTHIS",
      folders: [{ id: "default_morning_nitnem" }],
    });
  });

  it("drops a pull that lands after the boundary moved", async () => {
    let release;
    mockFetchFolders.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    signedInWith([pothi("mine")]);
    const { rerender } = renderHook(() => usePothiSync());
    let reconciled;
    await act(async () => {
      reconciled = impl().reconcile();
    });
    purged();
    rerender();
    await act(async () => {
      release(okRead([pothi("theirs")]));
      expect(await reconciled).toBe(false);
    });
    const types = mockDispatch.mock.calls.map(([a]) => a.type);
    expect(types).not.toContain("MERGE_REMOTE_POTHIS");
    expect(mockPutFolders).not.toHaveBeenCalled();
  });

  it("a put answered after a purge is done and applies nothing", async () => {
    signedInWith([pothi("mine")]);
    renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    mockDispatch.mockClear();
    mockPutFolders.mockImplementation(async () => {
      purged();
      return okRead([pothi("theirs")]);
    });
    expect(await impl().drain({ kind: "put", key: "sundar-gutka" })).toBe("done");
    const types = mockDispatch.mock.calls.map(([a]) => a.type);
    expect(types).not.toContain("MERGE_REMOTE_POTHIS");
  });

  it("a put answered after the session ended stays queued for it", async () => {
    signedInWith([pothi("mine")]);
    renderHook(() => usePothiSync());
    await act(async () => {
      await impl().reconcile();
    });
    mockDispatch.mockClear();
    // An expiry while it was out: the op still belongs to this account, so it
    // waits for the next sign-in rather than counting as sent.
    mockPutFolders.mockImplementation(async () => {
      mockState = { ...mockState, auth: { status: "signedOut" } };
      return okRead([pothi("theirs")]);
    });
    expect(await impl().drain({ kind: "put", key: "sundar-gutka" })).toBe("retry");
    const types = mockDispatch.mock.calls.map(([a]) => a.type);
    expect(types).not.toContain("MERGE_REMOTE_POTHIS");
  });
});
