import fs from "fs";
import path from "path";
import * as actions from "../actions";
import reducer from "../reducer";
import { createPothi, makeBaniItem, MAX_PINNED, SOURCE } from "./model";

// Both mocks sit under the imports because Babel hoists jest.mock above them
// regardless, so the imports still resolve to the mocked modules.

// `actions` reaches Firebase Analytics, which jest cannot transform.
jest.mock("../firebase/analytics", () => ({
  trackSettingEvent: jest.fn(),
  trackBaniArtistDefault: jest.fn(),
}));

// react-native-localization reads a native module at import time. The actions
// file imports STRINGS; this suite uses none of them.
jest.mock("../localization", () => ({ __esModule: true, default: {} }));

// The model owns the rules and is tested on its own. This covers the wiring:
// that each action reaches the right transition, that `pothis` is actually in
// the root reducer, and that a rehydrated payload is reconciled not trusted.

const initial = () => reducer(undefined, { type: "@@INIT" });
const apply = (state, action) => reducer(state, action);
const item = (baaniId) => makeBaniItem({ baaniId, title: `Bani ${baaniId}` });
const first = (state) => state.pothis.folders[0];

describe("the pothis slice is wired into the root reducer", () => {
  it("starts empty, in the wire shape", () => {
    expect(initial().pothis).toEqual({
      folders: [],
      seededDefaults: false,
      lastSyncedAt: null,
      deletedIds: [],
      // Local only — which folder is Morning Nitnem and which is Evening.
      // Never sent: `toUpsertBody` takes only `folders`.
      defaultIds: { morning: null, evening: null },
    });
  });

  it("is not on redux-persist's blacklist — a pothi must survive a restart", () => {
    // Read as source rather than imported: store.js builds a live AsyncStorage
    // persistor at module scope. The blacklist is the one line that decides
    // whether someone's collections are still there next launch, so it is worth
    // a static check that no future edit quietly adds "pothis" to it.
    const store = fs.readFileSync(path.join(__dirname, "..", "store.js"), "utf8");
    const blacklist = store.match(/blacklist:\s*\[([^\]]*)\]/)?.[1] ?? "";
    expect(blacklist).not.toMatch(/["']pothis["']/);
  });
});

describe("action round trips", () => {
  it("creates, then holds the pothi in the folders array", () => {
    const pothi = createPothi({ id: "p1", name: "Nitnem" });
    const s = apply(initial(), actions.createPothi(pothi));
    expect(first(s).name).toBe("Nitnem");
    expect(first(s).source).toBe(SOURCE);
  });

  it("adds and removes a bani", () => {
    let s = apply(initial(), actions.createPothi(createPothi({ id: "p1", name: "a" })));
    s = apply(s, actions.addBaniToPothi("p1", item(12)));
    expect(first(s).items.map((i) => i.baaniId)).toEqual([12]);
    s = apply(s, actions.removeBaniFromPothi("p1", 12));
    expect(first(s).items).toEqual([]);
  });

  it("renames", () => {
    let s = apply(initial(), actions.createPothi(createPothi({ id: "p1", name: "a" })));
    s = apply(s, actions.renamePothi("p1", "ਸੁਖਮਨੀ"));
    expect(first(s).name).toBe("ਸੁਖਮਨੀ");
  });

  it("refuses to rename to blank — a nameless row is unusable", () => {
    let s = apply(initial(), actions.createPothi(createPothi({ id: "p1", name: "a" })));
    s = apply(s, actions.renamePothi("p1", "   "));
    expect(first(s).name).toBe("a");
  });

  it("deletes", () => {
    let s = apply(initial(), actions.createPothi(createPothi({ id: "p1", name: "a" })));
    s = apply(s, actions.deletePothi("p1"));
    expect(s.pothis.folders).toEqual([]);
  });

  it("reorders and pins", () => {
    let s = initial();
    ["p1", "p2"].forEach((id) => {
      s = apply(s, actions.createPothi(createPothi({ id, name: id })));
    });
    s = apply(s, actions.setPothiOrder(["p1", "p2"]));
    expect(s.pothis.folders.map((f) => f.id)).toEqual(["p1", "p2"]);
    s = apply(s, actions.togglePothiPin("p2"));
    expect(s.pothis.folders.find((f) => f.id === "p2").pinned).toBe(true);
  });

  it("will not pin more than the ceiling", () => {
    let s = initial();
    ["p1", "p2", "p3", "p4"].forEach((id) => {
      s = apply(s, actions.createPothi(createPothi({ id, name: id })));
      s = apply(s, actions.togglePothiPin(id));
    });
    expect(s.pothis.folders.filter((f) => f.pinned)).toHaveLength(MAX_PINNED);
  });
});

describe("defaults are seeded exactly once", () => {
  it("adds the supplied pothis and latches the flag", () => {
    const defaults = [createPothi({ id: "m", name: "Morning" })];
    const s = apply(initial(), actions.seedDefaultPothis(defaults));
    expect(s.pothis.seededDefaults).toBe(true);
    expect(s.pothis.folders.map((f) => f.id)).toEqual(["m"]);
  });

  it("latches even when the bani list produced nothing, so it is not retried forever", () => {
    const s = apply(initial(), actions.seedDefaultPothis([]));
    expect(s.pothis.seededDefaults).toBe(true);
    expect(s.pothis.folders).toEqual([]);
  });
});

describe("sync", () => {
  it("merges the server's folders and records when it synced", () => {
    const remote = [
      {
        id: "r1",
        name: "From server",
        source: SOURCE,
        items: [],
        createdAt: 1,
        updatedAt: 2,
        isPublic: false,
        pinned: false,
      },
    ];
    let s = apply(initial(), actions.mergeRemotePothis(remote));
    expect(first(s).name).toBe("From server");
    s = apply(s, actions.setPothisSyncedAt("2026-08-09T00:00:00.000Z"));
    expect(s.pothis.lastSyncedAt).toBe("2026-08-09T00:00:00.000Z");
  });

  it("keeps deletion tombstones until their DELETE request succeeds", () => {
    let s = apply(initial(), actions.createPothi(createPothi({ id: "p1", name: "One" })));
    s = apply(s, actions.deletePothi("p1"));
    s = apply(s, actions.setPothisSyncedAt("2026-08-09T00:00:00.000Z"));
    expect(s.pothis.deletedIds).toEqual(["p1"]);
  });
});

describe("rehydrate", () => {
  it("reconciles the persisted payload instead of trusting it", () => {
    const s = reducer(undefined, {
      type: "persist/REHYDRATE",
      payload: {
        pothis: {
          folders: [{ id: "p1", name: "a", items: [{ baaniId: 1 }, { baaniId: 1 }] }],
          seededDefaults: true,
        },
      },
    });
    expect(s.pothis.folders[0].items.map((i) => i.baaniId)).toEqual([1]);
    expect(s.pothis.seededDefaults).toBe(true);
  });

  it("leaves a fresh install alone", () => {
    const s = reducer(undefined, { type: "persist/REHYDRATE", payload: {} });
    expect(s.pothis).toEqual({
      folders: [],
      seededDefaults: false,
      lastSyncedAt: null,
      deletedIds: [],
      defaultIds: { morning: null, evening: null },
    });
  });
});
