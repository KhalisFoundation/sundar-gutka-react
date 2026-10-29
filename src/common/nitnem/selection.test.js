/* eslint-env jest */
import { DEFAULT_NITNEM_BANI_IDS } from "./defaults";
import { nitnemSelection } from "./selection";

describe("nitnemSelection", () => {
  it("stands in the defaults when there is no morning pothi at all", () => {
    expect(nitnemSelection(null)).toEqual({ ids: DEFAULT_NITNEM_BANI_IDS, emptied: false });
    expect(nitnemSelection(undefined)).toEqual({ ids: DEFAULT_NITNEM_BANI_IDS, emptied: false });
  });

  it("shows exactly what the pothi holds when it holds something", () => {
    const morning = { items: [{ baaniId: 2 }, { baaniId: 4 }] };
    expect(nitnemSelection(morning)).toEqual({ ids: [2, 4], emptied: false });
  });

  it("reports an emptied pothi as emptied, and shows no defaults in its place", () => {
    // The bug: unselect all → save → five banis appear; pick one → it alone
    // shows. The five were never the pothi, they were this fallback.
    expect(nitnemSelection({ items: [] })).toEqual({ ids: [], emptied: true });
    expect(nitnemSelection({})).toEqual({ ids: [], emptied: true });
  });
});
