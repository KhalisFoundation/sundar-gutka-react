// The My Pothi data model, as pure functions.
//
// A pothi is a user-made folder of banis. The reducer delegates every
// transition here so the rules — the pin ceiling, de-duplication, the server's
// limits — can be tested without a store, and so no component knows them.
//
// ── Shape ─────────────────────────────────────────────────────────────────
// State is the WIRE shape, deliberately:
//
//   { folders: FolderDto[], seededDefaults: boolean, lastSyncedAt: string|null }
//
// `folders` is exactly what `PUT /folders` accepts and `GET /folders` returns,
// so syncing is a straight serialise with no translation layer to drift. The
// two siblings are local-only and never sent.
//
// A FolderDto (khalis-users-api, src/folders/dto/folder.dto.ts):
//   { id, name, source, items[], createdAt, updatedAt, isPublic?, pinned? }
//
// Order is the ARRAY order — the server preserves it — so there is no separate
// order list that could disagree with the folders it indexes. Pinning is a
// per-folder boolean for the same reason: it is the server's field, and a
// parallel array of pinned ids would be a second source of truth.

/** Limits mirrored from the API's DTOs. Exceeding any of them is a 400. */
export const MAX_NAME_LENGTH = 50;
export const MAX_ITEM_TITLE_LENGTH = 200;
export const MAX_ITEMS_PER_FOLDER = 500;
export const MAX_FOLDERS = 50;
export const MAX_ID_LENGTH = 64;

// ── The two default pothis ────────────────────────────────────────────────
//
// Bani ids are taken from the bundled database's `Banis` table. The ids of the
// two pothis are fixed, so every device seeds the same pair and the account
// holds it once — see isPristineSeed for how two copies of it meet.
//
//    2  jpujI swihb            Japji Sahib
//    4  jwpu swihb             Jaap Sahib
//    6  qÍ pRswid sv`Xy        Tav Prasad Savaiye (Sraavag Sudh)
//    9  bynqI cOpeI swihb      Benati Chaupai Sahib
//   10  Anµdu swihb            Anand Sahib
//   21  rhrwis swihb           Rehras Sahib
//   23  soihlw swihb           Sohila Sahib (Kirtan Sohila — one bani, two names)
//
// Savaiye is 6, not 3 or 5 — Shabad Hazare (3) and Shabad Hazare Patishahi 10
// (5) are two other banis whose similar names make the wrong one easy to grab.
export const MORNING_ID = "default_morning_nitnem";
export const EVENING_ID = "default_evening_nitnem";

export const MORNING_NITNEM_IDS = [2, 4, 6, 9, 10];
export const EVENING_NITNEM_IDS = [21, 23];

/** The two default pothis, by the role each plays. */
export const DEFAULT_KINDS = ["morning", "evening"];

/**
 * Whether an item is a bani — the only kind this app shows.
 *
 * A pothi on the account can hold other kinds too: a shabad added from the
 * web is `{ type: "shabad", shabadId, verseId }`. Those are the account's,
 * not this app's to judge, so they are never removed or rewritten here —
 * only skipped wherever the app reads, counts or edits banis, and sent back
 * unchanged on every sync. Stripping them used to delete them from the
 * account the next time any pothi was saved.
 */
export const isBaniItem = (item) =>
  Boolean(item) && Number.isInteger(item.baaniId) && item.baaniId > 0;

/** A pothi's bani items, in order — what every screen shows and counts. */
export const baniItems = (folder) => (folder?.items ?? []).filter(isBaniItem);

/** An item this app does not show, kept exactly as it arrived. */
const isKeptItem = (item) =>
  Boolean(item) && typeof item === "object" && typeof item.id === "string" && item.id.length > 0;

/** A folder's banis as one comparable string. */
const baniSignature = (folder) =>
  baniItems(folder)
    .map((item) => item.baaniId)
    .join(",");

/**
 * A folder's CONTENT as one comparable string — what makes two folders the
 * same pothi made twice rather than two pothis. The id is deliberately not in
 * it: the whole point is to match copies that were minted separately.
 */
//
// Every item counts, not just the banis: two folders with the same banis but
// different shabads are different pothis, and treating them as copies would
// drop one of them. An item's own id is left out, for the same reason as
// above — copies minted separately carry different ids.
const itemKey = (item) =>
  isBaniItem(item) ? `b:${item.baaniId}` : JSON.stringify({ ...item, id: undefined });
const folderSignature = (folder) =>
  `${folder.source}|${folder.name}|${(folder.items ?? []).map(itemKey).join(",")}`;

const DEFAULT_SIGNATURES = {
  morning: MORNING_NITNEM_IDS.join(","),
  evening: EVENING_NITNEM_IDS.join(","),
};

/**
 * Which folder is the Morning (or Evening) Nitnem pothi.
 *
 * A pointer rather than a name check, because the name is not stable: the seed
 * uses the language of the device that made it. The pointer is re-resolved
 * rather than assumed:
 *
 *   1. The recorded id, if that folder is still there. Survives rename and
 *      any edit to the contents, which is the whole point.
 *   2. Our own well-known id. Every device seeds the pair under it and uploads
 *      it, so when the account holds a folder under it, that id IS the role and
 *      no guessing is needed — it survives a rename and an edit together.
 *   3. The folder holding exactly the default banis in the default order, which
 *      recovers the pair for a device that has no pointer and no well-known id.
 *
 * Null when the pothi genuinely is not there — deleted from another client.
 *
 * WHY THE POINTER IS NOT ENOUGH ON ITS OWN. It is local — never sent up, and
 * reset with the slice on an account change — so a SECOND device signing in has
 * none, and must re-derive the pair from the folders alone. That is why
 * renaming a default is not offered (see PothiActionsSheet), and why deleting
 * one never was.
 */
const LOCAL_DEFAULT_ID = { morning: MORNING_ID, evening: EVENING_ID };

/**
 * A seeded default exactly as a device seeded it: our fixed id, the stock
 * banis, and never touched since — an edit or a rename moves `updatedAt`.
 *
 * Every device seeds the pair under the same ids, so two copies of one default
 * meet in `mergeRemote`, and a stock copy holds no work: it must never beat a
 * copy someone edited, however its clock compares.
 */
const isPristineSeed = (folder) =>
  DEFAULT_KINDS.some(
    (kind) =>
      folder?.id === LOCAL_DEFAULT_ID[kind] &&
      baniSignature(folder) === DEFAULT_SIGNATURES[kind] &&
      folder.updatedAt === folder.createdAt
  );

const resolveDefaultId = (kind, folders, recorded) => {
  if (recorded && folders.some((folder) => folder.id === recorded)) return recorded;
  const byWellKnownId = folders.find((folder) => folder.id === LOCAL_DEFAULT_ID[kind]);
  if (byWellKnownId) return byWellKnownId.id;
  const bySignature = folders.find((folder) => baniSignature(folder) === DEFAULT_SIGNATURES[kind]);
  return bySignature ? bySignature.id : null;
};

/** The id of a default pothi, or null. `kind` is "morning" or "evening". */
export const defaultPothiId = (state, kind) => state?.defaultIds?.[kind] ?? null;

/** The default pothi itself, or null. */
export const defaultPothi = (state, kind) => {
  const id = defaultPothiId(state, kind);
  return id ? (state?.folders ?? []).find((folder) => folder.id === id) ?? null : null;
};

/** Whether a pothi is one of the two defaults, which cannot be deleted. */
export const isDefaultPothi = (state, id) =>
  Boolean(id) && DEFAULT_KINDS.some((kind) => defaultPothiId(state, kind) === id);

/** Client-side only: the product cap on pinned pothis. The API does not police it. */
export const MAX_PINNED = 3;

/**
 * The one source this app reads and writes — the one sttm-next's Sundar Gutka
 * screen uses, so a pothi made on either shows on both. Folders of any other
 * source on the account (sttm-next's MyPothi, which can hold shabads) are not
 * this app's: they are never pulled, shown or sent.
 */
export const SOURCE = "sundar-gutka";

export const emptyPothis = () => ({
  folders: [],
  seededDefaults: false,
  lastSyncedAt: null,
  // Ids deleted on THIS device that the server may not know about yet.
  //
  // Without them a delete could not stick: the folder went from local state,
  // the next pull found it still on the server, `mergeRemote` saw an id local
  // did not have and adopted it as new — so every deleted pothi came back on
  // the next launch. A tombstone says "this absence is deliberate".
  deletedIds: [],
  // Which folder is Morning Nitnem and which is Evening — see resolveDefaultId.
  // Local only: the API has no such field, and `toUpsertBody` never sends it.
  defaultIds: { morning: null, evening: null },
});

// Short, unique per device, and well inside the API's 64-char ceiling. Ids are
// client-generated by contract, so a UUID's collision guarantees would be
// overkill and would cost a dependency the app does not otherwise need.
const rand = () => Math.random().toString(36).slice(2, 8);
export const makeId = () => `p_${Date.now().toString(36)}_${rand()}`;
export const makeItemId = () => `i_${Date.now().toString(36)}_${rand()}`;

const clamp = (value, max) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

/** A name with surrounding whitespace gone, capped at the server's limit. */
export const normaliseName = (name) => clamp(name, MAX_NAME_LENGTH);

/** Whether a name can be saved. Gurmukhi, Latin and digits are all fine; empty is not. */
export const isValidName = (name) => normaliseName(name).length > 0;

/**
 * A bani item in the wire shape.
 *
 * `title` is required by the API and rendered verbatim, so it is stored at add
 * time rather than resolved later — a pothi must still list its contents when
 * the bani database is mid-update or the row has gone.
 */
export const makeBaniItem = ({ baaniId, title, preview }) => ({
  id: makeItemId(),
  type: "bani",
  baaniId,
  title: clamp(title || String(baaniId), MAX_ITEM_TITLE_LENGTH),
  ...(preview ? { preview: clamp(preview, MAX_ITEM_TITLE_LENGTH) } : {}),
});

export const createPothi = ({ id = makeId(), name, items = [], now = Date.now() } = {}) => ({
  id: clamp(id, MAX_ID_LENGTH),
  name: normaliseName(name),
  source: SOURCE,
  items: items.slice(0, MAX_ITEMS_PER_FOLDER),
  createdAt: now,
  updatedAt: now,
  // Part of the DTO and always false from this app — nothing here shares a
  // pothi yet. It is still round-tripped (see reconcile) so a pothi shared from
  // another Khalis client is not silently un-shared by this one syncing.
  isPublic: false,
  pinned: false,
});

const indexOf = (state, id) => state.folders.findIndex((folder) => folder.id === id);

/** Replaces one folder, stamping updatedAt. Returns the SAME state if it is absent. */
const patch = (state, id, change, now = Date.now()) => {
  const at = indexOf(state, id);
  if (at < 0) return state;
  const folders = [...state.folders];
  folders[at] = { ...folders[at], ...change, updatedAt: now };
  return { ...state, folders };
};

export const addPothi = (state, pothi) => {
  // The server rejects the whole PUT past 50, so the cap is enforced before the
  // pothi is ever created rather than surfacing as a failed sync later.
  if (state.folders.length >= MAX_FOLDERS) return state;
  // Newest first: a pothi just made is the one about to be used.
  return { ...state, folders: [pothi, ...state.folders.filter((f) => f.id !== pothi.id)] };
};

/**
 * Renames a pothi. Morning and Evening Nitnem are refused: a device with no
 * recorded pointer finds them by their banis or, once those are edited, by the
 * account's English name — so a renamed, edited default is lost to that device
 * and Today's Nitnem falls back to the stock list. See resolveDefaultId.
 */
export const renamePothi = (state, id, name, now = Date.now()) =>
  isValidName(name) && !isDefaultPothi(state, id)
    ? patch(state, id, { name: normaliseName(name) }, now)
    : state;

export const deletePothi = (state, id) => {
  if (indexOf(state, id) < 0) return state;
  const defaultIds = { ...state.defaultIds };
  // A dangling pointer would be re-resolved by signature on the next
  // reconcile, which could adopt an unrelated folder. Clear it here instead.
  // The UI refuses to delete a default (see isDefaultPothi); this covers a
  // deletion that arrived from another client.
  DEFAULT_KINDS.forEach((kind) => {
    if (defaultIds[kind] === id) defaultIds[kind] = null;
  });
  return {
    ...state,
    folders: state.folders.filter((folder) => folder.id !== id),
    deletedIds: [...new Set([...(state.deletedIds ?? []), id])],
    defaultIds,
  };
};

/**
 * Adds a bani. Returns the SAME state when the bani is already in the folder,
 * so the caller can tell "added" from "was already there" by identity and show
 * the right message rather than a success toast for a no-op.
 */
export const addBani = (state, id, item, now = Date.now()) => {
  const folder = state.folders[indexOf(state, id)];
  if (!folder) return state;
  if (folder.items.some((existing) => existing.baaniId === item.baaniId)) return state;
  if (folder.items.length >= MAX_ITEMS_PER_FOLDER) return state;
  return patch(state, id, { items: [...folder.items, item] }, now);
};

export const removeBani = (state, id, baaniId, now = Date.now()) => {
  // Without this, an undefined id matched every item that is not a bani —
  // `item.baaniId !== undefined` is false for a shabad — and removed them all.
  if (!isBaniItem({ baaniId })) return state;
  const folder = state.folders[indexOf(state, id)];
  if (!folder || !folder.items.some((item) => item.baaniId === baaniId)) return state;
  return patch(state, id, { items: folder.items.filter((i) => i.baaniId !== baaniId) }, now);
};

/**
 * Reorder. Ids the caller invented, or folders that vanished, are dropped.
 *
 * Every pothi whose place changed is stamped: its position travels with it
 * (the server takes positions from the order of the PUT, and only for rows
 * newer than its own), so an unstamped reorder was refused up there and
 * undone by the next pull.
 */
export const setOrder = (state, nextOrder, now = Date.now()) => {
  const byId = new Map(state.folders.map((folder) => [folder.id, folder]));
  const moved = nextOrder.map((id) => byId.get(id)).filter(Boolean);
  const movedIds = new Set(moved.map((folder) => folder.id));
  // Anything the caller left out stays, in its existing order, so a partial
  // list (one lane of a two-lane screen) can never delete a pothi.
  const rest = state.folders.filter((folder) => !movedIds.has(folder.id));
  const folders = [...moved, ...rest].map((folder, index) =>
    state.folders[index] === folder ? folder : { ...folder, updatedAt: now }
  );
  return { ...state, folders };
};

// A default can carry a stale `pinned` from an earlier build or another
// client; it never counts toward the ceiling, since it is never shown pinned.
export const countPinned = (state) =>
  state.folders.filter((folder) => folder.pinned && !isDefaultPothi(state, folder.id)).length;

/**
 * Pin or unpin. Pinning past MAX_PINNED is refused — the state comes back
 * unchanged, which the caller reads as "tell the user the limit". The two
 * defaults are refused outright: they already have a fixed place at the top.
 */
export const togglePin = (state, id, now = Date.now()) => {
  const folder = state.folders[indexOf(state, id)];
  if (!folder || isDefaultPothi(state, id)) return state;
  if (!folder.pinned && countPinned(state) >= MAX_PINNED) return state;
  return patch(state, id, { pinned: !folder.pinned }, now);
};

/**
 * Render order: the two defaults (Morning, then Evening) in their fixed place,
 * then pinned, then the rest, each of the last two lanes keeping its array order.
 *
 * Derived rather than stored, so the lanes can never disagree about where a
 * pothi is — the bug a separate `pinnedOrder` invites.
 */
export const listPothis = (state) => {
  const folders = state?.folders ?? [];
  const defaults = DEFAULT_KINDS.map((kind) => defaultPothi(state, kind)).filter(Boolean);
  const rest = folders.filter((f) => !defaults.includes(f));
  return [...defaults, ...rest.filter((f) => f.pinned), ...rest.filter((f) => !f.pinned)];
};

/** The ids of the pothis a bani already belongs to — drives the add modal's ticks. */
export const pothisContaining = (state, baaniId) =>
  listPothis(state)
    .filter((folder) => folder.items.some((item) => item.baaniId === baaniId))
    .map((folder) => folder.id);

/**
 * Collapses folders that are EXACT copies — same name and the same banis in
 * the same order — keeping the first.
 *
 * This is a self-heal, not a nicety. An earlier build minted a fresh random id
 * for the default pothis on every seed, so a device that seeded twice holds two
 * "Morning Nitnem" folders with different ids: de-duplicating by id cannot see
 * them, and they would sync to the server and come back. Matching on content is
 * what actually finds them.
 *
 * Narrow on purpose. Two pothis that merely share a name are left alone — the
 * moment a user renames or edits one of a pair they are no longer copies, and
 * removing a folder someone deliberately made would be far worse than showing
 * a duplicate.
 */
const dropExactDuplicates = (folders) => {
  const seen = new Set();
  return folders.filter((folder) => {
    const signature = folderSignature(folder);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
};

/**
 * Drops anything a rehydrated or server payload should not carry: malformed
 * folders, items without a bani, pins past the ceiling, over-long names.
 *
 * Persisted state outlives the code that wrote it and a server response is
 * remote input, so both are treated as untrusted and pass through here.
 */
export const reconcile = (persisted) => {
  const base = emptyPothis();
  if (!persisted) return base;
  const raw = Array.isArray(persisted.folders) ? persisted.folders : [];
  const folders = raw
    .filter((folder) => folder && typeof folder.id === "string" && folder.id.length > 0)
    .slice(0, MAX_FOLDERS)
    .map((folder) => {
      const all = Array.isArray(folder.items) ? folder.items : [];
      const items = all
        // A bani is de-duplicated, keeping the first — a double-write must not
        // render the same shabad twice in the continuous reader. Anything else is
        // kept exactly as it arrived; see isBaniItem.
        .filter((item, at) =>
          isBaniItem(item)
            ? all.findIndex((other) => isBaniItem(other) && other.baaniId === item.baaniId) === at
            : isKeptItem(item)
        )
        .slice(0, MAX_ITEMS_PER_FOLDER)
        .map((item) =>
          isBaniItem(item)
            ? {
                id: typeof item.id === "string" && item.id ? item.id : makeItemId(),
                type: "bani",
                baaniId: item.baaniId,
                title: clamp(item.title || String(item.baaniId), MAX_ITEM_TITLE_LENGTH),
                ...(item.preview ? { preview: clamp(item.preview, MAX_ITEM_TITLE_LENGTH) } : {}),
              }
            : item
        );
      return {
        id: clamp(folder.id, MAX_ID_LENGTH),
        name: normaliseName(folder.name) || folder.id,
        // Server folders are filtered to SOURCE before they get here (see
        // mergeRemote), so this only relabels a folder an earlier build stored
        // under a different name.
        source: SOURCE,
        items,
        createdAt: Number.isFinite(folder.createdAt) ? folder.createdAt : Date.now(),
        updatedAt: Number.isFinite(folder.updatedAt) ? folder.updatedAt : Date.now(),
        isPublic: Boolean(folder.isPublic),
        pinned: Boolean(folder.pinned),
      };
    });
  const deduped = dropExactDuplicates(folders);
  // Every entry point — rehydrate, seed, merge — passes through here, so this
  // is the one place the two default pointers are re-established. A pointer at
  // a folder that is still present is left exactly as it is.
  const recorded = persisted.defaultIds ?? {};
  const defaultIds = {
    morning: resolveDefaultId("morning", deduped, recorded.morning),
    evening: resolveDefaultId("evening", deduped, recorded.evening),
  };
  // Pins are capped only once the defaults are known: a default is never
  // pinned (it has a fixed place instead), so it must not take a slot either.
  let pinned = 0;
  const kept = deduped.map((folder) => {
    const isDefault = folder.id === defaultIds.morning || folder.id === defaultIds.evening;
    const keepPin = folder.pinned && !isDefault && pinned < MAX_PINNED;
    if (keepPin) pinned += 1;
    return folder.pinned === keepPin ? folder : { ...folder, pinned: keepPin };
  });
  return {
    folders: kept,
    seededDefaults: Boolean(persisted.seededDefaults),
    lastSyncedAt: typeof persisted.lastSyncedAt === "string" ? persisted.lastSyncedAt : null,
    deletedIds: Array.isArray(persisted.deletedIds)
      ? persisted.deletedIds.filter((id) => typeof id === "string")
      : [],
    defaultIds,
  };
};

/**
 * Adds the pair this app seeds while signed out and records which is which.
 *
 * Marked seeded even when the list is empty, so the check short-circuits and
 * the bani database is not re-scanned on every launch.
 */
export const seedDefaults = (state, pothis = []) => {
  // Back to front, because addPothi PREPENDS. That is right for a pothi the
  // user just made — it is the one they are about to use — and wrong for a
  // batch whose order is meaningful: seeding [Morning, Evening] forwards left
  // Evening on top, the reverse of how a nitnem is read. Reversing here keeps
  // the list in the order given while addPothi stays the only place that knows
  // about the cap and the de-duplication.
  const seeded = [...pothis].reverse().reduce((acc, pothi) => addPothi(acc, pothi), state);
  const pick = (kind, id) =>
    pothis.some((pothi) => pothi.id === id) ? id : seeded.defaultIds?.[kind] ?? null;
  return {
    ...seeded,
    seededDefaults: true,
    defaultIds: { morning: pick("morning", MORNING_ID), evening: pick("evening", EVENING_ID) },
  };
};

/** Retires ONE tombstone, after the server confirmed that specific delete. */
export const clearTombstone = (state, id) => ({
  ...state,
  deletedIds: (state.deletedIds ?? []).filter((buried) => buried !== id),
});

/**
 * The payload for `PUT /folders` — every pothi, the local-only fields stripped.
 *
 * The defaults go up too, untouched or not. The API seeds its own pair only
 * under the MyPothi source, which this app does not read, so the pair this app
 * seeds is the account's Sundar Gutka pair — and uploading it is what lets
 * sttm-next's Sundar Gutka screen find folders instead of seeding its own.
 */
export const toUpsertBody = (state) => ({
  source: SOURCE,
  folders: listPothis(state),
});

/**
 * Which of two copies of one folder stands after a pull: the newer, except
 * that a pristine default never beats an edited one (see isPristineSeed).
 *
 * The exception runs both ways. A stock pair seeded on this phone today is
 * newer than a nitnem another phone arranged last week, and must not replace
 * it. And an account's stock pair uploaded by another phone just now is newer
 * than the nitnem arranged here before signing in, and must not replace that
 * either — so the local edit wins, stamped `now`, because the API keeps
 * whichever copy is strictly newer and would refuse the older clock.
 */
const newerCopy = (mine, remote, now) => {
  if (!mine) return remote;
  const minePristine = isPristineSeed(mine);
  const remotePristine = isPristineSeed(remote);
  if (minePristine !== remotePristine) {
    if (minePristine) return remote;
    return mine.updatedAt > remote.updatedAt ? mine : { ...mine, updatedAt: now };
  }
  return mine.updatedAt > remote.updatedAt ? mine : remote;
};

/**
 * Merges the server's folders over local, per folder, by `updatedAt`.
 *
 * Last-write-wins at FOLDER granularity rather than whole-document: two devices
 * editing different pothis both keep their edit, which a document-level
 * comparison would not. A folder only local (never synced) is kept; a folder
 * only remote is adopted.
 */
export const mergeRemote = (state, allRemote = [], now = Date.now(), deletedFolderIds = []) => {
  // Only this app's source. The account also holds sttm-next's MyPothi folders,
  // which can carry shabads the API refuses under SOURCE; taking them in would
  // relabel them (see reconcile) and fail every later upload.
  const remoteFolders = allRemote.filter((folder) => folder?.source === SOURCE);

  const local = new Map(state.folders.map((folder) => [folder.id, folder]));
  // A folder the server reports as deleted since this device last read — by
  // another device — goes, whatever this device holds for it: a local edit
  // newer than that deletion would have gone up as a PUT and revived it on
  // the server, so absence there is the account's decision.
  deletedFolderIds.forEach((id) => local.delete(id));
  // A folder this device deleted is NOT a new one from the server.
  const buried = new Set(state.deletedIds ?? []);
  const remoteIds = new Set(remoteFolders.map((folder) => folder.id));
  const merged = [];
  remoteFolders.forEach((remote) => {
    if (buried.has(remote.id)) return;
    merged.push(newerCopy(local.get(remote.id), remote, now));
    local.delete(remote.id);
  });

  // Whose ORDER stands. Positions live on the folders, so the side that
  // touched its list last owns the order: a reorder here that has not reached
  // the server yet must survive the pull that follows it, and one made on
  // another phone must land here once it has. The shared folders take the
  // newer side's order; a folder only one side knows keeps its place.
  const mineById = new Map(state.folders.map((folder) => [folder.id, folder]));
  const newestLocal = Math.max(
    0,
    ...merged.filter((f) => mineById.has(f.id)).map((f) => mineById.get(f.id).updatedAt ?? 0)
  );
  const newestRemote = Math.max(
    0,
    ...remoteFolders.filter((r) => mineById.has(r.id)).map((r) => r.updatedAt ?? 0)
  );
  const localIndex = (id) => state.folders.findIndex((folder) => folder.id === id);
  const ordered =
    newestLocal > newestRemote
      ? [...merged].sort((a, b) => {
          const ia = localIndex(a.id);
          const ib = localIndex(b.id);
          return ia === -1 || ib === -1 ? 0 : ia - ib;
        })
      : merged;

  // A local-only folder that is an EXACT copy of one the account already holds
  // — same name, same banis, same order — is one pothi made twice: once here
  // while signed out, once on another client. The server's copy is the one
  // kept, because its id is the one every other device already knows; keeping
  // the local one would upload a second folder that nothing else could
  // recognise as the same pothi, and the account would show it twice.
  //
  // `reconcile` collapses exact copies too, but it keeps the FIRST it meets
  // and the local-only folders are prepended below — so without this the LOCAL
  // id won, which is the wrong half of the pair to keep.
  const remoteSignatures = new Set(ordered.map(folderSignature));
  [...local.values()].forEach((folder) => {
    if (remoteSignatures.has(folderSignature(folder))) local.delete(folder.id);
  });

  // A tombstone retires ONLY when a pull proves the server no longer has that
  // id — not when DELETE returns 204.
  //
  // The difference matters because `PUT /folders` on the backend is a whole-
  // source replace with no revision check (see folders.service replaceSource).
  // Another client holding an older list — the web app — can upload it after
  // our delete and put the folder back. Retiring on 204 left nothing to
  // suppress that, so the pothi reappeared on the next pull; keeping the
  // tombstone until the server actually agrees means it stays gone here and
  // gets deleted again.
  const stillThere = (state.deletedIds ?? []).filter((id) => remoteIds.has(id));

  // Whatever is left is local-only — created offline, or before signing in.
  return reconcile({
    ...state,
    folders: [...local.values(), ...ordered],
    deletedIds: stillThere,
    // An account that already has a default — live, or deleted from another
    // client — has had its pair. Seeding again would add a second one, or
    // bring back the one that was deleted.
    seededDefaults:
      Boolean(state.seededDefaults) ||
      DEFAULT_KINDS.some(
        (kind) =>
          remoteIds.has(LOCAL_DEFAULT_ID[kind]) || deletedFolderIds.includes(LOCAL_DEFAULT_ID[kind])
      ),
  });
};

