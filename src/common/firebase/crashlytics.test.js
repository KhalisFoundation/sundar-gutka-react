/* eslint-env jest */
import { log, recordError } from "@react-native-firebase/crashlytics";
import { logError } from "./crashlytics";

jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  crash: jest.fn(),
  setAttribute: jest.fn(),
  log: jest.fn(),
  recordError: jest.fn(),
}));

describe("logError", () => {
  beforeEach(() => {
    recordError.mockClear();
    log.mockClear();
  });

  it("records a real Error as-is", () => {
    const err = new Error("boom");
    logError(err);
    expect(recordError).toHaveBeenCalledWith(expect.anything(), err);
  });

  it("wraps a bare non-Error value", () => {
    logError("useDatabaseUpdateCheck");
    const recorded = recordError.mock.calls[0][1];
    expect(recorded.message).toBe("Non-Error exception: useDatabaseUpdateCheck");
  });

  it("logError(context, error) records the real error itself, context as a breadcrumb", () => {
    // Many call sites use this two-arg form, e.g.
    // logError("useDatabaseUpdateCheck", error). The real error keeps its own
    // stack (so the issue groups where it failed); the context rides along.
    const realError = new Error("database disk image is malformed");
    logError("useDatabaseUpdateCheck", realError);
    expect(recordError).toHaveBeenCalledWith(expect.anything(), realError);
    expect(log).toHaveBeenCalledWith(expect.anything(), "useDatabaseUpdateCheck");
  });

  it("logError(context, offlineError) leaves a breadcrumb instead of an issue", () => {
    logError("useDatabaseUpdateCheck", new TypeError("Network request failed"));
    expect(recordError).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.anything(),
      "useDatabaseUpdateCheck: Network request failed"
    );
  });

  it("a native-module rejection is recorded per call site, context in the title", () => {
    const rejection = new Error("The player is not initialized.");
    rejection.code = "player_not_initialized";
    rejection.nativeStackAndroid = [];
    logError("useTrackPlayer seek failed", rejection);
    const recorded = recordError.mock.calls[0][1];
    expect(recorded).not.toBe(rejection);
    expect(recorded.message).toBe(
      "useTrackPlayer seek failed: The player is not initialized. (code: player_not_initialized)"
    );
    expect(recorded.cause).toBe(rejection);
  });

  it("error boundary: onError(error, componentStack) records the error, not the stack text", () => {
    const renderError = new Error("Cannot read property 'x' of undefined");
    const componentStack = "\n    in Reader\n    in Stack\n    in App";
    logError(renderError, componentStack);
    expect(recordError).toHaveBeenCalledWith(expect.anything(), renderError);
    expect(log).toHaveBeenCalledWith(expect.anything(), componentStack);
  });

  it("combines a string context with a non-Error extra value", () => {
    logError("Track URL is missing", "no-id");
    const recorded = recordError.mock.calls[0][1];
    expect(recorded.message).toBe("Track URL is missing no-id");
  });

  it("regression: a plain { message, code } rejection is no longer just '[object Object]'", () => {
    // Some native module rejections (and other cross-boundary errors) arrive as
    // plain objects rather than real Error instances. Before this fix, every one
    // of these collapsed into the same undiagnosable "Non-Error exception:
    // [object Object]" bucket — by far the single biggest Crashlytics issue.
    logError({ message: "Network request failed", code: "ECONNRESET" });
    const recorded = recordError.mock.calls[0][1];
    expect(recorded.message).toBe("Non-Error exception: Network request failed (code: ECONNRESET)");
  });

  it("falls back to JSON for a plain object with no message", () => {
    logError({ status: 500, url: "https://example.com" });
    const recorded = recordError.mock.calls[0][1];
    expect(recorded.message).toContain('"status":500');
  });

  it("never throws for an unserializable (circular) value", () => {
    const circular = {};
    circular.self = circular;
    expect(() => logError(circular)).not.toThrow();
    const recorded = recordError.mock.calls[0][1];
    expect(recorded.message).toBe("Non-Error exception: [object Object]");
  });
});
