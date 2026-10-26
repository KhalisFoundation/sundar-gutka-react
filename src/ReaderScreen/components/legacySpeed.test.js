import { mostCommonSpeed } from "./legacySpeed";

// The old per-bani speeds are keyed by bani id, which orders them by id and
// says nothing about which was chosen last; `.pop()` took the highest id's.
it("takes the speed set most often, not the highest bani id's", () => {
  expect(mostCommonSpeed({ 2: 70, 4: 70, 31: 20 })).toBe(70);
});

it("breaks a tie towards the faster speed, the same answer every time", () => {
  expect(mostCommonSpeed({ 2: 30, 31: 60 })).toBe(60);
});

it("has no answer for an empty map", () => {
  expect(mostCommonSpeed({})).toBeUndefined();
  expect(mostCommonSpeed(undefined)).toBeUndefined();
});
