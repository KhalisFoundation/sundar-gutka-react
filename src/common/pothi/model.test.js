import {
  addBani,
  addPothi,
  countPinned,
  createPothi,
  deletePothi,
  emptyPothis,
  defaultPothi,
  defaultPothiId,
  EVENING_ID,
  EVENING_NITNEM_IDS,
  isDefaultPothi,
  isValidName,
  listPothis,
  makeBaniItem,
  MAX_FOLDERS,
  MAX_ITEMS_PER_FOLDER,
  MAX_NAME_LENGTH,
  MAX_PINNED,
  mergeRemote,
  MORNING_ID,
  MORNING_NITNEM_IDS,
  normaliseName,
  pothisContaining,
  reconcile,
  removeBani,
  renamePothi,
  seedDefaults,
  setOrder,
  SOURCE,
  toUpsertBody,
  togglePin,
} from "./model";

// A pothi is the only user-authored structure in the app, so these rules are
// the ones that lose someone's collection if they are wrong.
//
// State is the WIRE shape (khalis-users-api FolderDto), so several of these
// assert the server's limits: exceeding one is a 400 on the whole PUT, which
// would silently strand every later edit.

const item = (baaniId, title = `Bani ${baaniId}`) => makeBaniItem({ baaniId, title });

const seed = (names) =>
  names.reduce(
    (state, name, i) => addPothi(state, createPothi({ id: name, name, now: 1000 + i })),
    emptyPothis()
  );

const ids = (state) => listPothis(state).map((folder) => folder.id);

describe("createPothi", () => {
  it("produces the wire shape the API expects", () => {
    const p = createPothi({ id: "p1", name: "Nitnem", now: 5 });
    expect(p).toEqual({
      id: "p1",
      name: "Nitnem",
      source: SOURCE,
      items: [],
      createdAt: 5,
      updatedAt: 5,
      isPublic: false,
      pinned: false,
    });
  });

  it("trims the name and caps it at the server's 50", () => {
    expect(createPothi({ name: "  Nitnem  " }).name).toBe("Nitnem");
    expect(createPothi({ name: "ਪ".repeat(200) }).name).toHaveLength(MAX_NAME_LENGTH);
  });

  it("keeps Gurmukhi intact — the name is expected to be Punjabi", () => {
    expect(createPothi({ name: "ਮੇਰੀ ਪੋਥੀ" }).name).toBe("ਮੇਰੀ ਪੋਥੀ");
  });

  it("mints a distinct id each time, inside the 64-char limit", () => {
    const made = Array.from({ length: 50 }, () => createPothi({ name: "x" }).id);
    expect(new Set(made).size).toBe(50);
    made.forEach((id) => expect(id.length).toBeLessThanOrEqual(64));
  });
});

describe("makeBaniItem", () => {
  it("is a type-discriminated bani item", () => {
    const made = makeBaniItem({ baaniId: 4, title: "ਜਾਪੁ ਸਾਹਿਬ" });
    expect(made.type).toBe("bani");
    expect(made.baaniId).toBe(4);
    expect(made.title).toBe("ਜਾਪੁ ਸਾਹਿਬ");
    expect(typeof made.id).toBe("string");
  });

  it("falls back to the id when a title is missing — the API requires one", () => {
    expect(makeBaniItem({ baaniId: 7 }).title).toBe("7");
  });
});

describe("names", () => {
  it("rejects blank and whitespace-only", () => {
    ["", "   ", "\n\t", null, undefined].forEach((n) => expect(isValidName(n)).toBe(false));
  });

  it("accepts a real name", () => {
    expect(isValidName("ਸੁਖਮਨੀ")).toBe(true);
    expect(normaliseName("  ਸੁਖਮਨੀ ")).toBe("ਸੁਖਮਨੀ");
  });
});

describe("renamePothi", () => {
  it("renames and bumps updatedAt", () => {
    const s = renamePothi(seed(["a"]), "a", "  ਸੁਖਮਨੀ  ", 7000);
    expect(s.folders[0].name).toBe("ਸੁਖਮਨੀ");
    expect(s.folders[0].updatedAt).toBe(7000);
  });

  it("refuses a blank name — a nameless row cannot be identified", () => {
    const s = seed(["a"]);
    expect(renamePothi(s, "a", "   ")).toBe(s);
  });

  it("ignores an unknown pothi", () => {
    const s = seed(["a"]);
    expect(renamePothi(s, "nope", "x")).toBe(s);
  });
});

describe("adding and removing banis", () => {
  it("appends in the order added", () => {
    let s = seed(["a"]);
    s = addBani(s, "a", item(7));
    s = addBani(s, "a", item(3));
    expect(s.folders[0].items.map((i) => i.baaniId)).toEqual([7, 3]);
  });

  it("returns the SAME state when the bani is already there", () => {
    // Identity is the signal the add flow uses to say "already in this pothi"
    // instead of showing a success toast for a no-op.
    const s = addBani(seed(["a"]), "a", item(7));
    expect(addBani(s, "a", item(7))).toBe(s);
  });

  it("ignores an unknown pothi rather than creating one", () => {
    const s = seed(["a"]);
    expect(addBani(s, "nope", item(7))).toBe(s);
  });

  it("stops at the server's per-folder ceiling", () => {
    let s = seed(["a"]);
    for (let i = 1; i <= MAX_ITEMS_PER_FOLDER; i += 1) s = addBani(s, "a", item(i));
    expect(s.folders[0].items).toHaveLength(MAX_ITEMS_PER_FOLDER);
    expect(addBani(s, "a", item(9999))).toBe(s);
  });

  it("removes by bani id without disturbing the rest", () => {
    let s = seed(["a"]);
    [1, 2, 3].forEach((id) => {
      s = addBani(s, "a", item(id));
    });
    expect(removeBani(s, "a", 2).folders[0].items.map((i) => i.baaniId)).toEqual([1, 3]);
  });

  it("bumps updatedAt only on a real change", () => {
    const s = addBani(seed(["a"]), "a", item(1), 5000);
    expect(s.folders[0].updatedAt).toBe(5000);
    expect(addBani(s, "a", item(1), 9000).folders[0].updatedAt).toBe(5000);
  });
});

describe("ordering", () => {
  it("puts a new pothi first — it is the one about to be used", () => {
    expect(ids(seed(["a", "b", "c"]))).toEqual(["c", "b", "a"]);
  });

  it("stamps the pothis a drag moved, and only those", () => {
    // The server takes positions from the PUT's order but only for rows newer
    // than its own, so an unstamped reorder was refused and undone by the
    // next pull.
    // Seeded newest-first, so the list starts c, b, a; c stays put.
    const s = setOrder(seed(["a", "b", "c"]), ["c", "a", "b"], 9999);
    expect(s.folders.map((f) => [f.id, f.updatedAt])).toEqual([
      ["c", 1002],
      ["a", 9999],
      ["b", 9999],
    ]);
  });

  it("applies a dragged order", () => {
    expect(ids(setOrder(seed(["a", "b", "c"]), ["a", "b", "c"]))).toEqual(["a", "b", "c"]);
  });

  it("never drops a pothi the caller omitted", () => {
    // The screen drags only the unpinned lane, so it hands back a partial list.
    const s = setOrder(seed(["a", "b", "c"]), ["c"]);
    expect(s.folders).toHaveLength(3);
    expect(s.folders[0].id).toBe("c");
  });

  it("ignores ids that do not exist", () => {
    expect(ids(setOrder(seed(["a"]), ["ghost", "a"]))).toEqual(["a"]);
  });
});

describe("the folder ceiling", () => {
  it("refuses a 51st pothi — the server would 400 the whole sync", () => {
    let s = emptyPothis();
    for (let i = 0; i < MAX_FOLDERS; i += 1) {
      s = addPothi(s, createPothi({ id: `p${i}`, name: `p${i}` }));
    }
    expect(s.folders).toHaveLength(MAX_FOLDERS);
    expect(addPothi(s, createPothi({ id: "over", name: "over" }))).toBe(s);
  });
});

describe("pinning", () => {
  it("lifts a pinned pothi to the top", () => {
    let s = setOrder(seed(["a", "b", "c"]), ["a", "b", "c"]);
    s = togglePin(s, "c");
    expect(ids(s)).toEqual(["c", "a", "b"]);
  });

  it("stops at the ceiling and leaves state untouched", () => {
    let s = seed(["a", "b", "c", "d"]);
    ["a", "b", "c"].forEach((id) => {
      s = togglePin(s, id);
    });
    expect(countPinned(s)).toBe(MAX_PINNED);
    // Same object back — the screen reads that as "show the limit message".
    expect(togglePin(s, "d")).toBe(s);
  });

  it("restores the original slot when unpinned, not the end of the list", () => {
    let s = setOrder(seed(["a", "b", "c"]), ["a", "b", "c"]);
    s = togglePin(s, "c");
    expect(ids(s)).toEqual(["c", "a", "b"]);
    s = togglePin(s, "c");
    expect(ids(s)).toEqual(["a", "b", "c"]);
  });

  it("drops the pin when the pothi is deleted", () => {
    let s = togglePin(seed(["a"]), "a");
    s = deletePothi(s, "a");
    expect(countPinned(s)).toBe(0);
    expect(ids(s)).toEqual([]);
  });
});

describe("pothisContaining", () => {
  it("finds every pothi holding a bani, in display order", () => {
    let s = setOrder(seed(["a", "b", "c"]), ["a", "b", "c"]);
    s = addBani(s, "a", item(12));
    s = addBani(s, "c", item(12));
    expect(pothisContaining(s, 12)).toEqual(["a", "c"]);
    expect(pothisContaining(s, 99)).toEqual([]);
  });
});

describe("reading an absent slice", () => {
  // These are called by leaf components, which mount against partial stores and
  // before rehydration finishes. A folder list is never worth a screen crash.
  it.each([undefined, null, {}, { folders: [] }])("survives %p", (state) => {
    expect(listPothis(state)).toEqual([]);
    expect(pothisContaining(state, 1)).toEqual([]);
  });
});

describe("toUpsertBody", () => {
  it("sends every pothi, under the app's source", () => {
    const s = addBani(seed(["a"]), "a", item(2));
    const body = toUpsertBody(s);
    expect(body.source).toBe(SOURCE);
    expect(body.folders).toHaveLength(1);
    expect(body.folders[0].items[0].baaniId).toBe(2);
  });

  // The API seeds a pair only under the MyPothi source, which this app does not
  // read, so the pair this app seeds IS the account's Sundar Gutka pair. Left
  // off the wire, it never reached the account or sttm-next's Sundar Gutka
  // screen, which then seeded folders of its own.
  it("sends the seeded defaults too, untouched or not", () => {
    const stock = MORNING_NITNEM_IDS.map((id) => makeBaniItem({ baaniId: id, title: `B${id}` }));
    const pristine = createPothi({ id: MORNING_ID, name: "ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ", items: stock, now: 7 });
    expect(toUpsertBody(addPothi(emptyPothis(), pristine)).folders.map((f) => f.id)).toEqual([
      MORNING_ID,
    ]);
  });

  it("omits the local-only bookkeeping the API does not accept", () => {
    const body = toUpsertBody({ ...seed(["a"]), seededDefaults: true, lastSyncedAt: "x" });
    expect(body.seededDefaults).toBeUndefined();
    expect(body.lastSyncedAt).toBeUndefined();
    const wire = ["id", "name", "source", "items", "createdAt", "updatedAt", "isPublic", "pinned"];
    Object.keys(body.folders[0]).forEach((key) => expect(wire).toContain(key));
  });
});

describe("mergeRemote", () => {
  const remote = (id, updatedAt, name = id) => ({
    id,
    name,
    source: SOURCE,
    items: [],
    createdAt: 1,
    updatedAt,
    isPublic: false,
    pinned: false,
  });

  it("adopts a folder only the server has", () => {
    const s = mergeRemote(emptyPothis(), [remote("r1", 10)]);
    expect(ids(s)).toEqual(["r1"]);
  });

  it("keeps a folder only this device has — created offline or before sign-in", () => {
    const s = mergeRemote(seed(["local"]), []);
    expect(ids(s)).toEqual(["local"]);
  });

  it("resolves a conflict per FOLDER, so each device keeps its own edit", () => {
    // Document-level last-write-wins would throw one of these away.
    let local = seed(["a", "b"]);
    local = renamePothi(local, "a", "local wins", 9000);
    const merged = mergeRemote(local, [
      remote("a", 100, "stale"),
      remote("b", 9999, "remote wins"),
    ]);
    const byId = Object.fromEntries(merged.folders.map((f) => [f.id, f.name]));
    expect(byId.a).toBe("local wins");
    expect(byId.b).toBe("remote wins");
  });

  it("runs the result through reconcile, so a bad server payload cannot land", () => {
    const s = mergeRemote(emptyPothis(), [{ ...remote("r1", 1), items: [{ baaniId: 0 }] }]);
    expect(s.folders[0].items).toEqual([]);
  });

  // What a first sign-in actually is: a collection built with no account
  // meeting one the account already had. Neither side may be overwritten —
  // folders are merged per id, and an id only one side knows is simply kept.
  it("keeps both collections on a first sign-in and overwrites neither", () => {
    let guest = addPothi(emptyPothis(), createPothi({ id: "g1", name: "Shabads", now: 5000 }));
    guest = addPothi(guest, createPothi({ id: "g2", name: "Evening extras", now: 5001 }));

    const merged = mergeRemote(guest, [remote("s1", 10, "On the account")]);

    expect(ids(merged).sort()).toEqual(["g1", "g2", "s1"]);
    // And the guest's two go up on the next push rather than sitting local.
    expect(
      toUpsertBody(merged)
        .folders.map((f) => f.id)
        .sort()
    ).toEqual(["g1", "g2", "s1"]);
  });

  // The same pothi made twice — once here while signed out, once on another
  // client — is two ids for one folder. Only the server's survives: its id is
  // the one every other device already refers to.
  it("collapses a local-only copy of a folder the account already has", () => {
    const mine = addPothi(
      emptyPothis(),
      createPothi({ id: "p_local", name: "Sukhmani", items: [item(2)], now: 5000 })
    );
    const theirs = { ...remote("srv-uuid", 10, "Sukhmani"), items: [item(2)] };

    expect(ids(mergeRemote(mine, [theirs]))).toEqual(["srv-uuid"]);
  });

  // The account also holds sttm-next's MyPothi folders, which can carry shabads
  // the API refuses under this app's source. Taken in, they would be relabelled
  // and fail every later upload.
  it("takes in only folders of the app's own source", () => {
    const merged = mergeRemote(emptyPothis(), [
      remote("sg", 10),
      { ...remote("web", 10), source: "mypothi" },
    ]);
    expect(ids(merged)).toEqual(["sg"]);
  });

  it("keeps a local-only pothi that merely SHARES A NAME with one on the account", () => {
    const mine = addPothi(
      emptyPothis(),
      createPothi({ id: "p_local", name: "Sukhmani", items: [item(2)], now: 5000 })
    );
    const theirs = { ...remote("srv-uuid", 10, "Sukhmani"), items: [item(9)] };

    expect(ids(mergeRemote(mine, [theirs])).sort()).toEqual(["p_local", "srv-uuid"]);
  });
});

// Every device seeds the defaults under the same ids, so two copies of one
// default meet on a pull. A stock copy holds no work and must never replace an
// edited one, whichever clock is newer.
describe("two copies of a default pothi", () => {
  const items = (baniIds) => baniIds.map((id) => makeBaniItem({ baaniId: id, title: `B${id}` }));
  const morning = (baniIds, createdAt, updatedAt = createdAt) => ({
    id: MORNING_ID,
    name: "ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ",
    source: SOURCE,
    items: items(baniIds),
    createdAt,
    updatedAt,
    isPublic: false,
    pinned: false,
  });
  const merge = (mine, theirs, now = 12345) =>
    mergeRemote({ ...emptyPothis(), folders: [mine] }, [theirs], now);

  // A guest arranges their nitnem, then signs in to an account whose stock pair
  // another phone uploaded just now. Time alone would hand them the stock list.
  it("keeps an edited local nitnem against a newer stock copy, stamped to win the upload", () => {
    const merged = merge(morning([2, 4, 6, 9, 10, 11], 1, 2000), morning(MORNING_NITNEM_IDS, 9000));
    expect(merged.folders).toHaveLength(1);
    expect(merged.folders[0].items.map((i) => i.baaniId)).toEqual([2, 4, 6, 9, 10, 11]);
    // The API keeps only a strictly newer copy, so the old clock would be refused.
    expect(merged.folders[0].updatedAt).toBe(12345);
  });

  // The reverse: a stock pair seeded on this phone today is newer than a nitnem
  // another phone arranged last week.
  it("takes an edited copy from the account over a newer stock copy here", () => {
    const merged = merge(morning(MORNING_NITNEM_IDS, 9000), morning([2, 4], 1, 5000));
    expect(merged.folders[0].items.map((i) => i.baaniId)).toEqual([2, 4]);
    expect(merged.folders[0].updatedAt).toBe(5000);
  });

  it("lets the newer edit win when both copies were edited", () => {
    const merged = merge(morning([2, 4], 1, 2000), morning([2, 4, 6], 1, 5000));
    expect(merged.folders[0].items.map((i) => i.baaniId)).toEqual([2, 4, 6]);
  });

  it("never leaves two Morning Nitnems behind", () => {
    const merged = merge(morning(MORNING_NITNEM_IDS, 9000), morning(MORNING_NITNEM_IDS, 5000));
    expect(merged.folders.filter((f) => f.id === MORNING_ID)).toHaveLength(1);
  });
});

// Which folder is Morning Nitnem and which is Evening.
//
// The name is not stable — each device seeds the pair in its own language, and
// another client can rename it — so this pointer is the only thing that keeps
// the Dashboard's Today's Nitnem attached to the right pothi.
describe("the default pothi pointer", () => {
  const withItems = (id, name, baniIds, extra = {}) => ({
    ...createPothi({ id, name, items: baniIds.map((baniId) => item(baniId)) }),
    ...extra,
  });
  const seededPair = () =>
    seedDefaults(emptyPothis(), [
      withItems(MORNING_ID, "ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ", MORNING_NITNEM_IDS),
      withItems(EVENING_ID, "ਸ਼ਾਮ ਦਾ ਨਿਤਨੇਮ", EVENING_NITNEM_IDS),
    ]);

  it("lists Morning above Evening — the order a nitnem is read in", () => {
    const order = listPothis(seededPair()).map((pothi) => pothi.id);

    // addPothi prepends, so seeding the pair forwards used to invert it.
    expect(order).toEqual([MORNING_ID, EVENING_ID]);
  });

  it("keeps the pair at the top, above new and pinned pothis", () => {
    let s = addPothi(seededPair(), createPothi({ id: "mine", name: "Mine" }));
    s = addPothi(s, createPothi({ id: "pinned", name: "Pinned" }));
    s = togglePin(s, "pinned");
    expect(ids(s)).toEqual([MORNING_ID, EVENING_ID, "pinned", "mine"]);
  });

  it("refuses to pin a default", () => {
    const before = seededPair();
    expect(togglePin(before, MORNING_ID)).toBe(before);
    expect(togglePin(before, EVENING_ID)).toBe(before);
  });

  it("clears a default's stale pin without spending a pin slot on it", () => {
    const pinnedPair = {
      ...seededPair(),
      folders: seededPair().folders.map((folder) => ({ ...folder, pinned: true })),
    };
    const extra = ["a", "b", "c"].map((id) => ({ id, name: id, items: [], pinned: true }));
    const s = reconcile({ ...pinnedPair, folders: [...pinnedPair.folders, ...extra] });
    expect(s.folders.filter((f) => f.pinned).map((f) => f.id)).toEqual(["a", "b", "c"]);
  });

  it("is recorded when the pair is seeded", () => {
    const s = seededPair();
    expect(defaultPothiId(s, "morning")).toBe(MORNING_ID);
    expect(defaultPothiId(s, "evening")).toBe(EVENING_ID);
    expect(s.seededDefaults).toBe(true);
  });

  // A device with no recorded pointer finds the pair by its id or its banis.
  // Renaming a default is refused so the pair stays recognisable everywhere.
  it("refuses to rename a default, leaving the pothi exactly as it was", () => {
    const before = seededPair();
    expect(renamePothi(before, MORNING_ID, "My Morning Path")).toBe(before);
    expect(renamePothi(before, EVENING_ID, "My Evening Path")).toBe(before);
  });

  it("still renames an ordinary pothi", () => {
    const s = addPothi(seededPair(), createPothi({ id: "mine", name: "Old", now: 1 }));
    const renamed = renamePothi(s, "mine", "New", 2);
    expect(renamed.folders.find((f) => f.id === "mine").name).toBe("New");
  });

  // The well-known id is the one identity that survives a rename and an edit
  // together. A folder can carry a changed name even though this app refuses
  // to rename — another client, or a build from before the refusal — and the
  // pair must still be found on a device that has never recorded it.
  it("finds a default by its well-known id on a device with no pointer", () => {
    const renamedAndEdited = {
      ...createPothi({ id: MORNING_ID, name: "Amritvela", items: [item(2), item(11)], now: 1 }),
    };
    const s = reconcile({ folders: [renamedAndEdited], defaultIds: {} });
    expect(defaultPothiId(s, "morning")).toBe(MORNING_ID);
  });

  it("survives an edit to its contents", () => {
    const s = reconcile(removeBani(seededPair(), MORNING_ID, MORNING_NITNEM_IDS[0]));
    expect(defaultPothiId(s, "morning")).toBe(MORNING_ID);
  });

  // A pair on the account under ids this device does not know, and no record
  // of which is which: their contents still identify them.
  it("recovers an unrecorded pair from the server by its banis", () => {
    const merged = mergeRemote(emptyPothis(), [
      withItems("uuid-morning", "Morning Nitnem", MORNING_NITNEM_IDS),
      withItems("uuid-evening", "Evening Nitnem", EVENING_NITNEM_IDS),
    ]);
    expect(defaultPothiId(merged, "morning")).toBe("uuid-morning");
    expect(defaultPothiId(merged, "evening")).toBe("uuid-evening");
  });

  it("points at nothing when neither pothi is there", () => {
    const s = reconcile(seed(["a", "b"]));
    expect(defaultPothiId(s, "morning")).toBeNull();
    expect(defaultPothi(s, "morning")).toBeNull();
  });

  it("names the two defaults, and nothing else, as undeletable", () => {
    const s = addPothi(seededPair(), createPothi({ id: "mine", name: "Mine" }));
    expect(isDefaultPothi(s, MORNING_ID)).toBe(true);
    expect(isDefaultPothi(s, EVENING_ID)).toBe(true);
    expect(isDefaultPothi(s, "mine")).toBe(false);
    expect(isDefaultPothi(s, undefined)).toBe(false);
  });

  // The app refuses to delete a default, but another client can. The pointer
  // must go with it rather than dangle and be re-resolved onto some unrelated
  // folder on the next reconcile.
  it("is dropped when the pothi is deleted from elsewhere", () => {
    const s = reconcile(deletePothi(seededPair(), MORNING_ID));
    expect(defaultPothiId(s, "morning")).toBeNull();
    expect(defaultPothiId(s, "evening")).toBe(EVENING_ID);
  });

  it("is never sent to the server", () => {
    expect(Object.keys(toUpsertBody(seededPair()))).toEqual(["source", "folders"]);
  });
});

describe("deleting sticks", () => {
  it("records a tombstone so a later pull cannot resurrect it", () => {
    // The bug: delete locally, the server still has it, the next pull saw an id
    // local did not have and adopted it as new. Every deleted pothi came back.
    let s = seed(["a", "b"]);
    s = deletePothi(s, "a");
    expect(s.deletedIds).toContain("a");

    const remote = {
      id: "a",
      name: "a",
      source: SOURCE,
      items: [],
      createdAt: 1,
      updatedAt: 99999,
      isPublic: false,
      pinned: false,
    };
    // Even with a NEWER server copy, the deletion wins.
    expect(mergeRemote(s, [remote]).folders.map((f) => f.id)).toEqual(["b"]);
  });

  it("keeps suppressing when ANOTHER client puts the folder back", () => {
    // The web app replaces the whole source with no revision check, so it can
    // upload a stale list that resurrects what this device deleted. The
    // tombstone has to outlive the 204, or the pothi reappears here too.
    let s = deletePothi(seed(["a", "b"]), "a");
    const resurrected = {
      id: "a",
      name: "a",
      source: SOURCE,
      items: [],
      createdAt: 1,
      updatedAt: 99999,
      isPublic: false,
      pinned: false,
    };
    s = mergeRemote(s, [resurrected]);
    expect(s.folders.map((f) => f.id)).toEqual(["b"]);
    // Still buried, so the next delete attempt goes out again.
    expect(s.deletedIds).toEqual(["a"]);
  });

  it("retires the tombstone only when a pull shows the server agrees", () => {
    let s = deletePothi(seed(["a", "b"]), "a");
    expect(s.deletedIds).toEqual(["a"]);
    // A pull whose payload no longer contains "a" is the proof it is gone.
    s = mergeRemote(s, []);
    expect(s.deletedIds).toEqual([]);
  });

  it("keeps a local pothi that only LOOKS like a default", () => {
    // Same banis but a user-made id — not ours to remove.
    const items = [{ id: "i1", type: "bani", baaniId: 2, title: "Japji" }];
    let s = addPothi(emptyPothis(), createPothi({ id: "p_mine", name: "Mine", items }));
    s = mergeRemote(s, [
      {
        id: "srv",
        name: "Morning Nitnem",
        source: SOURCE,
        items,
        createdAt: 1,
        updatedAt: 2,
        isPublic: false,
        pinned: false,
      },
    ]);
    expect(s.folders.map((f) => f.id).sort()).toEqual(["p_mine", "srv"]);
  });

  it("carries tombstones through a rehydrate", () => {
    expect(reconcile({ folders: [], deletedIds: ["gone", 7] }).deletedIds).toEqual(["gone"]);
  });
});

describe("reconcile", () => {
  it("returns an empty set for a fresh install", () => {
    expect(reconcile(undefined)).toEqual(emptyPothis());
    expect(reconcile({})).toEqual(emptyPothis());
  });

  it("drops an item with no usable bani id rather than rendering a hole", () => {
    const s = reconcile({ folders: [{ id: "a", name: "a", items: [{ baaniId: 3 }, {}, null] }] });
    expect(s.folders[0].items.map((i) => i.baaniId)).toEqual([3]);
  });

  it("de-duplicates banis that a bad write doubled up", () => {
    const s = reconcile({
      folders: [{ id: "a", name: "a", items: [{ baaniId: 1 }, { baaniId: 1 }, { baaniId: 2 }] }],
    });
    expect(s.folders[0].items.map((i) => i.baaniId)).toEqual([1, 2]);
  });

  it("trims pins past the ceiling", () => {
    const folders = ["a", "b", "c", "d"].map((id) => ({ id, name: id, items: [], pinned: true }));
    expect(countPinned(reconcile({ folders }))).toBe(MAX_PINNED);
  });

  it("caps the folder count at the server's limit", () => {
    // Distinct names: identical empty folders are exact copies and would be
    // collapsed by the de-duplication below before the cap could apply.
    const folders = Array.from({ length: 80 }, (_, i) => ({
      id: `p${i}`,
      name: `n${i}`,
      items: [],
    }));
    expect(reconcile({ folders }).folders).toHaveLength(MAX_FOLDERS);
  });

  it("collapses exact duplicates — same name AND same banis", () => {
    // The self-heal for devices that seeded the defaults twice under an older
    // build: those copies have DIFFERENT random ids, so only matching on
    // content finds them.
    const dupe = (id) => ({ id, name: "Morning Nitnem", items: [{ baaniId: 2 }, { baaniId: 4 }] });
    const s = reconcile({ folders: [dupe("p_a"), dupe("p_b")] });
    expect(s.folders).toHaveLength(1);
    expect(s.folders[0].id).toBe("p_a");
  });

  it("keeps two pothis that merely share a name", () => {
    // Only exact copies go. A folder someone deliberately made must survive,
    // which is why the signature includes the banis and not just the name.
    const s = reconcile({
      folders: [
        { id: "a", name: "Nitnem", items: [{ baaniId: 2 }] },
        { id: "b", name: "Nitnem", items: [{ baaniId: 4 }] },
      ],
    });
    expect(s.folders).toHaveLength(2);
  });

  it("gives a nameless folder its id, so no row renders blank", () => {
    expect(reconcile({ folders: [{ id: "a", items: [] }] }).folders[0].name).toBe("a");
  });

  // Server folders are filtered to the app's source before this, so only a
  // folder an earlier build stored under another name is relabelled.
  it("stores every folder under the app's source", () => {
    const s = reconcile({
      folders: [
        { id: "a", name: "a", items: [], source: "mypothi" },
        { id: "b", name: "b", items: [], source: "nonsense" },
      ],
    });
    expect(s.folders.map((f) => f.source)).toEqual([SOURCE, SOURCE]);
  });

  it("carries the local-only bookkeeping through", () => {
    const s = reconcile({
      folders: [],
      seededDefaults: true,
      lastSyncedAt: "2026-01-01T00:00:00Z",
    });
    expect(s.seededDefaults).toBe(true);
    expect(s.lastSyncedAt).toBe("2026-01-01T00:00:00Z");
  });
});

// The account's pair is the one this app seeds under fixed ids. Once a pull
// shows the account has had it — live, or deleted from another client — seeding
// again would add a second pair or bring a deleted one back.
describe("whether the account already has its default pair", () => {
  const remote = (over) => ({
    name: "x",
    source: SOURCE,
    items: [],
    createdAt: 1,
    updatedAt: 1,
    isPublic: false,
    pinned: false,
    ...over,
  });

  it("is yes when the account holds a default", () => {
    expect(mergeRemote(emptyPothis(), [remote({ id: MORNING_ID })]).seededDefaults).toBe(true);
  });

  it("is yes when another client deleted one", () => {
    expect(mergeRemote(emptyPothis(), [], 1, [EVENING_ID]).seededDefaults).toBe(true);
  });

  it("is no when the account has only other pothis", () => {
    expect(mergeRemote(emptyPothis(), [remote({ id: "p1" })]).seededDefaults).toBe(false);
  });

  it("does not count a default kept under another source", () => {
    const web = remote({ id: MORNING_ID, source: "mypothi" });
    expect(mergeRemote(emptyPothis(), [web]).seededDefaults).toBe(false);
  });
});

describe("whose order stands after a pull", () => {
  const remote = (id, updatedAt) => ({
    id,
    name: id,
    source: SOURCE,
    items: [],
    createdAt: 1,
    updatedAt,
    isPublic: false,
    pinned: false,
  });

  it("keeps a reorder made here that the server has not seen yet", () => {
    const s = setOrder(seed(["a", "b", "c"]), ["c", "a", "b"], 9999);
    const merged = mergeRemote(s, [remote("a", 1000), remote("b", 1001), remote("c", 1002)]);
    expect(ids(merged)).toEqual(["c", "a", "b"]);
  });

  it("takes the other phone's newer order", () => {
    const s = seed(["a", "b", "c"]);
    const merged = mergeRemote(s, [remote("c", 5000), remote("a", 5000), remote("b", 1001)]);
    expect(ids(merged)).toEqual(["c", "a", "b"]);
  });

  it("slots a pothi only the server knows without disturbing a newer local order", () => {
    const s = setOrder(seed(["a", "b"]), ["a", "b"], 9999);
    const merged = mergeRemote(s, [remote("b", 1001), remote("a", 1000), remote("new", 1002)]);
    expect(ids(merged).slice(0, 2)).toEqual(["a", "b"]);
    expect(ids(merged)).toContain("new");
  });
});
