/* eslint-env jest */
import { flushPendingNotificationRoute, navigateTo, navigationRef } from "./rootNavigation";

const mockOpenInAppBrowser = jest.fn(() => Promise.resolve());
jest.mock("./inAppBrowser", () => ({ openInAppBrowser: (...a) => mockOpenInAppBrowser(...a) }));
jest.mock("@database", () => ({ getBaniByID: jest.fn(() => Promise.resolve(null)) }));
jest.mock("./firebase/crashlytics", () => ({ logError: jest.fn(), logMessage: jest.fn() }));

const tap = (data) => navigateTo({ notification: { data } });

describe("navigateTo", () => {
  beforeEach(() => mockOpenInAppBrowser.mockClear());

  // On iOS notifee and FCM can both report one tap on a system-drawn
  // notification. Routed twice, the browser opened twice.
  it("routes one tap once, however many handlers report it", async () => {
    const data = { route: "url", url: "https://khalis.net/a" };
    await tap(data);
    await tap({ ...data });
    expect(mockOpenInAppBrowser).toHaveBeenCalledTimes(1);
  });

  // notifee's copy of an iOS push keeps FCM's own keys; FCM's copy does not.
  it("matches the two reports of one tap even when their extras differ", async () => {
    const data = { route: "url", url: "https://khalis.net/d" };
    await tap({ ...data, "gcm.message_id": "1", "google.c.a.e": "1" });
    await tap(data);
    expect(mockOpenInAppBrowser).toHaveBeenCalledTimes(1);
  });

  it("still routes a different notification straight after", async () => {
    await tap({ route: "url", url: "https://khalis.net/b" });
    await tap({ route: "url", url: "https://khalis.net/c" });
    expect(mockOpenInAppBrowser).toHaveBeenCalledTimes(2);
  });
});

describe("a tab destination", () => {
  afterEach(() => jest.restoreAllMocks());

  // Seva and the Dashboard exist only inside MainTabs. Navigated to by name
  // from a stack screen they resolved against nothing, and the tap did nothing.
  it.each([
    ["seva", "Seva"],
    ["dashboard", "Dashboard"],
  ])("%s goes back to the main tabs, on that tab", async (route, screen) => {
    const dispatch = jest.spyOn(navigationRef, "dispatch").mockImplementation(() => {});
    jest.spyOn(navigationRef, "isReady").mockReturnValue(true);
    await navigateTo({ notification: { data: { route, n: 1 } } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "POP_TO",
        payload: expect.objectContaining({ name: "MainTabs", params: { screen } }),
      })
    );
  });

  it("is held until the navigator is ready, then taken", async () => {
    // A separate tap, not a repeat of the one above.
    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 60000);
    const dispatch = jest.spyOn(navigationRef, "dispatch").mockImplementation(() => {});
    const ready = jest.spyOn(navigationRef, "isReady").mockReturnValue(false);
    await navigateTo({ notification: { data: { route: "seva", n: 2 } } });
    expect(dispatch).not.toHaveBeenCalled();
    ready.mockReturnValue(true);
    flushPendingNotificationRoute();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
