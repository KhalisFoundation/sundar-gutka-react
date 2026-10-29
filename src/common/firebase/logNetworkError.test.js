/* eslint-env jest */
import { isNetworkFailure, logError, logMessage, logNetworkError } from "./crashlytics";

// Offline is not a bug, and every caller of `logNetworkError` already has an
// answer for it — a cache, a bundled copy, an "ask again tomorrow". They still
// filed a Crashlytics ERROR on the way past, so one launch in flight mode
// produced a dozen non-fatals nobody could act on, burying the faults that
// mattered. A connection failure is a breadcrumb now; everything else is
// untouched, and keeps the exact message text it had so a real fault does not
// change its Crashlytics grouping.

const mockRecordError = jest.fn();
const mockLog = jest.fn();

jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: () => ({}),
  setCrashlyticsCollectionEnabled: jest.fn(),
  crash: jest.fn(),
  setAttribute: jest.fn(),
  log: (...args) => mockLog(...args),
  recordError: (...args) => mockRecordError(...args),
}));

beforeEach(() => jest.clearAllMocks());

describe("isNetworkFailure", () => {
  it.each([
    "Network request failed",
    "network request failed",
    "Failed to fetch",
    "Load failed",
    "The request timed out",
    "timeout of 5000ms exceeded",
    "Aborted",
    "Network Error",
    // Android's download engine, mid-transfer, exactly as Crashlytics received it
    "Read error: ssl=0xb40000798e494b08: Failure in SSL library, usually a protocol error\nerror:1e000065:Cipher functions:OPENSSL_internal:BAD_DECRYPT (external/boringssl/src/crypto/fipsmodule/cipher/e_aes.c:1065 0x7aa408ad53:0x00000000)\nerror:1000008b:SSL routines:OPENSSL_internal:DECRYPTION_FAILED_OR_BAD_RECORD_MAC (external/boringssl/src/ssl/tls_record.cc:274 0x7aa408ad53:0x00000000)",
    "SSL handshake aborted: ssl=0x7a: I/O error during system call, Connection reset by peer",
    "Software caused connection abort",
    "unexpected end of stream",
    'Unable to resolve host "cdn.khalis.net": No address associated with hostname',
    "Connection reset",
    "Socket closed",
    // iOS
    "The network connection was lost.",
    "The Internet connection appears to be offline.",
    "An SSL error has occurred and a secure connection to the server cannot be made.",
  ])("treats %p as the connection's doing", (message) => {
    expect(isNetworkFailure(new Error(message))).toBe(true);
  });

  it.each([
    "Cannot read property 'id' of undefined",
    "no such table: dashboard_daily_activity",
    "Unexpected token < in JSON at position 0",
    "NOT_ENOUGH_STORAGE",
  ])("leaves %p a genuine error", (message) => {
    expect(isNetworkFailure(new Error(message))).toBe(false);
  });

  it("reads an errno-style code when the text says nothing useful", () => {
    const reset = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
    expect(isNetworkFailure(reset)).toBe(true);
    const other = Object.assign(new Error("boom"), { code: "E_SOMETHING_ELSE" });
    expect(isNetworkFailure(other)).toBe(false);
  });

  it("reads a bare string or a null as well as an Error", () => {
    expect(isNetworkFailure("Network request failed")).toBe(true);
    expect(isNetworkFailure(null)).toBe(false);
    expect(isNetworkFailure(undefined)).toBe(false);
  });

  // The whole reason the raw cause is passed alongside the message: the
  // sentence the app composes around it CONTAINS the platform's words, so
  // matching on that would match our own wording instead of the failure.
  it("does not match a message we wrapped around the failure", () => {
    expect(isNetworkFailure(new Error("getSevaConfig failed: Network request failed"))).toBe(false);
  });
});

describe("logNetworkError", () => {
  it("files a connection failure as a breadcrumb, not an issue", () => {
    logNetworkError(
      "getSevaConfig failed: Network request failed",
      new Error("Network request failed")
    );

    expect(mockLog).toHaveBeenCalledWith({}, "getSevaConfig failed: Network request failed");
    expect(mockRecordError).not.toHaveBeenCalled();
  });

  it("still records anything that is not the network", () => {
    logNetworkError("getSevaConfig failed: boom", new Error("boom"));

    expect(mockRecordError).toHaveBeenCalledTimes(1);
    expect(mockRecordError.mock.calls[0][1].message).toBe("getSevaConfig failed: boom");
    expect(mockLog).not.toHaveBeenCalled();
  });

  it("keeps the message the call site wrote, so grouping does not move", () => {
    const text = "getWordOfDay (api) failed: Unexpected token <";
    logNetworkError(text, new Error("Unexpected token <"));

    expect(mockRecordError.mock.calls[0][1].message).toBe(text);
  });

  it("accepts an Error as the message, like logError does", () => {
    logNetworkError(new Error("upstream exploded"), new Error("upstream exploded"));

    expect(mockRecordError.mock.calls[0][1].message).toBe("upstream exploded");
  });

  it("does not change logError itself", () => {
    logError(new Error("Network request failed"));

    expect(mockRecordError).toHaveBeenCalledTimes(1);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it("leaves logMessage alone", () => {
    logMessage("hello");

    expect(mockLog).toHaveBeenCalledWith({}, "hello");
  });
});
