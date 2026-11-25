/* eslint-env jest */
import audioFirstOrder from "./audioFirstOrder";
import constant from "./constant";
import defaultBaniOrder from "./defaultBaniOrder";

describe("audioFirstOrder", () => {
  it("puts audio banis first, then the rest, then folders, keeping order within each group", () => {
    const folder = { gurmukhi: "F", folder: [{ id: 1 }] };
    const entries = [{ id: 5 }, folder, { id: 9 }, { id: 3 }, { id: 7 }];
    expect(audioFirstOrder(entries, [7, 9])).toEqual([
      { id: 9 },
      { id: 7 },
      { id: 5 },
      { id: 3 },
      folder,
    ]);
  });
});

describe("defaultBaniOrder", () => {
  it("lists banis with audio first and folders last", () => {
    const audio = new Set(constant.AUDIO_BANI_IDS);
    // 0 = audio bani, 1 = other bani, 2 = folder. Must never go back down.
    const groups = defaultBaniOrder.baniOrder.map((e) => {
      if (e.id === undefined) return 2;
      return audio.has(e.id) ? 0 : 1;
    });
    expect(groups).toEqual([...groups].sort());
  });
});
