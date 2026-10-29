/* eslint-env jest */
import { logEvent } from "@react-native-firebase/analytics";
import { trackDashboardEvent, trackSsoEvent, trackThemeEvent, trackTourEvent } from "./analytics";
import { logError } from "./crashlytics";

// The dashboard / theme / SSO trackers follow the Seva and Pothi rule: a fixed
// name map, a namespaced fallback for an action the map does not know, and
// params sanitised so nothing reaches Firebase as (not set).

jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

jest.mock("./crashlytics", () => ({
  logError: jest.fn(),
}));

jest.mock("./helper", () => ({
  sanitizeName: jest.fn((value, maxLen, fallback) =>
    value != null && String(value).trim() !== "" ? String(value).slice(0, maxLen) : fallback
  ),
}));

const lastEventName = () => logEvent.mock.calls[0][1];
const lastParams = () => logEvent.mock.calls[0][2];

beforeEach(() => {
  logEvent.mockClear();
  logError.mockClear();
});

describe("trackDashboardEvent", () => {
  it("names the explore tap event and carries the tile, the outcome and the list source", async () => {
    await trackDashboardEvent("explore_tile_tap", {
      tile_id: "gurdham",
      outcome: "store",
      position: 5,
      source: "network",
    });

    expect(lastEventName()).toBe("dashboard_explore_tile_tap");
    expect(lastParams()).toEqual({
      tile_id: "gurdham",
      outcome: "store",
      position: 5,
      source: "network",
    });
  });

  it("carries the tile's label, its app route and the size of the row it sat in", async () => {
    await trackDashboardEvent("explore_tile_tap", {
      tile_id: "sttm",
      tile_title: "Search SikhiToTheMax",
      outcome: "app",
      position: 0,
      source: "cache",
      has_app: true,
      badge: null,
      tile_count: 6,
    });

    expect(lastParams()).toEqual({
      tile_id: "sttm",
      tile_title: "Search SikhiToTheMax",
      outcome: "app",
      position: 0,
      source: "cache",
      // Booleans are stringified and the null badge dropped, so neither shows
      // up in Firebase as (not set).
      has_app: "true",
      tile_count: 6,
    });
  });

  it("names the impression event, which is the denominator for those taps", async () => {
    await trackDashboardEvent("explore_impression", {
      tile_ids: "sttm,darbar,gurdham",
      tile_count: 3,
      source: "bundled",
    });

    expect(lastEventName()).toBe("dashboard_explore_impression");
    expect(lastParams()).toEqual({
      tile_ids: "sttm,darbar,gurdham",
      tile_count: 3,
      source: "bundled",
    });
  });

  it.each([
    ["vaak_open", "dashboard_vaak_open"],
    ["vaak_refreshed", "dashboard_vaak_refreshed"],
    ["shabad_open", "dashboard_shabad_open"],
    ["shabad_shuffle", "dashboard_shabad_shuffle"],
    ["shabad_vaak_tab", "dashboard_shabad_vaak_tab"],
    ["nitnem_bani_open", "dashboard_nitnem_bani_open"],
    ["sections_changed", "dashboard_sections_changed"],
    ["sections_reset", "dashboard_sections_reset"],
    ["section_jump", "dashboard_section_jump"],
    ["refreshed", "dashboard_refreshed"],
  ])(
    "maps %s to a declared event name rather than the namespaced fallback",
    async (action, name) => {
      await trackDashboardEvent(action);

      expect(lastEventName()).toBe(name);
    }
  );

  it("drops null params and stringifies booleans, like every namespaced tracker", async () => {
    await trackDashboardEvent("sections_changed", { hidden: true, section: null, order: "" });

    expect(lastParams()).toEqual({ hidden: "true" });
  });

  it("namespaces an action the map does not know rather than emitting it bare", async () => {
    await trackDashboardEvent("new_thing");

    expect(lastEventName()).toBe("dashboard_new_thing");
  });
});

describe("trackThemeEvent", () => {
  it("records a selection with the theme, what it replaced and where it came from", async () => {
    await trackThemeEvent("selected", { theme_id: "sapphire", previous: "blue", source: "remote" });

    expect(lastEventName()).toBe("theme_selected");
    expect(lastParams()).toEqual({ theme_id: "sapphire", previous: "blue", source: "remote" });
  });

  it("records the picker opening, which is what a selection is measured against", async () => {
    await trackThemeEvent("picker_opened", { current: "light", option_count: 9, remote_count: 2 });

    expect(lastEventName()).toBe("theme_picker_opened");
    expect(lastParams()).toEqual({ current: "light", option_count: 9, remote_count: 2 });
  });
});

describe("trackTourEvent", () => {
  it("separates the three ways out of the tour, which is the whole question", async () => {
    await trackTourEvent("completed", { step_id: "download", step_index: 3, step_count: 4 });

    expect(lastEventName()).toBe("tour_completed");
    expect(lastParams()).toEqual({ step_id: "download", step_index: 3, step_count: 4 });

    logEvent.mockClear();
    await trackTourEvent("skipped", { step_id: "tracks", step_index: 0 });
    expect(lastEventName()).toBe("tour_skipped");

    logEvent.mockClear();
    await trackTourEvent("dismissed");
    expect(lastEventName()).toBe("tour_dismissed");
  });

  it("names the opening event, which is what the exits are measured against", async () => {
    await trackTourEvent("started", { step_count: 4 });

    expect(lastEventName()).toBe("tour_started");
    expect(lastParams()).toEqual({ step_count: 4 });
  });
});

describe("trackSsoEvent", () => {
  it("emits one event per outcome", async () => {
    await trackSsoEvent("sign_in_success");
    expect(lastEventName()).toBe("sso_sign_in_success");

    logEvent.mockClear();
    await trackSsoEvent("sign_in_cancelled");
    expect(lastEventName()).toBe("sso_sign_in_cancelled");
  });

  it("carries the surface a sign-in was started from", async () => {
    await trackSsoEvent("sign_in_started", { entry_point: "dashboard_header" });

    expect(lastEventName()).toBe("sso_sign_in_started");
    expect(lastParams()).toEqual({ entry_point: "dashboard_header" });
  });

  it("separates a restored session and an expiry from the sign-in funnel", async () => {
    await trackSsoEvent("session_restored");
    expect(lastEventName()).toBe("sso_session_restored");

    logEvent.mockClear();
    await trackSsoEvent("session_expired");
    expect(lastEventName()).toBe("sso_session_expired");
  });

  it("never throws when logging fails, and reports it", async () => {
    logEvent.mockRejectedValueOnce(new Error("offline"));

    await expect(trackSsoEvent("sign_out", { remote: false })).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});
