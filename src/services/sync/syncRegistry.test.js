/* eslint-env jest */
import {
  getSyncFeature,
  registerSyncFeature,
  resetSyncRegistry,
  syncAll,
  syncFeatureNames,
} from "./syncRegistry";

jest.mock("@common", () => ({ logError: jest.fn(), logNetworkError: jest.fn() }));

describe("syncRegistry", () => {
  beforeEach(() => {
    resetSyncRegistry();
  });

  it("registers and unregisters features", () => {
    const off = registerSyncFeature("a", { reconcile: jest.fn() });
    expect(syncFeatureNames()).toEqual(["a"]);
    expect(getSyncFeature("a")).toBeTruthy();
    off();
    expect(syncFeatureNames()).toEqual([]);
  });

  it("runs every feature's reconcile in order", async () => {
    const order = [];
    registerSyncFeature("reminders", {
      reconcile: jest.fn(async () => {
        order.push("reminders");
        return true;
      }),
    });
    registerSyncFeature("pothis", {
      reconcile: jest.fn(async () => {
        order.push("pothis");
        return true;
      }),
    });
    expect(await syncAll()).toBe(true);
    expect(order).toEqual(["reminders", "pothis"]);
  });

  it("one feature failing does not stop the others, and the run reports it", async () => {
    const second = jest.fn(async () => true);
    registerSyncFeature("a", {
      reconcile: async () => {
        throw new Error("boom");
      },
    });
    registerSyncFeature("b", { reconcile: second });
    expect(await syncAll()).toBe(false);
    expect(second).toHaveBeenCalled();
  });

  it("a feature answering false marks the run as not fully synced", async () => {
    registerSyncFeature("a", { reconcile: async () => false });
    expect(await syncAll()).toBe(false);
  });

  it("a second call during the first joins it rather than running twice", async () => {
    let resolve;
    const reconcile = jest.fn(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    registerSyncFeature("a", { reconcile });
    const first = syncAll();
    const second = syncAll();
    resolve(true);
    await Promise.all([first, second]);
    expect(reconcile).toHaveBeenCalledTimes(1);
  });
});
