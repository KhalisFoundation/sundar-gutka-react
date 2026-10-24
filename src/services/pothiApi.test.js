import { MAX_PAYLOAD_BYTES, putFolders, utf8Bytes } from "./pothiApi";

const mockRequest = jest.fn(() => Promise.resolve({ ok: true, status: 200, data: {} }));
jest.mock("./khalisRequest", () => ({ authedRequest: (...a) => mockRequest(...a) }));
jest.mock("@common", () => ({ constant: { DASHBOARD_API_BASE_URL: "https://api.test" } }));

describe("utf8Bytes", () => {
  it("counts bytes, not UTF-16 units", () => {
    expect(utf8Bytes("abc")).toBe(3);
    expect(utf8Bytes("é")).toBe(2);
    expect(utf8Bytes("ਜਪੁ")).toBe(9);
    expect(utf8Bytes("😀")).toBe(4);
  });
});

describe("putFolders", () => {
  beforeEach(() => mockRequest.mockClear());

  // A third of the limit in characters, three times it in bytes.
  it("refuses a Gurmukhi body over the limit in bytes before sending it", async () => {
    const name = "ਜ".repeat(Math.ceil(MAX_PAYLOAD_BYTES / 3) + 10);
    const result = await putFolders({ source: "sundar-gutka", folders: [{ id: "p", name }] });
    expect(result).toEqual({ ok: false, status: 413, error: "payload-too-large" });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("sends a body within it", async () => {
    await putFolders({ source: "sundar-gutka", folders: [] });
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});
