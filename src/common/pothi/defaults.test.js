import { buildDefaultPothis } from "./defaults";
import { addPothi, emptyPothis, EVENING_NITNEM_IDS, MORNING_NITNEM_IDS, SOURCE } from "./model";

// `convertToUnicode` wraps anvaad-js, which reads the browser global `self` at
// import time. Every fixture below already supplies a Unicode name, so the
// conversion path is never taken here.
jest.mock("../utils", () => ({ __esModule: true, default: (v) => v }));

// The two pothis every user starts with. The ids are the ones that matter: a
// wrong one silently ships the wrong scripture in a default collection, and
// `seededDefaults` means it is never re-created.

const NAMES = { morning: "Morning Nitnem", evening: "Evening Nitnem" };

// The rows the Banis table actually holds for these ids.
const baniList = [
  { id: 2, gurmukhi: "jpujI swihb", gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ" },
  { id: 4, gurmukhi: "jwpu swihb", gurmukhiUni: "ਜਾਪੁ ਸਾਹਿਬ" },
  { id: 6, gurmukhi: "qÍ pRswid sv`Xy", gurmukhiUni: "ਤ੍ਵ ਪ੍ਰਸਾਦਿ ਸਵੱਯੇ" },
  { id: 9, gurmukhi: "bynqI cOpeI swihb", gurmukhiUni: "ਬੇਨਤੀ ਚੌਪਈ ਸਾਹਿਬ" },
  { id: 10, gurmukhi: "Anµdu swihb", gurmukhiUni: "ਅਨੰਦੁ ਸਾਹਿਬ" },
  { id: 21, gurmukhi: "rhrwis swihb", gurmukhiUni: "ਰਹਰਾਸਿ ਸਾਹਿਬ" },
  { id: 23, gurmukhi: "soihlw swihb", gurmukhiUni: "ਸੋਹਿਲਾ ਸਾਹਿਬ" },
  { id: 1, gurmukhi: "gur mMqR", gurmukhiUni: "ਗੁਰ ਮੰਤ੍ਰ" },
];

describe("the default bani ids", () => {
  it("Morning is Japji, Jaap, Tav Prasad Savaiye, Chaupai, Anand", () => {
    expect(MORNING_NITNEM_IDS).toEqual([2, 4, 6, 9, 10]);
  });

  it("Evening is Rehras and Sohila Sahib (Kirtan Sohila)", () => {
    expect(EVENING_NITNEM_IDS).toEqual([21, 23]);
  });

  it("excludes Gur Mantar — it is in the reminder set, not these pothis", () => {
    expect([...MORNING_NITNEM_IDS, ...EVENING_NITNEM_IDS]).not.toContain(1);
  });

  it("uses Savaiye 6, not Shabad Hazare 3 or 5 — the names are confusable", () => {
    expect(MORNING_NITNEM_IDS).toContain(6);
    expect(MORNING_NITNEM_IDS).not.toContain(3);
    expect(MORNING_NITNEM_IDS).not.toContain(5);
  });
});

describe("buildDefaultPothis", () => {
  it("builds both pothis in the wire shape", () => {
    const [morning, evening] = buildDefaultPothis(baniList, NAMES);
    expect(morning.name).toBe("Morning Nitnem");
    expect(evening.name).toBe("Evening Nitnem");
    [morning, evening].forEach((pothi) => {
      expect(pothi.source).toBe(SOURCE);
      expect(pothi.pinned).toBe(false);
      expect(pothi.isPublic).toBe(false);
    });
  });

  it("puts the right banis in each, in reading order", () => {
    const [morning, evening] = buildDefaultPothis(baniList, NAMES);
    expect(morning.items.map((i) => i.baaniId)).toEqual([2, 4, 6, 9, 10]);
    expect(evening.items.map((i) => i.baaniId)).toEqual([21, 23]);
  });

  it("stores the Unicode title — the API keeps it verbatim for every client", () => {
    const [morning] = buildDefaultPothis(baniList, NAMES);
    expect(morning.items[0].title).toBe("ਜਪੁਜੀ ਸਾਹਿਬ");
  });

  it("builds nothing until the bani list has loaded, so the caller retries", () => {
    expect(buildDefaultPothis([], NAMES)).toEqual([]);
    expect(buildDefaultPothis(undefined, NAMES)).toEqual([]);
  });

  it("is all-or-nothing — a partial database must not seed a pothi missing a bani", () => {
    // Anand Sahib absent. Seeding here would leave Morning Nitnem permanently
    // incomplete, because seededDefaults latches.
    const partial = baniList.filter((bani) => bani.id !== 10);
    expect(buildDefaultPothis(partial, NAMES)).toEqual([]);
  });

  it("uses FIXED ids, so a repeat run replaces rather than duplicates", () => {
    // The bug this guards: minted-per-call ids meant a second run appended a
    // whole second Morning + Evening pair, which is what shipped on device.
    const [m1, e1] = buildDefaultPothis(baniList, NAMES);
    const [m2, e2] = buildDefaultPothis(baniList, NAMES);
    expect(m2.id).toBe(m1.id);
    expect(e2.id).toBe(e1.id);
  });

  it("survives being seeded twice — addPothi de-duplicates on the fixed id", () => {
    const twice = [...buildDefaultPothis(baniList, NAMES), ...buildDefaultPothis(baniList, NAMES)];
    const state = twice.reduce((acc, pothi) => addPothi(acc, pothi), emptyPothis());
    expect(state.folders).toHaveLength(2);
    expect(new Set(state.folders.map((f) => f.name)).size).toBe(2);
  });

  it("gives the two pothis different ids", () => {
    const [morning, evening] = buildDefaultPothis(baniList, NAMES);
    expect(morning.id).not.toBe(evening.id);
  });
});
