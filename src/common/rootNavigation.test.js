/* eslint-env jest */
import { flushPendingNotificationRoute, navigateTo, navigationRef } from "./rootNavigation";

// A reminder tapped while the app is fully closed is reported before the
// navigator exists. Its bani must still open once the navigator is ready,
// instead of the app landing on its default screen.

jest.mock("@react-navigation/native", () => ({
  createNavigationContainerRef: () => ({ isReady: jest.fn(), navigate: jest.fn() }),
}));
jest.mock("@database", () => ({
  getBaniByID: jest.fn(async () => ({ gurmukhiUni: "ਗੁਰ ਮੰਤ੍ਰ" })),
}));
jest.mock("./firebase/crashlytics", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
jest.mock("./inAppBrowser", () => ({ openInAppBrowser: jest.fn() }));
jest.mock("./openAppLink", () => ({ storeUrlsFor: jest.fn() }));

const reminderTap = (id) => ({
  notification: { data: { id: String(id), gurmukhi: "gur mMqR", translit: "" } },
});

const readerFor = (id) => [
  "Reader",
  { key: `Reader-${id}`, params: { id: String(id), title: "gur mMqR", titleUni: "ਗੁਰ ਮੰਤ੍ਰ" } },
];

beforeEach(() => {
  navigationRef.isReady.mockReset();
  navigationRef.navigate.mockReset();
  // Nothing held over from the test before.
  navigationRef.isReady.mockReturnValue(true);
  flushPendingNotificationRoute();
  navigationRef.navigate.mockReset();
});

describe("a tapped reminder", () => {
  it("opens its bani straight away when the app is already running", async () => {
    navigationRef.isReady.mockReturnValue(true);
    await navigateTo(reminderTap(1));
    expect(navigationRef.navigate).toHaveBeenCalledWith(...readerFor(1));
  });

  it("opens its bani once the navigator is ready, when it launched the app", async () => {
    navigationRef.isReady.mockReturnValue(false);
    await navigateTo(reminderTap(1));
    expect(navigationRef.navigate).not.toHaveBeenCalled();

    navigationRef.isReady.mockReturnValue(true);
    flushPendingNotificationRoute();
    expect(navigationRef.navigate).toHaveBeenCalledWith(...readerFor(1));
  });

  it("is taken only once", async () => {
    navigationRef.isReady.mockReturnValue(false);
    await navigateTo(reminderTap(1));
    navigationRef.isReady.mockReturnValue(true);
    flushPendingNotificationRoute();
    flushPendingNotificationRoute();
    expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
  });

  it("follows the last tap when two arrive before the navigator is ready", async () => {
    navigationRef.isReady.mockReturnValue(false);
    await navigateTo(reminderTap(1));
    await navigateTo(reminderTap(2));
    navigationRef.isReady.mockReturnValue(true);
    flushPendingNotificationRoute();
    expect(navigationRef.navigate).toHaveBeenCalledTimes(1);
    expect(navigationRef.navigate.mock.calls[0][1].params.id).toBe("2");
  });

  it("holds nothing when the app was opened some other way", () => {
    navigationRef.isReady.mockReturnValue(true);
    flushPendingNotificationRoute();
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });
});
