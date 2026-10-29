/* eslint-env jest */
import { Linking, NativeModules, Platform } from "react-native";
import { openInAppBrowser } from "./inAppBrowser";
import {
  OUTCOME_APP,
  OUTCOME_BROWSER,
  OUTCOME_STORE,
  clearStoreListingCache,
  openAppLink,
  storeUrlsFor,
} from "./openAppLink";

// The three levels, on both platforms, and that every failure falls through
// to the next rather than losing the tap. The tile fields come from the
// backend, so a tile with fewer fields must skip levels cleanly.

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  NativeModules: { AppLauncher: { openApp: jest.fn(), openUrlInApp: jest.fn() } },
  Linking: { canOpenURL: jest.fn(), openURL: jest.fn() },
}));

jest.mock("./inAppBrowser", () => ({
  openInAppBrowser: jest.fn(() => Promise.resolve()),
  withinTimeout: (p) => Promise.resolve(p).catch(() => false),
}));

const TILE = {
  url: "https://gurdham.com",
  androidPkg: "com.khalis.gurdham",
  appLink: "gurdham",
  iosAppId: "123456",
};

const PLAY_PAGE = "https://play.google.com/store/apps/details?id=com.khalis.gurdham";

const storeAnswers = (status, body) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => body })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  clearStoreListingCache();
  Platform.OS = "android";
  storeAnswers(200);
});

describe("openAppLink on Android", () => {
  it("opens the installed app and reports it", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(true);

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_APP);
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(openInAppBrowser).not.toHaveBeenCalled();
  });

  it("falls to the Play Store app when the app is not installed but listed", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(false);
    Linking.openURL.mockResolvedValue(true);

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_STORE);
    expect(global.fetch).toHaveBeenCalledWith(
      PLAY_PAGE,
      expect.objectContaining({ method: "HEAD" })
    );
    expect(Linking.openURL).toHaveBeenCalledWith("market://details?id=com.khalis.gurdham");
    expect(openInAppBrowser).not.toHaveBeenCalled();
  });

  // An app installed from outside the store (or not yet published) has a
  // package but no listing; the store would only show "item not found".
  it("skips the store for a package Play does not have", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(false);
    storeAnswers(404);

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_BROWSER);
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(openInAppBrowser).toHaveBeenCalledWith("https://gurdham.com", {});
  });

  it("goes to the web when the store cannot be reached", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(false);
    global.fetch = jest.fn(() => Promise.reject(new Error("offline")));

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_BROWSER);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("remembers a definite store answer, but not an error", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(false);
    Linking.openURL.mockResolvedValue(true);

    await openAppLink(TILE);
    await openAppLink(TILE);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    clearStoreListingCache();
    storeAnswers(503);
    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_BROWSER);
    storeAnswers(200);
    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_STORE);
  });

  it("falls to the browser when there is no store app either", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(false);
    Linking.openURL.mockRejectedValue(new Error("no activity"));

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_BROWSER);
    expect(openInAppBrowser).toHaveBeenCalledWith("https://gurdham.com", {});
  });

  it("treats a launcher that throws as not installed", async () => {
    NativeModules.AppLauncher.openApp.mockRejectedValue(new Error("security"));
    Linking.openURL.mockResolvedValue(true);

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_STORE);
  });

  it("skips both app levels for a tile with no package", async () => {
    await expect(openAppLink({ url: "https://example.org" })).resolves.toBe(OUTCOME_BROWSER);
    expect(NativeModules.AppLauncher.openApp).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(openInAppBrowser).toHaveBeenCalledWith("https://example.org", {});
  });
});

describe("openAppLink on iOS", () => {
  beforeEach(() => {
    Platform.OS = "ios";
    storeAnswers(200, { resultCount: 1 });
  });

  it("opens the app by attempting its link, without asking canOpenURL first", async () => {
    // Apple deprecated canOpenURL in iOS 27 and halved the declarable scheme
    // list to 25, so asking first would tie every new app tile to an app
    // release. Opening needs no declaration.
    Linking.openURL.mockResolvedValue(true);

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_APP);
    expect(Linking.openURL).toHaveBeenCalledWith("gurdham://");
    expect(Linking.canOpenURL).not.toHaveBeenCalled();
  });

  it("reads a rejected open — nothing can take the URL — as not installed", async () => {
    Linking.openURL.mockRejectedValueOnce(new Error("Unable to open URL"));
    Linking.openURL.mockResolvedValue(true);

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_STORE);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://itunes.apple.com/lookup?id=123456",
      expect.anything()
    );
    expect(Linking.openURL).toHaveBeenCalledWith("itms-apps://apps.apple.com/app/id123456");
  });

  it("skips the store when the lookup has no such app", async () => {
    Linking.openURL.mockRejectedValue(new Error("Unable to open URL"));
    storeAnswers(200, { resultCount: 0 });

    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_BROWSER);
    // Only the failed app attempt; no store URL was opened.
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });

  it("goes straight to the store when the tile has no link, and to the web with no id", async () => {
    Linking.openURL.mockResolvedValue(true);
    await expect(openAppLink({ url: TILE.url, iosAppId: "123456" })).resolves.toBe(OUTCOME_STORE);
    expect(Linking.openURL).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    await expect(openAppLink({ url: TILE.url, androidPkg: "com.x.y" })).resolves.toBe(
      OUTCOME_BROWSER
    );
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("never lets the Android package leak into an iOS store URL", () => {
    expect(storeUrlsFor({ androidPkg: "com.x.y" })).toBeNull();
    expect(storeUrlsFor({ iosAppId: "42" })).toEqual({
      app: "itms-apps://apps.apple.com/app/id42",
      web: "https://apps.apple.com/app/id42",
    });
  });
});

describe("the scheme route — a tile added by a database row alone", () => {
  // The point of this route: Android package visibility hides any package the
  // manifest did not name, so openApp cannot reach a NEW app. An implicit VIEW
  // intent is exempt, so a scheme from the backend opens an app this build has
  // never heard of — no manifest entry, no release.
  const SCHEME_ONLY = { url: "https://new.example", appLink: "brandnew" };

  beforeEach(() => {
    Platform.OS = "android";
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(false);
    NativeModules.AppLauncher.openApp.mockResolvedValue(false);
  });

  it("opens an app named by nothing but its scheme", async () => {
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(true);

    await expect(openAppLink(SCHEME_ONLY)).resolves.toBe(OUTCOME_APP);
    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalledWith("brandnew://");
    expect(NativeModules.AppLauncher.openApp).not.toHaveBeenCalled();
  });

  it("tries the scheme before the package, since only the scheme needs no manifest", async () => {
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(true);

    await openAppLink(TILE);

    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalled();
    expect(NativeModules.AppLauncher.openApp).not.toHaveBeenCalled();
  });

  it("still falls to the package for an app that declares no scheme", async () => {
    NativeModules.AppLauncher.openApp.mockResolvedValue(true);

    await expect(
      openAppLink({ url: "https://x.example", androidPkg: "com.khalis.gurdham" })
    ).resolves.toBe(OUTCOME_APP);
    expect(NativeModules.AppLauncher.openApp).toHaveBeenCalledWith("com.khalis.gurdham");
  });

  it("goes on to the store when the scheme resolves to nothing", async () => {
    // An unhandled scheme means the app is not installed, which is an answer,
    // not a failure.
    await expect(openAppLink(TILE)).resolves.toBe(OUTCOME_STORE);
  });

  it("reads the old iosScheme name too, so a new build and an old backend agree", async () => {
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(true);

    await openAppLink({ url: "https://x.example", iosScheme: "legacy" });

    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalledWith("legacy://");
  });

  it("reaches an app iOS was never told about, from the link alone", async () => {
    // The same promise as Android: a tile added by a row opens the installed
    // app with nothing compiled in. Attempting the open is what allows it —
    // canOpenURL would answer false for a scheme not in the plist.
    Platform.OS = "ios";
    Linking.openURL.mockResolvedValue();

    await expect(openAppLink(SCHEME_ONLY)).resolves.toBe(OUTCOME_APP);
    expect(Linking.openURL).toHaveBeenCalledWith("brandnew://");
    expect(Linking.canOpenURL).not.toHaveBeenCalled();
    expect(NativeModules.AppLauncher.openUrlInApp).not.toHaveBeenCalled();
  });
});

describe("a bare scheme versus a whole deep link", () => {
  beforeEach(() => {
    Platform.OS = "android";
    NativeModules.AppLauncher.openUrlInApp.mockResolvedValue(true);
  });

  it("makes a URL of a bare scheme", async () => {
    await openAppLink({ url: "https://x.example", appLink: "shabadavali" });

    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalledWith("shabadavali://");
  });

  it("passes a deep link through untouched", async () => {
    // An app whose intent filter names a host never matches "scheme://" — the
    // tap would fall silently through to the store. Gurdham is exactly that.
    await openAppLink({ url: "https://x.example", appLink: "khalisgurdham://login" });

    expect(NativeModules.AppLauncher.openUrlInApp).toHaveBeenCalledWith("khalisgurdham://login");
  });
});
