/* eslint-env jest */
import { Linking, NativeModules, Platform } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import { APP_ATTEMPT_TIMEOUT_MS, openInAppBrowser, schemesForUrl } from "./inAppBrowser";

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  Linking: { canOpenURL: jest.fn(), openURL: jest.fn(() => Promise.resolve()) },
  NativeModules: { AppLauncher: { openUrlInApp: jest.fn() } },
}));
jest.mock("react-native-inappbrowser-reborn", () => ({
  InAppBrowser: { open: jest.fn(() => Promise.resolve()) },
}));
jest.mock("@theme/palette", () => ({
  brandMarks: { inAppBrowser: { chrome: "#113979", onChrome: "#ffffff" } },
}));

const INSTAGRAM = "https://www.instagram.com/khalisfound/";
const FORM = "https://forms.gle/zc7JQiLHGxHKXP599";

// Nothing in the app names a service: the scheme comes from the domain, so a
// link the backend adds later needs no release.
describe("schemesForUrl", () => {
  it("reads the scheme off the domain, ignoring www, subdomains and ports", () => {
    expect(schemesForUrl(INSTAGRAM)).toEqual(["instagram"]);
    expect(schemesForUrl("https://khalisfoundation.substack.com/")).toEqual(["substack"]);
    expect(schemesForUrl("https://app.notion.com:443/p/x")).toEqual(["notion"]);
    expect(schemesForUrl("https://github.com/KhalisFoundation")).toEqual(["github"]);
    expect(schemesForUrl("https://open.spotify.com/artist/x")).toEqual(["spotify"]);
  });

  it("knows the services whose scheme is not their name", () => {
    expect(schemesForUrl("https://x.com/khalisfound")).toEqual(["twitter"]);
    expect(schemesForUrl("https://www.facebook.com/khalisfoundation/")).toEqual(["fb"]);
    expect(schemesForUrl("https://youtu.be/abc")).toEqual(["youtube"]);
    expect(schemesForUrl("https://www.threads.net/@khalis")).toEqual(["barcelona"]);
    expect(schemesForUrl("https://www.messenger.com/t/x")).toEqual(["fb-messenger"]);
    expect(schemesForUrl("https://www.tiktok.com/@khalisfoundation/")).toEqual([
      "tiktok",
      "snssdk1233",
    ]);
  });

  it("is empty for anything that is not an http(s) URL", () => {
    expect(schemesForUrl("")).toEqual([]);
    expect(schemesForUrl(undefined)).toEqual([]);
    expect(schemesForUrl("mailto:x@y.z")).toEqual([]);
  });
});

describe("openInAppBrowser on Android", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "android";
    NativeModules.AppLauncher = { openUrlInApp: jest.fn() };
  });

  it("offers every https link to the system, and opens no tab when an app took it", async () => {
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(true);
    await openInAppBrowser(INSTAGRAM);
    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalledWith(INSTAGRAM);
    expect(InAppBrowser.open).not.toHaveBeenCalled();
  });

  it("falls back to the in-app browser when only a browser would take it", async () => {
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(false);
    await openInAppBrowser(FORM);
    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalledWith(FORM);
    expect(InAppBrowser.open).toHaveBeenCalledWith(FORM, expect.any(Object));
  });

  it("still opens the link when the native module is missing or throws", async () => {
    NativeModules.AppLauncher = undefined;
    await openInAppBrowser(INSTAGRAM);
    expect(InAppBrowser.open).toHaveBeenCalledTimes(1);

    NativeModules.AppLauncher = { openUrlInApp: jest.fn(() => Promise.reject(new Error("x"))) };
    await openInAppBrowser(INSTAGRAM);
    expect(InAppBrowser.open).toHaveBeenCalledTimes(2);
  });
});

describe("openInAppBrowser on iOS", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
  });

  it("opens the https link as a universal link once the derived scheme answers", async () => {
    Linking.canOpenURL.mockResolvedValue(true);
    await openInAppBrowser(INSTAGRAM);
    expect(Linking.canOpenURL).toHaveBeenCalledWith("instagram://");
    expect(Linking.openURL).toHaveBeenCalledWith(INSTAGRAM);
    expect(InAppBrowser.open).not.toHaveBeenCalled();
  });

  it("uses the in-app browser when the app is not installed", async () => {
    Linking.canOpenURL.mockResolvedValue(false);
    await openInAppBrowser(INSTAGRAM);
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(InAppBrowser.open).toHaveBeenCalledWith(INSTAGRAM, expect.any(Object));
  });

  it("treats a scheme the plist does not declare as not installed, rather than failing", async () => {
    Linking.canOpenURL.mockRejectedValue(new Error("not whitelisted"));
    await openInAppBrowser(FORM);
    expect(Linking.canOpenURL).toHaveBeenCalledWith("forms://");
    expect(InAppBrowser.open).toHaveBeenCalledWith(FORM, expect.any(Object));
  });

  it("tries a service's second scheme when the first is unknown to this iOS", async () => {
    Linking.canOpenURL.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await openInAppBrowser("https://www.tiktok.com/@khalisfoundation/");
    expect(Linking.canOpenURL).toHaveBeenNthCalledWith(1, "tiktok://");
    expect(Linking.canOpenURL).toHaveBeenNthCalledWith(2, "snssdk1233://");
    expect(Linking.openURL).toHaveBeenCalled();
  });
});

describe("an app attempt that never answers", () => {
  afterEach(() => jest.useRealTimers());

  it("gives up on the native call after the time cap and opens the in-app browser", async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Platform.OS = "android";
    NativeModules.AppLauncher = { openUrlInApp: jest.fn(() => new Promise(() => {})) };
    const pending = openInAppBrowser(INSTAGRAM);
    await Promise.resolve();
    jest.advanceTimersByTime(APP_ATTEMPT_TIMEOUT_MS);
    await pending;
    expect(InAppBrowser.open).toHaveBeenCalledWith(INSTAGRAM, expect.any(Object));
  });

  it("gives up on an iOS probe the same way", async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Platform.OS = "ios";
    Linking.canOpenURL.mockReturnValue(new Promise(() => {}));
    const pending = openInAppBrowser(INSTAGRAM);
    await Promise.resolve();
    jest.advanceTimersByTime(APP_ATTEMPT_TIMEOUT_MS);
    await pending;
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(InAppBrowser.open).toHaveBeenCalledWith(INSTAGRAM, expect.any(Object));
  });
});

describe("the browser fallback", () => {
  it("drops to the system browser only when the in-app browser itself fails", async () => {
    jest.clearAllMocks();
    Platform.OS = "ios";
    Linking.canOpenURL.mockResolvedValue(false);
    InAppBrowser.open.mockRejectedValueOnce(new Error("no custom tabs"));
    await openInAppBrowser(FORM);
    expect(Linking.openURL).toHaveBeenCalledWith(FORM);
  });
});
