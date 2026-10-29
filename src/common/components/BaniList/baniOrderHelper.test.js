/* eslint-env jest */
import defaultBaniOrder from "../../defaultBaniOrder";
import orderedBani from "./baniOrderHelper";

// The order is the user's; the rows come from the database. This resolves one
// against the other, and it runs on every list build — a fresh install, a
// language change, a reordering.

const row = (id, extra = {}) => ({
  id,
  gurmukhi: `g${id}`,
  gurmukhiUni: `u${id}`,
  translit: `t${id}`,
  ...extra,
});

describe("orderedBani", () => {
  it("returns the banis in the order given, not the order they arrive in", () => {
    const list = [row(1), row(2), row(3)];
    const order = { baniOrder: [{ id: 3 }, { id: 1 }] };
    expect(orderedBani(list, order, "en").map((b) => b.id)).toEqual([3, 1]);
  });

  it("keeps only the four fields the list renders", () => {
    const list = [row(1, { extraColumn: "unused" })];
    const [bani] = orderedBani(list, { baniOrder: [{ id: 1 }] }, "en");
    expect(Object.keys(bani).sort()).toEqual(["gurmukhi", "gurmukhiUni", "id", "translit"]);
  });

  it("drops an ordered id the database did not return", () => {
    const list = [row(1)];
    const order = { baniOrder: [{ id: 1 }, { id: 99 }] };
    expect(orderedBani(list, order, "en").map((b) => b.id)).toEqual([1]);
  });

  it("resolves a duplicated id to the first row, as a linear scan did", () => {
    // The lookup is an index now rather than a `find` per entry. `find` returns
    // the first match, so the index has to keep the first insertion too.
    const list = [row(1, { translit: "first" }), row(1, { translit: "second" })];
    const [bani] = orderedBani(list, { baniOrder: [{ id: 1 }] }, "en");
    expect(bani.translit).toBe("first");
  });

  it("resolves the banis inside a folder", () => {
    const list = [row(1), row(2)];
    const order = {
      baniOrder: [{ gurmukhi: "F", gurmukhiUni: "F", translit: "Folder", folder: [{ id: 2 }] }],
    };
    const [folder] = orderedBani(list, order, "en");
    expect(folder.folder.map((b) => b.id)).toEqual([2]);
  });

  it("drops a folder whose banis are all missing", () => {
    const order = {
      baniOrder: [{ gurmukhi: "F", gurmukhiUni: "F", translit: "Folder", folder: [{ id: 99 }] }],
    };
    expect(orderedBani([row(1)], order, "en")).toEqual([]);
  });

  it("falls back to the default order when the saved one is unusable", () => {
    // validateBaniOrder swaps in the bundled order, so an empty list here means
    // the rows did not match — not that the order was dropped on the floor.
    const list = defaultBaniOrder.baniOrder.filter((e) => e.id).map((e) => row(e.id));
    expect(orderedBani(list, undefined, "en").length).toBeGreaterThan(0);
  });
});
