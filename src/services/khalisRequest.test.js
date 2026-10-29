/* eslint-env jest */
import { authedRequest, isTransientStatus, request } from "./khalisRequest";

const mockReadToken = jest.fn();
jest.mock("@common/sso/tokenStore", () => ({ readToken: (...a) => mockReadToken(...a) }));
const mockLogError = jest.fn();
const mockLogMessage = jest.fn();
jest.mock("@common", () => ({
  isNetworkFailure: require("@common/networkFailure").isNetworkFailure,
  logError: (...a) => mockLogError(...a),
  logMessage: (...a) => mockLogMessage(...a),
}));

describe("khalisRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("classifies statuses the sync layer retries", () => {
    expect(isTransientStatus(0)).toBe(true);
    expect(isTransientStatus(429)).toBe(true);
    expect(isTransientStatus(503)).toBe(true);
    expect(isTransientStatus(409)).toBe(false);
    expect(isTransientStatus(400)).toBe(false);
  });

  it("returns parsed JSON on success and the server message on failure", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"a":1}' });
    expect(await request("u")).toEqual({ ok: true, status: 200, data: { a: 1 } });
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => '{"message":"changed elsewhere"}',
    });
    expect(await request("u")).toEqual({
      ok: false,
      status: 409,
      data: { message: "changed elsewhere" },
      error: "changed elsewhere",
    });
  });

  it("reports offline and timeouts as status 0 without a crash report", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect(await request("u")).toEqual({ ok: false, status: 0, error: "network" });
    const abort = new Error("aborted");
    abort.name = "AbortError";
    global.fetch.mockRejectedValueOnce(abort);
    expect(await request("u")).toEqual({ ok: false, status: 0, error: "timeout" });
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("sends the bearer token, and answers signed-out without one", async () => {
    mockReadToken.mockResolvedValueOnce(null);
    expect(await authedRequest("u")).toEqual({ ok: false, status: 401, error: "signed-out" });
    mockReadToken.mockResolvedValueOnce("tok");
    global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await authedRequest("u", { method: "DELETE" });
    expect(global.fetch).toHaveBeenCalledWith(
      "u",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      })
    );
  });
});
