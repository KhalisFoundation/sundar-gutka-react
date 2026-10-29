/* eslint-env jest */
// Actions are built from `actionTypes` rather than imported from `./actions`:
// that barrel pulls in Firebase analytics, which Jest does not transform.
import * as actionTypes from "./actions/actionTypes";
import rootReducer from "./reducer";

const add = (entry) => ({ type: actionTypes.ADD_DOWNLOAD_ENTRY, payload: entry });
const update = (patches) => ({ type: actionTypes.UPDATE_DOWNLOAD_ENTRIES, payload: patches });

const registryAfter = (...actions) =>
  actions.reduce((state, action) => rootReducer(state, action), undefined).downloadRegistry;

describe("downloadRegistry UPDATE_DOWNLOAD_ENTRIES", () => {
  it("merges each patch into its entry and leaves the rest alone", () => {
    const registry = registryAfter(
      add({ relativePath: "A/one.m4a", artistDisplayName: "Old", sizeBytes: 10 }),
      add({ relativePath: "B/two.m4a", artistDisplayName: "B", sizeBytes: 20 }),
      update({ "A/one.m4a": { artistDisplayName: "New" } })
    );
    expect(registry["A/one.m4a"]).toEqual({
      relativePath: "A/one.m4a",
      artistDisplayName: "New",
      sizeBytes: 10,
    });
    expect(registry["B/two.m4a"].artistDisplayName).toBe("B");
  });

  it("never creates an entry for a path that is not downloaded", () => {
    const registry = registryAfter(update({ "C/ghost.m4a": { artistDisplayName: "X" } }));
    expect(registry).toEqual({});
  });
});
