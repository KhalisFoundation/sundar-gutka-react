/* eslint-env jest */
/**
 * Tests for the dashboard redesign Redux slices:
 *  - userProfile (local editable name)
 *  - dashboardLayout (section order + visibility, min-visible guard, self-heal)
 *  - todaysNitnem (selected bani set + per-day completion toggle)
 */

import * as actionTypes from "../common/actions/actionTypes";
import constant from "../common/constant";
import rootReducer from "../common/reducer";

// Dispatch plain action objects (not the action creators in actions/index.js,
// which import Firebase ESM modules that jest does not transform).
const actions = {
  setUserProfile: (value) => ({ type: actionTypes.SET_USER_PROFILE, value }),
  setDashboardLayout: (value) => ({ type: actionTypes.SET_DASHBOARD_LAYOUT, value }),
  resetDashboardLayout: () => ({ type: actionTypes.RESET_DASHBOARD_LAYOUT }),
  toggleNitnemDone: (date, baniId) => ({
    type: actionTypes.TOGGLE_NITNEM_DONE,
    payload: { date, baniId },
  }),
  markNitnemAutoDone: (date, baniIds) => ({
    type: actionTypes.MARK_NITNEM_AUTO_DONE,
    payload: { date, baniIds },
  }),
  markNitnemDone: (date, baniIds) => ({
    type: actionTypes.MARK_NITNEM_DONE,
    payload: { date, baniIds },
  }),
  restoreNitnem: (value) => ({ type: actionTypes.RESTORE_NITNEM, value }),
};

const init = () => rootReducer(undefined, { type: "@@INIT" });

describe("Dashboard redesign reducers", () => {
  it("userProfile defaults to empty name and updates via setUserProfile", () => {
    const state0 = init();
    expect(state0.userProfile).toEqual({ name: "", modifiedAt: 0 });

    const state1 = rootReducer(state0, actions.setUserProfile({ name: "Harpreet Kaur" }));
    expect(state1.userProfile.name).toBe("Harpreet Kaur");
  });

  it("dashboardLayout defaults to the full ordered section list, nothing hidden", () => {
    const { dashboardLayout } = init();
    const sectionCount = Object.keys(constant.DASHBOARD_SECTIONS).length;
    expect(dashboardLayout.order).toHaveLength(sectionCount);
    expect(dashboardLayout.hidden).toEqual([]);
  });

  // The assertion above counts the sections, so it passes on any arrangement.
  // This pins the designed order.
  it("defaults to the designed top-to-bottom order", () => {
    const S = constant.DASHBOARD_SECTIONS;
    expect(init().dashboardLayout.order).toEqual([
      S.STREAK,
      S.NITNEM,
      S.SHABAD_VAAK,
      S.EXPLORE,
      S.DISCOVER,
      S.REMINDERS,
      S.PRACTICE,
      S.CALENDAR,
      S.WEEK_CHART,
    ]);
  });

  // defaultLayout() is persisted on first launch, so an order on disk is not
  // evidence anyone chose it — without these two the new default would reach
  // fresh installs only.
  it("rehydrate moves an untouched previous default onto the current one", () => {
    const S = constant.DASHBOARD_SECTIONS;
    const shipped = [
      S.STREAK,
      S.NITNEM,
      S.EXPLORE,
      S.PRACTICE,
      S.CALENDAR,
      S.WEEK_CHART,
      S.DISCOVER,
      S.REMINDERS,
      S.SHABAD_VAAK,
    ];
    const state = rootReducer(init(), {
      type: "persist/REHYDRATE",
      payload: { dashboardLayout: { order: shipped, hidden: [S.DISCOVER] } },
    });
    expect(state.dashboardLayout.order).toEqual(init().dashboardLayout.order);
    // Hiding a section IS a choice, and it survives the reorder.
    expect(state.dashboardLayout.hidden).toEqual([S.DISCOVER]);
  });

  it("rehydrate leaves an order the user arranged themselves alone", () => {
    const S = constant.DASHBOARD_SECTIONS;
    const mine = [
      S.REMINDERS,
      S.STREAK,
      S.NITNEM,
      S.SHABAD_VAAK,
      S.EXPLORE,
      S.DISCOVER,
      S.PRACTICE,
      S.CALENDAR,
      S.WEEK_CHART,
    ];
    const state = rootReducer(init(), {
      type: "persist/REHYDRATE",
      payload: { dashboardLayout: { order: mine, hidden: [] } },
    });
    expect(state.dashboardLayout.order).toEqual(mine);
  });

  it("setDashboardLayout self-heals by appending newly added sections", () => {
    const state0 = init();
    // Simulate a persisted layout that predates some sections.
    const partial = { order: [constant.DASHBOARD_SECTIONS.STREAK], hidden: [] };
    const state1 = rootReducer(state0, actions.setDashboardLayout(partial));
    const sectionCount = Object.keys(constant.DASHBOARD_SECTIONS).length;
    expect(state1.dashboardLayout.order).toHaveLength(sectionCount);
    expect(state1.dashboardLayout.order[0]).toBe(constant.DASHBOARD_SECTIONS.STREAK);
  });

  it("resetDashboardLayout restores the default order", () => {
    const state0 = init();
    const hiddenLayout = { order: state0.dashboardLayout.order, hidden: ["streak"] };
    const state1 = rootReducer(state0, actions.setDashboardLayout(hiddenLayout));
    expect(state1.dashboardLayout.hidden).toEqual(["streak"]);

    const state2 = rootReducer(state1, actions.resetDashboardLayout());
    expect(state2.dashboardLayout.hidden).toEqual([]);
  });

  // WHICH banis are in the Nitnem is the Morning Nitnem pothi's business now
  // (see pothi/model), so this slice holds completion history only. The bani
  // ids themselves are pinned in pothi/defaults.test.js.
  it("todaysNitnem holds completion history and no bani set of its own", () => {
    const { todaysNitnem } = init();
    expect(todaysNitnem.completed).toEqual({});
    expect(todaysNitnem.selectedBaniIds).toBeUndefined();
  });

  it("restoreNitnem restores completion history without touching the bani set", () => {
    const state0 = init();
    const restored = { selectedBaniIds: [9, 5], completed: { "2026-06-11": [9] } };
    const state1 = rootReducer(state0, actions.restoreNitnem(restored));
    expect(state1.todaysNitnem.completed).toEqual({ "2026-06-11": [9] });
    // The per-device snapshot must not overwrite the account's own pothi.
    expect(state1.todaysNitnem.selectedBaniIds).toBeUndefined();
  });

  // A tick records that a bani WAS read that day — a fact, not a preference.
  // Replacing wholesale discarded whatever this device had done while signed
  // out, which on a restore is the user's own work.
  it("restoreNitnem UNIONS with what the device already had, per date", () => {
    let s = init();
    s = rootReducer(s, actions.toggleNitnemDone("2026-06-11", 2));
    s = rootReducer(s, actions.toggleNitnemDone("2026-06-12", 4));
    s = rootReducer(s, actions.restoreNitnem({ completed: { "2026-06-11": [9] } }));
    expect(s.todaysNitnem.completed["2026-06-11"].sort()).toEqual([2, 9]);
    // A date the snapshot says nothing about is left exactly as it was.
    expect(s.todaysNitnem.completed["2026-06-12"]).toEqual([4]);
  });

  it("restoreNitnem does not duplicate a bani both sides already had", () => {
    let s = init();
    s = rootReducer(s, actions.toggleNitnemDone("2026-06-11", 9));
    s = rootReducer(s, actions.restoreNitnem({ completed: { "2026-06-11": [9] } }));
    expect(s.todaysNitnem.completed["2026-06-11"]).toEqual([9]);
  });

  it("toggleNitnemDone adds then removes a bani for a given date", () => {
    const date = "2026-06-17";
    const state0 = init();
    const state1 = rootReducer(state0, actions.toggleNitnemDone(date, 2));
    expect(state1.todaysNitnem.completed[date]).toEqual([2]);

    const state2 = rootReducer(state1, actions.toggleNitnemDone(date, 2));
    expect(state2.todaysNitnem.completed[date]).toEqual([]);
  });

  it("markNitnemAutoDone folds 95%-scroll ids into completed and records autoSeeded", () => {
    const date = "2026-07-01";
    const state0 = init();
    const state1 = rootReducer(state0, actions.markNitnemAutoDone(date, [2, 9]));
    expect(state1.todaysNitnem.completed[date]).toEqual([2, 9]);
    expect(state1.todaysNitnem.autoSeeded[date]).toEqual([2, 9]);
  });

  it("a manually un-ticked auto-done bani is NOT resurrected on the next auto-detect", () => {
    const date = "2026-07-02";
    const state0 = init();
    // Auto-detected as done (scrolled to 95%).
    const state1 = rootReducer(state0, actions.markNitnemAutoDone(date, [2]));
    expect(state1.todaysNitnem.completed[date]).toEqual([2]);

    // User manually un-ticks it.
    const state2 = rootReducer(state1, actions.toggleNitnemDone(date, 2));
    expect(state2.todaysNitnem.completed[date]).toEqual([]);

    // Dashboard refocus re-runs auto-detection with the same completed read —
    // the un-tick must stick (bani 2 already in autoSeeded, so not re-added).
    const state3 = rootReducer(state2, actions.markNitnemAutoDone(date, [2]));
    expect(state3.todaysNitnem.completed[date]).toEqual([]);
  });

  /**
   * The "Mark done" BUTTON, which is a different promise from auto-detection.
   * Auto-detect is a guess and yields to the user; the button IS the user, so
   * nothing may veto it. Sharing MARK_NITNEM_AUTO_DONE meant the first press
   * seeded every id, and every press after that hit the `freshIds.length === 0`
   * early return — the button silently stopped working for the rest of the day.
   */
  it("Mark done still works after un-ticking (does not defer to autoSeeded)", () => {
    const date = "2026-07-03";
    const ids = [2, 3, 9];
    const state0 = init();

    const state1 = rootReducer(state0, actions.markNitnemDone(date, ids));
    expect(state1.todaysNitnem.completed[date]).toEqual(ids);

    const state2 = rootReducer(state1, actions.toggleNitnemDone(date, 3));
    expect(state2.todaysNitnem.completed[date]).toEqual([2, 9]);

    // Pressing it again must re-complete the day. This is the assertion that
    // fails against the old shared-action behaviour.
    const state3 = rootReducer(state2, actions.markNitnemDone(date, ids));
    expect(new Set(state3.todaysNitnem.completed[date])).toEqual(new Set(ids));
  });

  it("Mark done still suppresses later auto-detection of the same banis", () => {
    const date = "2026-07-04";
    const state0 = init();
    const state1 = rootReducer(state0, actions.markNitnemDone(date, [2, 3]));
    // Un-tick one, then let a background auto-detect fire for both.
    const state2 = rootReducer(state1, actions.toggleNitnemDone(date, 2));
    const state3 = rootReducer(state2, actions.markNitnemAutoDone(date, [2, 3]));
    // The un-tick survives: the button seeded them, so auto-detect adds nothing.
    expect(state3.todaysNitnem.completed[date]).toEqual([3]);
  });

  /**
   * Reading a bani to the end has to count, even if you ticked and un-ticked it
   * earlier in the day. The old guard could not tell a NEW read from the same
   * old one being re-reported on every dashboard refocus, so it suppressed
   * both — and the bani stayed un-ticked no matter how many times you read it.
   * The completion timestamp is what separates the two.
   */
  it("a genuine re-read AFTER an un-tick is marked complete", () => {
    const date = "2026-07-05";
    const state0 = init();

    // 10:00 — read to 95%, auto-detected.
    const t1 = 1000;
    const state1 = rootReducer(state0, actions.markNitnemAutoDone(date, [{ id: 2, at: t1 }]));
    expect(state1.todaysNitnem.completed[date]).toEqual([2]);

    // 10:05 — user un-ticks it.
    const state2 = rootReducer(state1, {
      type: actionTypes.TOGGLE_NITNEM_DONE,
      payload: { date, baniId: 2, at: 2000 },
    });
    expect(state2.todaysNitnem.completed[date]).toEqual([]);

    // Refocus re-reports the SAME 10:00 read — must not undo the un-tick.
    const state3 = rootReducer(state2, actions.markNitnemAutoDone(date, [{ id: 2, at: t1 }]));
    expect(state3.todaysNitnem.completed[date]).toEqual([]);

    // 10:30 — actually reads it again, to the end. This must count.
    const state4 = rootReducer(state3, actions.markNitnemAutoDone(date, [{ id: 2, at: 3000 }]));
    expect(state4.todaysNitnem.completed[date]).toEqual([2]);
  });

  it("re-ticking by hand clears the un-tick, so later auto-detection is not blocked", () => {
    const date = "2026-07-06";
    const state0 = init();
    const s1 = rootReducer(state0, {
      type: actionTypes.TOGGLE_NITNEM_DONE,
      payload: { date, baniId: 4, at: 1000 },
    });
    // Tick on, then off at 2000, then on again at 3000.
    const s2 = rootReducer(s1, {
      type: actionTypes.TOGGLE_NITNEM_DONE,
      payload: { date, baniId: 4, at: 2000 },
    });
    const s3 = rootReducer(s2, {
      type: actionTypes.TOGGLE_NITNEM_DONE,
      payload: { date, baniId: 4, at: 3000 },
    });
    expect(s3.todaysNitnem.untickedAt[date][4]).toBeUndefined();
    expect(s3.todaysNitnem.completed[date]).toEqual([4]);
  });
});
