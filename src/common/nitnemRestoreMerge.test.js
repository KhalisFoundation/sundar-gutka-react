/* eslint-env jest */
/**
 * RESTORE_NITNEM unions rather than replaces, which is what lets a pull happen
 * more than once without destroying anything.
 *
 * A completion is a FACT: "this bani was finished on this date". Two devices
 * reporting different ones are not in conflict, they are both right, so the
 * reducer unions them. Replacing — which is all it used to do — threw away
 * every tick the pulling device had not yet pushed, and on a first sign-in
 * that is the user's own signed-out work.
 */

import * as actionTypes from "./actions/actionTypes";
import rootReducer from "./reducer";

const restore = (state, value) => rootReducer(state, { type: actionTypes.RESTORE_NITNEM, value });

const withNitnem = (todaysNitnem) => {
  const base = rootReducer(undefined, { type: "@@INIT" });
  return { ...base, todaysNitnem: { ...base.todaysNitnem, ...todaysNitnem } };
};

describe("RESTORE_NITNEM — always a union, never a replace", () => {
  it("keeps local history a first restore knows nothing about", () => {
    // A first sign-in CLAIMS this device's data rather than purging it, so the
    // bootstrap pull meets real local history and must not flatten it.
    const state = withNitnem({ completed: { "2026-08-18": [1] } });
    const next = restore(state, { completed: { "2026-08-17": [9] } });
    expect(next.todaysNitnem.completed).toEqual({
      "2026-08-18": [1],
      "2026-08-17": [9],
    });
  });

  it("leaves state alone when the payload carries no completion block", () => {
    const state = withNitnem({ completed: { "2026-08-18": [1] } });
    expect(restore(state, {}).todaysNitnem.completed).toEqual({ "2026-08-18": [1] });
    expect(restore(state, undefined).todaysNitnem.completed).toEqual({ "2026-08-18": [1] });
  });
});

describe("RESTORE_NITNEM — merging two devices", () => {
  it("unions per date instead of replacing", () => {
    const state = withNitnem({ completed: { "2026-08-18": [1, 2] } });
    const next = restore(state, { completed: { "2026-08-18": [2, 3] } });
    expect([...next.todaysNitnem.completed["2026-08-18"]].sort()).toEqual([1, 2, 3]);
  });

  it("keeps a local-only date the snapshot has never heard of", () => {
    const state = withNitnem({ completed: { "2026-08-18": [1] } });
    const next = restore(state, { completed: { "2026-08-17": [5] } });
    expect(next.todaysNitnem.completed["2026-08-18"]).toEqual([1]);
    expect(next.todaysNitnem.completed["2026-08-17"]).toEqual([5]);
  });

  it("never produces duplicates", () => {
    const state = withNitnem({ completed: { "2026-08-18": [1, 2] } });
    const next = restore(state, { completed: { "2026-08-18": [1, 2] } });
    expect(next.todaysNitnem.completed["2026-08-18"]).toEqual([1, 2]);
  });

  it("leaves the other nitnem books alone", () => {
    const state = withNitnem({
      completed: { "2026-08-18": [1] },
      autoSeeded: { "2026-08-18": [1] },
    });
    const next = restore(state, { completed: { "2026-08-18": [3] } });
    expect(next.todaysNitnem.autoSeeded).toEqual({ "2026-08-18": [1] });
  });
});
