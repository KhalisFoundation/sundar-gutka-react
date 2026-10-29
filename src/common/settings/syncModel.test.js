/* eslint-env jest */
import * as actionTypes from "../actions/actionTypes";
import {
  applySyncResult,
  buildSyncPayload,
  diffSettings,
  emptySettingsSync,
  snapshotSettings,
  SYNCED_SETTINGS,
  SYNCED_SETTING_KEYS,
} from "./syncModel";

// The rules that decide whose setting wins, held by tests rather than by hope.

const state = (overrides = {}) => ({
  fontSize: "SMALL",
  isLarivaar: false,
  theme: "Default",
  baniOrder: null,
  isStatistics: true,
  downloadWifiOnly: true,
  ...overrides,
});

describe("SYNCED_SETTINGS", () => {
  it("maps every synced key to a real action type", () => {
    SYNCED_SETTING_KEYS.forEach((key) => {
      expect(Object.values(actionTypes)).toContain(SYNCED_SETTINGS[key]);
    });
  });

  it("leaves the per-device decisions out", () => {
    const perDevice = [
      "isStatistics",
      "downloadWifiOnly",
      "autoDownloadOnStream",
      "autoScrollSpeedObj",
      "autoScrollSpeed",
      "defaultAudio",
      "fontFace",
    ];
    perDevice.forEach((key) => expect(SYNCED_SETTING_KEYS).not.toContain(key));
  });
});

describe("snapshotSettings / diffSettings", () => {
  it("snapshots only the synced keys", () => {
    const snap = snapshotSettings(state());
    expect(snap.fontSize).toBe("SMALL");
    expect(snap.isStatistics).toBeUndefined();
  });

  it("names the keys that changed, ignoring undefined", () => {
    const before = snapshotSettings(state());
    const after = snapshotSettings(state({ fontSize: "LARGE", baniOrder: [2, 1] }));
    expect(diffSettings(before, after).sort()).toEqual(["baniOrder", "fontSize"]);
    expect(diffSettings(before, { ...after, fontSize: undefined })).toEqual(["baniOrder"]);
  });

  it("treats a reordered object as the same value", () => {
    expect(diffSettings({ padched: { a: 1, b: 2 } }, { padched: { b: 2, a: 1 } })).toEqual([]);
  });
});

describe("buildSyncPayload", () => {
  it("sends only the settings this device has changed, with their clocks", () => {
    const snapshot = snapshotSettings(state({ fontSize: "LARGE" }));
    const meta = { ...emptySettingsSync(), clocks: { fontSize: 1000 }, lastSyncedAt: 900 };

    expect(buildSyncPayload({ snapshot, meta })).toEqual({
      settings: [{ key: "fontSize", value: "LARGE", updatedAt: 1000 }],
      lastSyncedAt: 900,
    });
  });

  it("sends nothing from an untouched device, so defaults never overwrite an account", () => {
    const snapshot = snapshotSettings(state());
    expect(buildSyncPayload({ snapshot, meta: emptySettingsSync() }).settings).toEqual([]);
  });
});

describe("applySyncResult", () => {
  const server = (settings, syncedAt = 5000) => ({ settings, syncedAt });

  it("adopts a newer server value as a raw dispatch and records the base", () => {
    const snapshot = snapshotSettings(state());
    const { actions, meta } = applySyncResult(
      server({ fontSize: { value: "LARGE", updatedAt: 4000 } }),
      { snapshot, meta: emptySettingsSync() }
    );

    expect(actions).toEqual([{ type: actionTypes.SET_FONT_SIZE, value: "LARGE" }]);
    expect(meta.base.fontSize).toBe(4000);
    expect(meta.lastSyncedAt).toBe(5000);
  });

  it("keeps a local edit that is later than the server copy", () => {
    const snapshot = snapshotSettings(state({ fontSize: "MEDIUM" }));
    const meta = { ...emptySettingsSync(), clocks: { fontSize: 6000 } };
    const { actions, meta: next } = applySyncResult(
      server({ fontSize: { value: "LARGE", updatedAt: 4000 } }),
      { snapshot, meta }
    );

    expect(actions).toEqual([]);
    // Still pending upload.
    expect(next.clocks.fontSize).toBe(6000);
  });

  it("does not re-dispatch a value the device already holds", () => {
    const snapshot = snapshotSettings(state({ fontSize: "LARGE" }));
    const large = server({ fontSize: { value: "LARGE", updatedAt: 4000 } });
    const { actions } = applySyncResult(large, { snapshot, meta: emptySettingsSync() });
    expect(actions).toEqual([]);
  });

  it("ignores a key this build does not know", () => {
    const unknown = server({ hologramMode: { value: true, updatedAt: 1 } });
    const { actions } = applySyncResult(unknown, {
      snapshot: snapshotSettings(state()),
      meta: emptySettingsSync(),
    });
    expect(actions).toEqual([]);
  });

  it("clears the local clock once the server copy is adopted", () => {
    const snapshot = snapshotSettings(state());
    const meta = { ...emptySettingsSync(), clocks: { fontSize: 3000 } };
    const large = server({ fontSize: { value: "LARGE", updatedAt: 4000 } });
    const { meta: next } = applySyncResult(large, { snapshot, meta });
    expect(next.clocks.fontSize).toBeUndefined();
  });
});
