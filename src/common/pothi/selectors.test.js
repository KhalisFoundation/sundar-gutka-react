import {
  addBani,
  addPothi,
  createPothi,
  emptyPothis,
  makeBaniItem,
  SOURCE,
  togglePin,
} from "./model";
import { BUNDLED_SOURCE, folderTabRows, resolveBanis, systemPothis, userPothis } from "./selectors";

// The Folders tab merges two sources that must stay distinguishable: the user's
// own pothis, which they can rename/reorder/pin/delete, and Sundar Gutka's
// bundled folders, which they cannot.

const baniList = [
  { id: 1, gurmukhi: "jpujI swihb", gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ" },
  { id: 2, gurmukhi: "jwpu swihb", gurmukhiUni: "ਜਾਪੁ ਸਾਹਿਬ" },
  {
    id: 90,
    gurmukhi: "AMimRq bwxI",
    gurmukhiUni: "ਅੰਮ੍ਰਿਤ ਬਾਣੀ",
    folder: [{ id: 39 }, { id: 40 }],
  },
];

describe("systemPothis", () => {
  it("picks out only the rows that are folders", () => {
    const rows = systemPothis(baniList);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("AMimRq bwxI");
    expect(rows[0].baniIds).toEqual([39, 40]);
    expect(rows[0].count).toBe(2);
  });

  it("marks them system, so a row can withhold rename/pin/delete", () => {
    expect(systemPothis(baniList)[0].system).toBe(true);
  });

  // User pothis are stored under `sundar-gutka`, the API source sttm-next's
  // Sundar Gutka screen reads. Sharing that label, every user pothi read as
  // bundled and lost its pin, rename and delete.
  it("labels them apart from the source user pothis are stored under", () => {
    expect(systemPothis(baniList)[0].source).toBe(BUNDLED_SOURCE);
    expect(BUNDLED_SOURCE).not.toBe(SOURCE);
  });

  it("namespaces the id so it cannot collide with a user pothi", () => {
    expect(systemPothis(baniList)[0].id).toMatch(/^sg_/);
  });

  it("keeps the Unicode title — the ASCII one renders as mojibake under Baloo", () => {
    expect(systemPothis(baniList)[0].titleUni).toBe("ਅੰਮ੍ਰਿਤ ਬਾਣੀ");
  });

  it("survives an empty or absent list", () => {
    expect(systemPothis([])).toEqual([]);
    expect(systemPothis()).toEqual([]);
  });
});

describe("userPothis", () => {
  it("counts the banis and reports the pin", () => {
    let s = addPothi(emptyPothis(), createPothi({ id: "p1", name: "Mine" }));
    s = addBani(s, "p1", makeBaniItem({ baaniId: 1, title: "Japji" }));
    s = togglePin(s, "p1");
    const [row] = userPothis(s);
    expect([row.count, row.pinned, row.system]).toEqual([1, true, false]);
  });

  it("is empty when the user has none", () => {
    expect(userPothis(emptyPothis())).toEqual([]);
  });
});

describe("folderTabRows", () => {
  it("puts the user's own pothis above the bundled ones", () => {
    const s = addPothi(emptyPothis(), createPothi({ id: "p1", name: "Mine" }));
    const rows = folderTabRows(s, baniList);
    expect(rows.map((r) => r.system)).toEqual([false, true]);
  });

  it("shows the bundled folders even with no user pothis — the tab is never blank", () => {
    expect(folderTabRows(emptyPothis(), baniList)).toHaveLength(1);
  });
});

describe("resolveBanis", () => {
  it("maps ids to rows, in the pothi's own order", () => {
    expect(resolveBanis([2, 1], baniList).map((b) => b.id)).toEqual([2, 1]);
  });

  it("finds a bani that only exists inside a bundled folder", () => {
    // A user can add a shabad from within Amrit Baani; it is not a top-level row.
    expect(resolveBanis([39], baniList).map((b) => b.id)).toEqual([39]);
  });

  it("drops an id the database no longer has rather than rendering a hole", () => {
    expect(resolveBanis([1, 9999], baniList).map((b) => b.id)).toEqual([1]);
  });

  it("survives an empty list", () => {
    expect(resolveBanis([1], [])).toEqual([]);
    expect(resolveBanis([], baniList)).toEqual([]);
  });
});
