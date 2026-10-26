/* eslint-env jest */
import { Platform } from "react-native";
import { storeUrlsFor } from "@common/openAppLink";
import { bundledExploreLinks } from "./exploreBundled";

// react-native-inappbrowser-reborn ships ESM Jest does not transform, and
// openAppLink reaches it through inAppBrowser. Only storeUrlsFor is wanted
// here, which touches neither.
jest.mock("@common/inAppBrowser", () => ({
  openInAppBrowser: jest.fn(),
  withinTimeout: (p) => Promise.resolve(p),
}));

// react-native-localization needs a native module; the labels are not what
// this suite is about.
jest.mock("@common/localization", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

// The ids each app tile needs to reach its three levels.
//
// These are not decoration: a missing androidPkg silently costs a tile its
// installed-app AND its store level, and the tap looks like it simply went to
// the web — which is exactly how Shabadavali shipped. They are verified values
// (the Play listings answer 200, the App Store lookup returns the app), so a
// test is the right place to keep them from drifting.

const byId = Object.fromEntries(bundledExploreLinks().map((l) => [l.id, l]));

describe("the app tiles", () => {
  it("names the Android package for every tile that has an app", () => {
    expect(byId["sehaj-path"].androidPkg).toBe("com.khalis.sehajpathapp");
    expect(byId.shabadavali.androidPkg).toBe("org.khalisfoundation.shabadavali");
    expect(byId.gurdham.androidPkg).toBe("com.khalis.gurdham");
  });

  it("names the App Store id for the two apps that are published there", () => {
    expect(byId["sehaj-path"].iosAppId).toBe("6752426194");
    expect(byId.gurdham.iosAppId).toBe("6789282113");
  });

  it("leaves Shabadavali without an App Store id, because there is not one", () => {
    // A wrong id is worse than none: it would send an iPhone to a listing that
    // is not the app. With none, storeUrlsFor answers null and the tap falls to
    // the web, which is where Shabadavali actually lives on iOS.
    expect(byId.shabadavali.iosAppId).toBeNull();
    Platform.OS = "ios";
    expect(storeUrlsFor(byId.shabadavali)).toBeNull();
    Platform.OS = "android";
    expect(storeUrlsFor(byId.shabadavali)).not.toBeNull();
  });

  it("gives every tile an https destination to fall back to", () => {
    bundledExploreLinks().forEach((tile) => {
      expect(tile.url).toMatch(/^https:\/\//);
    });
  });

  it("names each app's own link, the route that needs nothing compiled in", () => {
    // Read off the installed builds' own manifests. This is what lets a tile
    // open an app the manifest never named — an implicit intent is exempt from
    // Android package visibility.
    expect(byId.shabadavali.appLink).toBe("shabadavali");
    expect(byId.gurdham.appLink).toBe("khalisgurdham://login");
  });
});
