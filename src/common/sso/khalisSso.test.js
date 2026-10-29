/* eslint-env jest */
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  consumeLoginRedirect,
  forgetConsumedLogin,
  LOGIN_WINDOW_MS,
  startLogin,
  startLogout,
} from "./khalisSso";
import { saveToken } from "./tokenStore";

// InAppBrowser keeps ONE redirect handler and asserts it is unset before
// opening a session, so a second overlapping call throws "openAuth is in a bad
// state" and the login falls back to the system browser. The Redux `busy` flag
// in useSsoActions cannot prevent that on its own: it is set by a dispatch that
// a second tap can beat. These tests pin the guard that can.

const mockLogError = jest.fn();
const mockLogMessage = jest.fn();
const mockOpenURL = jest.fn();

jest.mock("react-native-inappbrowser-reborn", () => ({
  InAppBrowser: { openAuth: jest.fn(), closeAuth: jest.fn() },
}));

jest.mock("react-native", () => ({
  Linking: { openURL: (...a) => mockOpenURL(...a) },
  Platform: { OS: "android", select: (o) => o.android },
}));

jest.mock("../firebase/crashlytics", () => ({
  logError: (...a) => mockLogError(...a),
  logMessage: (...a) => mockLogMessage(...a),
  logNetworkError: jest.fn(),
}));

jest.mock("./jwt", () => ({
  // Validity is decided elsewhere and has its own tests; what matters here is
  // that logout gets far enough to open a browser.
  isTokenValid: () => true,
  decodeJwtPayload: () => ({
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: "u1",
    email: "a@khalis.net",
  }),
  toSessionUser: (claims) => ({ id: "u1", email: claims?.email }),
  normaliseEmail: (e) => (typeof e === "string" ? e.trim().toLowerCase() : null),
}));

jest.mock("./tokenStore", () => ({
  saveToken: jest.fn().mockResolvedValue(true),
  clearToken: jest.fn().mockResolvedValue(true),
}));

jest.mock("@theme/palette", () => ({
  brandMarks: { inAppBrowser: { chrome: "#000000", onChrome: "#ffffff" } },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockOpenURL.mockResolvedValue(true);
});

describe("startLogin concurrency", () => {
  it("opens one browser session when tapped twice", async () => {
    let release;
    InAppBrowser.openAuth.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ type: "cancel" });
      })
    );

    const first = startLogin();
    const second = startLogin();
    release();
    const [a, b] = await Promise.all([first, second]);

    // One session, and the loser is handed the winner's outcome rather than a
    // second openAuth that would trip the invariant.
    expect(InAppBrowser.openAuth).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it("allows a fresh attempt once the first has settled", async () => {
    InAppBrowser.openAuth.mockResolvedValue({ type: "cancel" });

    await startLogin();
    await startLogin();

    expect(InAppBrowser.openAuth).toHaveBeenCalledTimes(2);
  });

  it("releases the guard even when the session throws", async () => {
    InAppBrowser.openAuth.mockRejectedValueOnce(new Error("in a bad state"));
    await startLogin();

    InAppBrowser.openAuth.mockResolvedValue({ type: "cancel" });
    const again = await startLogin();

    expect(again).toEqual({ status: "cancelled" });
  });
});

describe("what reaches Crashlytics", () => {
  it("records a breadcrumb, not an error, when the system browser takes over", async () => {
    InAppBrowser.openAuth.mockRejectedValue(new Error("in a bad state"));

    const result = await startLogin();

    // The user is still signing in, so this is context for a later report.
    expect(result).toEqual({ status: "pending" });
    expect(mockLogMessage).toHaveBeenCalledTimes(1);
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("records an error only when neither browser would open", async () => {
    InAppBrowser.openAuth.mockRejectedValue(new Error("in a bad state"));
    mockOpenURL.mockRejectedValue(new Error("no browser"));

    const result = await startLogin();

    expect(result).toEqual({ status: "error" });
    expect(mockLogError).toHaveBeenCalledTimes(2);
  });
});

describe("startLogout concurrency", () => {
  it("opens one browser session when tapped twice", async () => {
    let release;
    InAppBrowser.openAuth.mockReturnValue(
      new Promise((resolve) => {
        release = () => resolve({ type: "success" });
      })
    );
    const first = startLogout("valid.token.here");
    const second = startLogout("valid.token.here");
    release();
    const [a, b] = await Promise.all([first, second]);

    expect(InAppBrowser.openAuth).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });
});

// The Service Provider's /user: what it says about a token.
const spSays = (body) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
};
const loginStarted = (ago = 0) =>
  AsyncStorage.setItem("@sso_login_started_at_v1", String(Date.now() - ago));

describe("consumeLoginRedirect", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    spSays({ email: "a@khalis.net" });
  });

  // On Android one sign-in arrives twice at once (openAuth and the return
  // link). Both used to pass the already-consumed check before either had
  // finished, and both wrote the Keychain.
  it("writes the token once when the same redirect arrives twice at once", async () => {
    await loginStarted();
    const url = "sundargutka://login?token=race.token.one";
    const [a, b] = await Promise.all([consumeLoginRedirect(url), consumeLoginRedirect(url)]);

    expect(saveToken).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
  });

  // The return link is a custom scheme any page or app can open. With no
  // sign-in behind it, it must not start a session (and with it the
  // account-change purge).
  it("ignores a sign-in link when no sign-in was started", async () => {
    expect(await consumeLoginRedirect("sundargutka://login?token=forged.one")).toBeNull();
    expect(saveToken).not.toHaveBeenCalled();
  });

  // Android can re-deliver an old sign-in link from Recents after a sign-out.
  it("ignores a link long after its sign-in, and a second use of one", async () => {
    await loginStarted(LOGIN_WINDOW_MS + 1000);
    expect(await consumeLoginRedirect("sundargutka://login?token=stale.one")).toBeNull();

    await loginStarted();
    expect(await consumeLoginRedirect("sundargutka://login?token=used.once")).not.toBeNull();
    expect(await consumeLoginRedirect("sundargutka://login?token=used.again")).toBeNull();
  });

  // The remembered result answers the same sign-in arriving twice. After the
  // session ends it must not answer a re-delivered old link.
  it("does not replay a remembered sign-in once the session has ended", async () => {
    await loginStarted();
    const url = "sundargutka://login?token=replayed.one";
    expect(await consumeLoginRedirect(url)).not.toBeNull();
    forgetConsumedLogin();
    expect(await consumeLoginRedirect(url)).toBeNull();
  });

  // Even without a session end in between: a repeat is the same sign-in only
  // for a moment; later it is an old link re-delivered.
  it("does not replay a remembered sign-in after a minute", async () => {
    await loginStarted();
    const url = "sundargutka://login?token=replayed.two";
    expect(await consumeLoginRedirect(url)).not.toBeNull();
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now + 61 * 1000);
    expect(await consumeLoginRedirect(url)).toBeNull();
    Date.now.mockRestore();
  });

  it("accepts the server's address in a different case or with spaces", async () => {
    await loginStarted();
    spSays({ email: " A@Khalis.NET " });
    expect(await consumeLoginRedirect("sundargutka://login?token=case.one")).not.toBeNull();
  });

  // On Android openAuth races the tab's dismissal against the redirect; a
  // "cancel" that wins must not throw away the marker the real return link,
  // arriving through Linking, still needs.
  it("still accepts the return link after the browser reported a cancel", async () => {
    InAppBrowser.openAuth.mockResolvedValue({ type: "cancel" });
    await startLogin();
    expect(await consumeLoginRedirect("sundargutka://login?token=after.cancel")).not.toBeNull();
  });

  // The claims are only read, never verified, on the phone; the SP checks the
  // signature. A token it does not vouch for is no session.
  it("refuses a token the Service Provider does not vouch for", async () => {
    await loginStarted();
    spSays({});
    expect(await consumeLoginRedirect("sundargutka://login?token=unsigned.one")).toBeNull();

    spSays({ email: "someone.else@khalis.net" });
    expect(await consumeLoginRedirect("sundargutka://login?token=unsigned.two")).toBeNull();
    expect(saveToken).not.toHaveBeenCalled();
  });
});

describe("startLogout without an in-app browser", () => {
  // Handing the URL to the system browser does not end the IdP session; the
  // user may close it first. Claiming it did skipped the "signed out on this
  // device only" notice.
  it("does not claim the IdP session ended", async () => {
    InAppBrowser.openAuth.mockRejectedValue(new Error("no custom tabs"));

    expect(await startLogout("valid.token.here")).toEqual({ remote: false });
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
  });
});
