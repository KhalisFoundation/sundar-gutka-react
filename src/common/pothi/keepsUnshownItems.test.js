import { nitnemSelection } from "../nitnem/selection";
import { baniItems, MORNING_NITNEM_IDS, reconcile, removeBani, toUpsertBody } from "./model";
import { userPothis } from "./selectors";

// A pothi on the account can hold items this app does not show — a shabad added
// from the web. The app used to strip them on every pull and upload the
// stripped copy, deleting them from the account. They are now kept exactly as
// they arrived and sent back unchanged; only showing, counting and editing
// banis ignores them.

const bani = (baaniId) => ({ id: `b${baaniId}`, type: "bani", baaniId, title: `B${baaniId}` });
const shabad = { id: "s1", type: "shabad", shabadId: 123, verseId: 456, title: "A shabad" };

const folder = (over) => ({
  id: "p1",
  name: "Mine",
  source: "mypothi",
  items: [],
  createdAt: 1,
  updatedAt: 2,
  ...over,
});

describe("items this app does not show", () => {
  it("survives a pull untouched and in its place", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), shabad, bani(4)] })] });
    expect(state.folders[0].items).toEqual([bani(2), shabad, bani(4)]);
  });

  it("is sent back to the account on the next sync", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), shabad] })] });
    expect(toUpsertBody(state).folders[0].items).toContainEqual(shabad);
  });

  it("is still dropped when it is malformed", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), { type: "shabad" }, null] })] });
    expect(state.folders[0].items).toEqual([bani(2)]);
  });

  it("still de-duplicates banis without touching anything else", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), shabad, bani(2)] })] });
    expect(state.folders[0].items).toEqual([bani(2), shabad]);
  });

  // An undefined id used to match every non-bani and remove them all.
  it("is not removed by a remove with no bani id", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), shabad] })] });
    expect(removeBani(state, "p1", undefined)).toBe(state);
  });

  it("stays when a real bani is removed beside it", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), shabad] })] });
    expect(removeBani(state, "p1", 2, 9).folders[0].items).toEqual([shabad]);
  });

  it("is not counted, read or played", () => {
    const state = reconcile({ folders: [folder({ items: [bani(2), shabad, bani(4)] })] });
    expect(baniItems(state.folders[0])).toEqual([bani(2), bani(4)]);
    const [row] = userPothis(state);
    expect(row.count).toBe(2);
    expect(row.baniIds).toEqual([2, 4]);
    expect(nitnemSelection(state.folders[0]).ids).toEqual([2, 4]);
  });

  // Two pothis with the same banis but a different shabad are two pothis.
  it("keeps apart pothis that differ only in what this app does not show", () => {
    const state = reconcile({
      folders: [
        folder({ id: "a", items: [bani(2), shabad] }),
        folder({ id: "b", items: [bani(2)] }),
      ],
    });
    expect(state.folders.map((f) => f.id)).toEqual(["a", "b"]);
  });
});

describe("Morning Nitnem with a shabad on it", () => {
  const morningItems = MORNING_NITNEM_IDS.map(bani);

  // Today's Nitnem finds the account's Morning pothi by its banis. A shabad
  // added beside them must not stop it being found.
  it("is still found as Morning Nitnem", () => {
    const state = reconcile({
      folders: [
        folder({ id: "account-morning", name: "Morning Nitnem", items: [...morningItems, shabad] }),
      ],
    });
    expect(state.defaultIds.morning).toBe("account-morning");
  });
});
