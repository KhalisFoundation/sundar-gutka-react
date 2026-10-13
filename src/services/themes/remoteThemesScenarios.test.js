/* eslint-env jest */
import { AppState, InteractionManager } from "react-native";
import { useDispatch, useStore } from "react-redux";
import { act, renderHook } from "@testing-library/react-native";
import { constant, trackThemeEvent } from "@common";
import { fetchRemoteThemes } from "../themesApi";
import useRemoteThemesSync, { useThemePickerRefresh } from "./useRemoteThemesSync";

// Every situation the theme catalogue has to survive, driven through the two
// hooks that schedule the work rather than through refreshRemoteThemes
// directly. The scheduling IS the behaviour: when a fetch is allowed to happen
// and — far more often — when it is not.
//
// remoteThemesSync.test.js covers the freshness arithmetic on its own. This
// file covers what a person does: install with no signal, walk into range,
// open the picker, close it, come back a week later.

jest.mock("../themesApi", () => ({ fetchRemoteThemes: jest.fn() }));

jest.mock("@theme/reader/registry", () => ({
  // A stand-in for the real sanitiser, which registry.test.js pins in full: a
  // row with no id is not a theme. Enough to show a bad row cannot reach the
  // persisted slice.
  sanitizeRemoteTheme: (row) => (row && row.id ? row : null),
  mergeThemeRegistry: (slice) => ({
    byId: Object.fromEntries((slice?.themes || []).map((t) => [t.id, t])),
  }),
}));

jest.mock("@common/actions", () => ({
  setRemoteThemes: (payload) => ({ type: "SET_REMOTE_THEMES", value: payload }),
  setTheme: (value) => ({ type: "SET_THEME", value }),
}));

const mockNetwork = jest.fn();
jest.mock("@common", () => {
  // Debug builds force every fetch (FORCE_EVERY_TIME = __DEV__) and jest runs
  // with __DEV__ on, which would make every freshness rule below vacuous —
  // these are the RELEASE behaviours. It is set HERE because a jest.mock
  // factory runs when the mocked module is first required, which is before the
  // module under test is evaluated; an assignment in the file body would run
  // after it had already read the flag.
  // eslint-disable-next-line no-underscore-dangle
  global.__DEV__ = false;
  return {
    constant: jest.requireActual("@common/constant").default,
    logError: jest.fn(),
    trackThemeEvent: jest.fn(),
    useNetwork: () => mockNetwork(),
  };
});

jest.mock("react-redux", () => ({ useDispatch: jest.fn(), useStore: jest.fn() }));

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const PAYLOAD = { ok: true, version: 2, themes: [{ id: "puratan" }, { id: "sanjh" }] };

/**
 * A store that actually writes what it is dispatched, so "open the screen,
 * close it, open it again" asks the second time against the slice the first
 * one left behind — which is the whole question.
 */
const storeWith = (slice) => {
  let held = slice;
  const store = {
    getState: () => ({ remoteThemes: held, theme: "Default" }),
    dispatch: jest.fn((action) => {
      if (action.type === "SET_REMOTE_THEMES") held = action.value;
      return action;
    }),
    read: () => held,
  };
  useStore.mockReturnValue(store);
  useDispatch.mockReturnValue(store.dispatch);
  return store;
};

const cached = (age, over = {}) => ({
  version: 1,
  themes: [{ id: "puratan" }],
  fetchedAt: Date.now() - age,
  ...over,
});

/** Nothing has ever been fetched — a fresh install. */
const NOTHING = { version: 0, themes: [], fetchedAt: 0 };

const online = (isOnline) => mockNetwork.mockReturnValue({ isOnline });

let interactions = [];
let appStateListeners = [];

/** Run whatever the deferral handed to InteractionManager, and let it settle. */
const settle = async () => {
  const queued = interactions;
  interactions = [];
  await act(async () => {
    queued.forEach((cb) => cb());
  });
};

/** The launch window passes, then the interaction queue drains. */
const pastLaunchWindow = async () => {
  await act(async () => {
    jest.advanceTimersByTime(constant.THEMES_SYNC_DELAY_MS);
  });
  await settle();
};

const foreground = async () => {
  await act(async () => {
    appStateListeners.forEach((cb) => cb("active"));
  });
  await settle();
};

const mountApp = () => renderHook(() => useRemoteThemesSync());
const openPicker = () => renderHook(() => useThemePickerRefresh());

beforeEach(() => {
  jest.useFakeTimers();
  interactions = [];
  appStateListeners = [];
  jest.spyOn(InteractionManager, "runAfterInteractions").mockImplementation((cb) => {
    interactions.push(cb);
    return { then: () => {}, done: () => {}, cancel: () => {} };
  });
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, cb) => {
    appStateListeners.push(cb);
    return { remove: () => {} };
  });
  fetchRemoteThemes.mockClear();
  trackThemeEvent.mockClear();
  fetchRemoteThemes.mockResolvedValue(PAYLOAD);
  online(true);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("a fresh install", () => {
  it("asks for nothing inside the launch window, then tops up off the main path", async () => {
    storeWith(NOTHING);

    mountApp();
    await act(async () => {
      jest.advanceTimersByTime(constant.THEMES_SYNC_DELAY_MS - 1);
    });

    // The whole launch — the bundled DB seed, the first Home mount, the
    // dashboard's own calls — happens before themes are even considered.
    expect(fetchRemoteThemes).not.toHaveBeenCalled();
    expect(interactions).toHaveLength(0);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    // Even then it only QUEUES: still nothing while something is animating.
    expect(fetchRemoteThemes).not.toHaveBeenCalled();
    expect(interactions).toHaveLength(1);

    await settle();
    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("shows the bundled pair and asks for nothing at all with no signal", async () => {
    const store = storeWith(NOTHING);
    online(false);

    mountApp();
    await pastLaunchWindow();

    // No request, no error, no empty state — light/dark/default is a complete
    // UI on its own, so there is nothing to fail.
    expect(fetchRemoteThemes).not.toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it("asks the moment a connection appears, without waiting to be reopened", async () => {
    storeWith(NOTHING);
    online(false);

    const { rerender } = mountApp();
    await pastLaunchWindow();
    expect(fetchRemoteThemes).not.toHaveBeenCalled();

    online(true);
    await act(async () => {
      rerender();
    });
    await pastLaunchWindow();

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("does not ask twice when the theme screen got there first", async () => {
    storeWith(NOTHING);

    // Someone who goes straight to Settings inside the first eight seconds.
    openPicker();
    await act(async () => {});
    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);

    mountApp();
    await pastLaunchWindow();

    // The background pass finds what the picker already fetched.
    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });
});

describe("a returning user", () => {
  it("costs nothing on launch while the catalogue is inside the week", async () => {
    storeWith(cached(DAY));

    mountApp();
    await pastLaunchWindow();

    expect(fetchRemoteThemes).not.toHaveBeenCalled();
  });

  it("tops up once the week has passed", async () => {
    storeWith(cached(WEEK + 1));

    mountApp();
    await pastLaunchWindow();

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("refetches when the theme screen is opened on an hour-old catalogue", async () => {
    const store = storeWith(cached(HOUR));

    openPicker();
    await act(async () => {});

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
    expect(store.read().version).toBe(2);
  });

  it("is one request, not five, when the screen is opened five times over", async () => {
    storeWith(cached(HOUR));

    for (let i = 0; i < 5; i += 1) {
      const screen = openPicker();
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {});
      screen.unmount();
    }

    // The first opening refreshed it; the next four are inside the debounce.
    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("asks for nothing when the theme screen is opened offline", async () => {
    const store = storeWith(cached(WEEK));
    online(false);

    openPicker();
    await act(async () => {});

    expect(fetchRemoteThemes).not.toHaveBeenCalled();
    // And the themes they have seen before are all still there to render.
    expect(store.read().themes).toEqual([{ id: "puratan" }]);
  });

  it("picks up a connection that returns while the theme screen is open", async () => {
    storeWith(cached(HOUR));
    online(false);

    const { rerender } = openPicker();
    await act(async () => {});
    expect(fetchRemoteThemes).not.toHaveBeenCalled();

    online(true);
    await act(async () => {
      rerender();
    });

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });

  it("re-checks on returning to a warm app, and still sends nothing when fresh", async () => {
    storeWith(cached(DAY));

    mountApp();
    await pastLaunchWindow();
    await foreground();

    expect(fetchRemoteThemes).not.toHaveBeenCalled();
  });

  it("tops up on returning to a warm app when the week has passed", async () => {
    storeWith(cached(WEEK + 1));

    mountApp();
    // Straight to foreground, without waiting out the timer.
    await foreground();

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });
});

describe("when it goes wrong", () => {
  it("leaves the catalogue exactly as it was when the request fails", async () => {
    const store = storeWith(cached(WEEK + 1));
    fetchRemoteThemes.mockResolvedValue({ ok: false });

    openPicker();
    await act(async () => {});

    // Offline, a captive portal and a backend that is down all look the same
    // from here, and none of them may empty the picker.
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(store.read().themes).toEqual([{ id: "puratan" }]);
  });

  it("survives a request that throws rather than resolving", async () => {
    const store = storeWith(cached(WEEK + 1));
    fetchRemoteThemes.mockRejectedValue(new Error("ECONNRESET"));

    openPicker();
    await act(async () => {});

    expect(store.read().themes).toEqual([{ id: "puratan" }]);
  });

  it("never lets a row that is not a theme reach the store", async () => {
    const store = storeWith(cached(WEEK + 1));
    fetchRemoteThemes.mockResolvedValue({
      ok: true,
      version: 3,
      themes: [{ id: "puratan" }, { nope: true }],
    });

    openPicker();
    await act(async () => {});

    expect(store.read().themes).toEqual([{ id: "puratan" }]);
  });

  it("stores an unchanged catalogue but does not report it as a load", async () => {
    storeWith(cached(WEEK + 1, { version: 2 }));

    openPicker();
    await act(async () => {});

    // Otherwise every launch would report a load that changed nothing.
    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
    expect(trackThemeEvent).not.toHaveBeenCalled();
  });

  it("reports the load when the catalogue actually moved", async () => {
    storeWith(cached(WEEK + 1, { version: 1 }));

    openPicker();
    await act(async () => {});

    expect(trackThemeEvent).toHaveBeenCalledWith("remote_loaded", { count: 2, version: 2 });
  });

  it("is one request when the picker and a returning connection land together", async () => {
    storeWith(NOTHING);
    let release;
    fetchRemoteThemes.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve(PAYLOAD);
      })
    );

    openPicker();
    mountApp();
    await pastLaunchWindow();
    await act(async () => {
      release();
    });

    expect(fetchRemoteThemes).toHaveBeenCalledTimes(1);
  });
});
