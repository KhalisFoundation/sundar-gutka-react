/* eslint-env jest */
import { deleteAccountUrl, requestAccountDeletion } from "./deleteAccount";

// Account deletion is the one call in the app that can destroy a user's
// history, so what matters here is not that it succeeds — it is that a request
// which did NOT land is never mistaken for one that did. Every "keep the data"
// branch is asserted, because getting one of them wrong wipes a phone for an
// account that still exists.

const mockReadToken = jest.fn();
const mockLogError = jest.fn();
const mockLogMessage = jest.fn();

jest.mock("./tokenStore", () => ({ readToken: (...a) => mockReadToken(...a) }));

jest.mock("@common", () => {
  const { isNetworkFailure } = require("@common/networkFailure");
  return {
    isNetworkFailure,
    logError: (...a) => mockLogError(...a),
    logMessage: (...a) => mockLogMessage(...a),
  };
});

jest.mock("../constant", () => ({ SSO_IDP_URL: "https://idp.test" }));

const respond = (status) => {
  global.fetch = jest.fn().mockResolvedValue({ status });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockReadToken.mockResolvedValue("test.jwt.token");
});

describe("the request", () => {
  it("asks the IdP, not the service provider, and confirms", () => {
    expect(deleteAccountUrl()).toBe("https://idp.test/wp-json/khalis/v1/account?confirm=true");
  });

  it("authorises with the session token the app already holds", async () => {
    respond(200);
    await requestAccountDeletion();

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.method).toBe("DELETE");
    expect(opts.headers.Authorization).toBe("Bearer test.jwt.token");
  });

  it("does not call the server at all without a session", async () => {
    mockReadToken.mockResolvedValue(null);
    global.fetch = jest.fn();

    expect(await requestAccountDeletion()).toEqual({ ok: false, reason: "session" });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("what the server's answer means", () => {
  it("200 — scheduled, so the device may be cleared", async () => {
    respond(200);
    expect(await requestAccountDeletion()).toEqual({ ok: true, reason: "deleted" });
  });

  // Already on its way out. Reporting failure would strand the user on a device
  // still holding data for an account that no longer exists.
  it("409 — already scheduled, and that is a success", async () => {
    respond(409);
    expect(await requestAccountDeletion()).toEqual({ ok: true, reason: "already" });
  });

  it("401 — the session is unusable; the account was never asked", async () => {
    respond(401);
    expect(await requestAccountDeletion()).toEqual({ ok: false, reason: "session" });
  });

  it("500 — keep everything, and record it", async () => {
    respond(500);

    expect(await requestAccountDeletion()).toEqual({
      ok: false,
      reason: "server",
      httpStatus: 500,
    });
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});

describe("when the IdP cannot be reached", () => {
  it("keeps the data and says so, rather than filing a crash report", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));

    expect(await requestAccountDeletion()).toEqual({ ok: false, reason: "offline" });
    expect(mockLogMessage).toHaveBeenCalledTimes(1);
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("treats its own timeout the same way", async () => {
    const abort = new Error("Aborted");
    abort.name = "AbortError";
    global.fetch = jest.fn().mockRejectedValue(abort);

    expect(await requestAccountDeletion()).toEqual({ ok: false, reason: "offline" });
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("still records a genuine fault", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("undefined is not a function"));

    expect(await requestAccountDeletion()).toEqual({ ok: false, reason: "server" });
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});

// The whole point of the reason codes: exactly two of them may clear a device.
//
// Sequential on purpose. `global.fetch` is one slot, so running these together
// would have every case overwrite the others' response before any of them read
// it — the results would be whichever mock happened to land last.
const okFor = async (status) => {
  respond(status);
  const result = await requestAccountDeletion();
  return result.ok;
};

it("only ever reports ok for an answer the server actually gave", async () => {
  expect({
    200: await okFor(200),
    409: await okFor(409),
    401: await okFor(401),
    500: await okFor(500),
    503: await okFor(503),
  }).toEqual({ 200: true, 409: true, 401: false, 500: false, 503: false });
});
