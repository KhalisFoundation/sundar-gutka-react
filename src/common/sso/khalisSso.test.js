/* eslint-env jest */
import { InAppBrowser } from "react-native-inappbrowser-reborn";

import { startLogin, startLogout } from "./khalisSso";

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
  decodeJwtPayload: () => ({ exp: Math.floor(Date.now() / 1000) + 3600, sub: "u1" }),
  toSessionUser: () => ({ id: "u1" }),
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
