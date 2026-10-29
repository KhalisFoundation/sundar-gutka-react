import { isBaniItem, listPothis, SOURCE } from "./model";

// What the Folders tab renders, assembled from the two sources it merges.
//
// Sundar Gutka's own folders are not stored as pothis and must not be: they
// come from `defaultBaniOrder`, ship with the app, and cannot be renamed,
// reordered, pinned, shared or deleted. Copying them into the user's slice on
// first launch would make all of those look possible, would fork the moment the
// bundled list changed in an update, and would waste the server's 50-folder
// budget on content every client already has. They are merged at read time.

/**
 * The label on the bundled folders. Deliberately NOT an API source: user
 * pothis are stored under `sundar-gutka` (see model's SOURCE), and a bundled
 * folder sharing that label would make every user pothi read as bundled.
 */
export const BUNDLED_SOURCE = "sundar-gutka-folders";

/** The shape every row in the Folders tab shares, whoever it came from. */
const toRow = ({ id, name, titleUni, items, source, pinned, origin }) => ({
  id,
  name,
  // Gurmukhi Unicode name, where the source has one. Bundled folders carry both
  // an ASCII (GurbaniAkhar) and a Unicode name; a user pothi is typed and has
  // only the one.
  titleUni: titleUni ?? null,
  items,
  // Banis only: an item this app cannot show is kept on the pothi but is not
  // counted or read. See isBaniItem.
  count: items.filter(isBaniItem).length,
  /** Bani ids in order — what the continuous reader and the resolver need. */
  baniIds: items.filter(isBaniItem).map((item) => item.baaniId),
  source,
  system: source === BUNDLED_SOURCE,
  pinned: Boolean(pinned),
  origin,
});

/**
 * Sundar Gutka's bundled folders, from the same list the All Banis tab renders.
 *
 * @param {Array} baniListData rows from `useBaniList()`; a folder row carries a
 *   `folder: [{ id }]` array and a leaf row does not.
 */
export const systemPothis = (baniListData = []) =>
  baniListData
    .filter((bani) => Array.isArray(bani.folder) && bani.folder.length > 0)
    .map((bani) =>
      toRow({
        // Namespaced so a bundled folder can never collide with a user pothi id,
        // and so `system` is recoverable from the id alone in a log.
        id: `sg_${bani.id ?? bani.gurmukhi}`,
        name: bani.gurmukhi,
        // May be absent — the Banis table does not always carry a Unicode
        // name. The ROW converts in that case, the way the bani list does.
        titleUni: bani.gurmukhiUni,
        items: bani.folder.map((entry) => ({
          id: `sg_${bani.id}_${entry.id}`,
          type: "bani",
          baaniId: entry.id,
          title: String(entry.id),
        })),
        source: BUNDLED_SOURCE,
        origin: bani,
      })
    );

/** The user's own pothis, pinned first, in the order the list should render. */
export const userPothis = (pothis) =>
  listPothis(pothis)
    .filter((folder) => folder.source === SOURCE)
    .map((folder) => toRow({ ...folder, origin: folder }));

/**
 * The whole Folders tab, in render order.
 *
 * User pothis come first: they are the ones the user made and the only ones
 * they can act on. The bundled folders sit underneath as a permanent library.
 */
export const folderTabRows = (pothis, baniListData) => [
  ...userPothis(pothis),
  ...systemPothis(baniListData),
];

/**
 * Resolves a pothi's bani ids to full bani rows, dropping any the DB no longer
 * has.
 *
 * A pothi item already carries its own `title`, so a row that cannot be
 * resolved is not fatal — but the reader needs the real record, so an
 * unresolvable id is skipped rather than rendered as a hole.
 */
export const resolveBanis = (baniIds, baniListData = []) => {
  const byId = new Map();
  baniListData.forEach((bani) => {
    if (bani.id != null) byId.set(bani.id, bani);
    // Folder children are not top-level rows, so index them too — a pothi can
    // hold a bani that only ever appears inside a bundled folder.
    if (Array.isArray(bani.folder)) {
      bani.folder.forEach((child) => {
        if (child.id != null && !byId.has(child.id)) byId.set(child.id, child);
      });
    }
  });
  return baniIds.map((id) => byId.get(id)).filter(Boolean);
};
