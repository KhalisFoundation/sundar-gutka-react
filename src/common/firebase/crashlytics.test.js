/* eslint-env jest */
jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  crash: jest.fn(),
  setAttribute: jest.fn(),
  log: jest.fn(),
  recordError: jest.fn(),
  didCrashOnPreviousExecution: jest.fn(() => Promise.resolve(false)),
}));

import { didCrashOnPreviousExecution, recordError } from "@react-native-firebase/crashlytics";
import { didCrashLastRun, logError } from "./crashlytics";

describe("logError", () => {
  beforeEach(() => {
    recordError.mockClear();
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

  it("regression: logError(context, error) must not swallow the real error", () => {
    // Many call sites use this two-arg form, e.g.
    // logError("useDatabaseUpdateCheck", error). Before the fix, the second
    // argument was dropped entirely and the context string was recorded as
    // if it were the whole error, losing the real failure's message.
    const realError = new Error("network request failed");
    logError("useDatabaseUpdateCheck", realError);
    const recorded = recordError.mock.calls[0][1];
    expect(recorded.message).toContain("network request failed");
    expect(recorded.message).toContain("useDatabaseUpdateCheck");
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
    expect(recorded.message).toBe(
      "Non-Error exception: Network request failed (code: ECONNRESET)"
    );
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

describe("didCrashLastRun", () => {
  it("passes on Crashlytics' answer", async () => {
    didCrashOnPreviousExecution.mockResolvedValueOnce(true);
    await expect(didCrashLastRun()).resolves.toBe(true);
  });

  it("answers false rather than failing when Crashlytics cannot tell", async () => {
    didCrashOnPreviousExecution.mockRejectedValueOnce(new Error("not ready"));
    await expect(didCrashLastRun()).resolves.toBe(false);
  });
});
