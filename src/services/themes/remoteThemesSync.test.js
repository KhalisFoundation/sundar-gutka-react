/* eslint-env jest */
import { fetchRemoteThemes } from "../themesApi";
import {
  PICKER_REFRESH_MIN_INTERVAL_MS,
  REFRESH_MIN_INTERVAL_MS,
  isStale,
  refreshRemoteThemes,
} from "./useRemoteThemesSync";

// The catalogue is cached hard and refreshed rarely, so what matters is exactly
// WHEN a request is allowed to happen — and, more importantly, when it is not.

jest.mock("../themesApi", () => ({ fetchRemoteThemes: jest.fn() }));

jest.mock("@theme/reader/registry", () => ({
  // Identity: this suite is about fetch scheduling, not row validation.
  sanitizeRemoteTheme: (row) => row,
  // Just enough registry to answer "is this id still a theme?" — the real
  // merge is registry.test.js's job.
  mergeThemeRegistry: (slice) => ({
    byId: Object.fromEntries((slice?.themes || []).map((t) => [t.id, t])),
  }),
}));

jest.mock("@common/actions", () => ({
  setRemoteThemes: (payload) => ({ type: "SET_REMOTE_THEMES", value: payload }),
  setTheme: (value) => ({ type: "SET_THEME", value }),
}));

jest.mock("@common", () => ({
  constant: jest.requireActual("@common/constant").default,
  logError: jest.fn(),
  trackThemeEvent: jest.fn(),
  useNetwork: () => ({ isOnline: true }),
}));

const storeWith = (remoteThemes, theme = "Default") => ({
  getState: () => ({ remoteThemes, theme }),
});
const HELD = { version: 1, fetchedAt: 0, themes: [{ id: "sanjh", base: "dark" }] };
const FRESH = { version: 1, themes: [], fetchedAt: Date.now() };
const STALE = { version: 1, themes: [], fetchedAt: Date.now() - REFRESH_MIN_INTERVAL_MS - 1 };
const NEVER = { version: 0, themes: [], fetchedAt: 0 };
// An hour old: well inside the week the background pass allows, well past the
// five minutes the picker allows.
const HOUR_OLD = { version: 1, themes: [], fetchedAt: Date.now() - 60 * 60 * 1000 };

beforeEach(() => {
  jest.clearAllMocks();
  fetchRemoteThemes.mockResolvedValue({ ok: true, version: 2, themes: [{ id: "puratan" }] });
});

describe("the launch path", () => {
  it("exports a deferral long enough to clear the launch window", () => {
    // eslint-disable-next-line global-require
    const { constant } = require("@common");

    // The catalogue is read only when the picker is opened, so this fetch has
    // no deadline — while the bundled DB seed and the first Home mount do.
    // Nothing about themes may run inside the launch window.
    expect(constant.THEMES_SYNC_DELAY_MS).toBeGreaterThanOrEqual(5000);
  });
});

describe("isStale", () => {
  it("treats a catalogue that was never fetched as stale", () => {
    expect(isStale(NEVER)).toBe(true);
    expect(isStale(undefined)).toBe(true);
  });

  it("treats one fetched within the TTL as fresh", () => {
    expect(isStale(FRESH)).toBe(false);
  });

  it("answers differently for the picker, which is the point of two intervals", () => {
    // The background pass has nothing to show for a fetch, so a week-old
    // catalogue is fine by it. The picker is the one screen where staleness is
    // visible, so an hour is already too old there.
    expect(isStale(HOUR_OLD, REFRESH_MIN_INTERVAL_MS)).toBe(false);
    expect(isStale(HOUR_OLD, PICKER_REFRESH_MIN_INTERVAL_MS)).toBe(true);
  });

  it("debounces the picker rather than caching for it", () => {
    // Opening and closing the screen repeatedly must not send a request each
    // time; opening it an hour later must.
    const justNow = { fetchedAt: Date.now() - 1000 };
    expect(isStale(justNow, PICKER_REFRESH_MIN_INTERVAL_MS)).toBe(false);
  });
});

describe("refreshRemoteThemes", () => {
  it("fetches and stores when nothing has ever been fetched", async () => {
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(NEVER), dispatch);

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SET_REMOTE_THEMES",
        value: expect.objectContaining({ version: 2 }),
      })
    );
  });

  it("costs nothing while the cache is fresh — the TTL is the point", async () => {
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(FRESH), dispatch);

    expect(fetchRemoteThemes).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("fetches again once the TTL has passed", async () => {
    await refreshRemoteThemes(storeWith(STALE), jest.fn());

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("force bypasses the TTL, for a caller that knows better", async () => {
    await refreshRemoteThemes(storeWith(FRESH), jest.fn(), { force: true });

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("leaves an hour-old catalogue alone in the background", async () => {
    await refreshRemoteThemes(storeWith(HOUR_OLD), jest.fn());

    expect(fetchRemoteThemes).not.toHaveBeenCalled();
  });

  it("refetches the same catalogue for the picker", async () => {
    await refreshRemoteThemes(storeWith(HOUR_OLD), jest.fn(), {
      ttl: PICKER_REFRESH_MIN_INTERVAL_MS,
    });

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("treats an empty catalogue as a fault and keeps what it has", async () => {
    // The API's documented failure mode is "last good cache, then an empty
    // list", so a healthy 200 carrying nothing is what a device sees while the
    // backend's own database is down. Believing it would strip every remote
    // theme from every install over a transient fault.
    fetchRemoteThemes.mockResolvedValue({ ok: true, version: 0, themes: [] });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(HELD), dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("stores an empty catalogue when there is nothing to lose", async () => {
    // A device that has never had a remote theme is not being robbed of one,
    // and recording the attempt is what stops it asking again immediately.
    fetchRemoteThemes.mockResolvedValue({ ok: true, version: 0, themes: [] });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(NEVER), dispatch);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "SET_REMOTE_THEMES" }));
  });

  it("keeps the themes it has when the request fails", async () => {
    // The device stays on its cached catalogue — offline, a captive portal, or
    // a backend that is down all look the same from here and none may wipe it.
    fetchRemoteThemes.mockResolvedValue({ ok: false });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(NEVER), dispatch);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("never throws, whatever the network did", async () => {
    fetchRemoteThemes.mockRejectedValue(new Error("ECONNRESET"));

    await expect(refreshRemoteThemes(storeWith(NEVER), jest.fn())).resolves.toBeUndefined();
  });

  it("runs one request at a time, however many callers ask at once", async () => {
    // The picker is often opened in the same instant a connection returns, so
    // both triggers fire together. Only one of them may reach the network.
    let release;
    fetchRemoteThemes.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ ok: true, version: 2, themes: [] });
      })
    );

    const a = refreshRemoteThemes(storeWith(NEVER), jest.fn());
    const b = refreshRemoteThemes(storeWith(NEVER), jest.fn());
    release();
    await Promise.all([a, b]);

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("moves the user off a withdrawn theme, keeping the appearance they read in", async () => {
    // Left alone, the setting points at an id nothing resolves: no tile is
    // selected, and someone reading in a withdrawn DARK theme is put into a
    // white app without being asked.
    fetchRemoteThemes.mockResolvedValue({ ok: true, version: 2, themes: [{ id: "puratan" }] });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(HELD, "sanjh"), dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: "SET_THEME", value: "Dark" });
  });

  it("falls to Light when the withdrawn theme was a light one", async () => {
    const held = { ...HELD, themes: [{ id: "puratan", base: "light" }] };
    fetchRemoteThemes.mockResolvedValue({ ok: true, version: 2, themes: [{ id: "sanjh" }] });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(held, "puratan"), dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: "SET_THEME", value: "Light" });
  });

  it("never touches a plain appearance keyword", async () => {
    // "Default" is not in the registry at all, which must not read as withdrawn.
    fetchRemoteThemes.mockResolvedValue({ ok: true, version: 2, themes: [] });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith({ ...HELD, themes: [] }, "Default"), dispatch);

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "SET_THEME" }));
  });

  it("leaves the selection alone while the theme is still served", async () => {
    fetchRemoteThemes.mockResolvedValue({
      ok: true,
      version: 2,
      themes: [{ id: "sanjh", base: "dark" }],
    });
    const dispatch = jest.fn();

    await refreshRemoteThemes(storeWith(HELD, "sanjh"), dispatch);

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "SET_THEME" }));
  });

  it("reports the load only when the catalogue actually moved", async () => {
    // eslint-disable-next-line global-require
    const { trackThemeEvent } = require("@common");

    await refreshRemoteThemes(storeWith({ ...NEVER, version: 2 }), jest.fn());

    expect(trackThemeEvent).not.toHaveBeenCalled();
  });
});
