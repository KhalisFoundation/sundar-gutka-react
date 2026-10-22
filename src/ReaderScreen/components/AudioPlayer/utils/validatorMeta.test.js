/* eslint-env jest */
import * as rnfs from "react-native-fs";
import {
  fetchValidators,
  metaPathFor,
  NO_CACHE_HEADERS,
  readValidatorMeta,
  removeValidatorMeta,
  validatorsFromResponse,
  validatorsMatch,
  writeValidatorMeta,
} from "./validatorMeta";

jest.mock("react-native-fs", () => ({
  exists: jest.fn(() => Promise.resolve(false)),
  readFile: jest.fn(() => Promise.resolve("")),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));

const headers = (map) => ({ get: (name) => map[String(name).toLowerCase()] ?? null });

describe("sidecar read / write", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lives beside the file", () => {
    expect(metaPathFor("/d/audio/A/x.m4a")).toBe("/d/audio/A/x.m4a.meta");
  });

  it("reads a sidecar back as an object, and null when absent or unreadable", async () => {
    rnfs.exists.mockResolvedValueOnce(true);
    rnfs.readFile.mockResolvedValueOnce('{"etag":"e1"}');
    expect(await readValidatorMeta("/d/x")).toEqual({ etag: "e1" });

    rnfs.exists.mockResolvedValueOnce(false);
    expect(await readValidatorMeta("/d/x")).toBeNull();

    rnfs.exists.mockResolvedValueOnce(true);
    rnfs.readFile.mockResolvedValueOnce("not json");
    expect(await readValidatorMeta("/d/x")).toBeNull();
  });

  it("writes best-effort and removes without throwing", async () => {
    await writeValidatorMeta("/d/x", { etag: "e" });
    expect(rnfs.writeFile).toHaveBeenCalledWith("/d/x.meta", '{"etag":"e"}', "utf8");
    rnfs.writeFile.mockRejectedValueOnce(new Error("disk"));
    await expect(writeValidatorMeta("/d/x", {})).resolves.toBeUndefined();
    rnfs.unlink.mockRejectedValueOnce(new Error("gone"));
    await expect(removeValidatorMeta("/d/x")).resolves.toBeUndefined();
    expect(rnfs.unlink).toHaveBeenCalledWith("/d/x.meta");
  });
});

describe("validators", () => {
  it("are read off the response, with the length as a number", () => {
    const response = {
      headers: headers({
        etag: "0xABC",
        "last-modified": "Sat, 13 Jun 2026 09:31:04 GMT",
        "content-md5": "1Q/l==",
        "content-length": "16136011",
      }),
    };
    expect(validatorsFromResponse(response)).toEqual({
      etag: "0xABC",
      lastModified: "Sat, 13 Jun 2026 09:31:04 GMT",
      contentMd5: "1Q/l==",
      contentLength: 16136011,
    });
  });

  it("match strongest-first and ignore a validator missing on either side", () => {
    expect(validatorsMatch({ etag: "a" }, { etag: "a" })).toBe(true);
    expect(validatorsMatch({ etag: "a" }, { etag: "b" })).toBe(false);
    // Same md5 decides even when the weaker validators disagree.
    expect(
      validatorsMatch(
        { contentMd5: "m", etag: "a", lastModified: "x" },
        { contentMd5: "m", etag: "b", lastModified: "y" }
      )
    ).toBe(false);
    expect(validatorsMatch({ contentMd5: "m", etag: "a" }, { contentMd5: "m", etag: "a" })).toBe(
      true
    );
    // A header the CDN dropped is not a mismatch.
    expect(validatorsMatch({ etag: "a", lastModified: "x" }, { lastModified: "x" })).toBe(true);
  });

  it("answer null when there is nothing to compare", () => {
    expect(validatorsMatch(null, { etag: "a" })).toBeNull();
    expect(validatorsMatch({ etag: "a" }, null)).toBeNull();
    expect(validatorsMatch({ etag: "a" }, { lastModified: "x" })).toBeNull();
  });
});

describe("fetchValidators", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("HEADs the URL past every cache and returns its validators", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: headers({ etag: "e", "content-length": "5" }),
    });
    expect(await fetchValidators("https://cdn/a.m4a")).toEqual({
      etag: "e",
      lastModified: null,
      contentMd5: null,
      contentLength: 5,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://cdn/a.m4a",
      expect.objectContaining({ method: "HEAD", headers: NO_CACHE_HEADERS })
    );
  });

  it("is null for a 404 and for a failed request", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404, headers: headers({}) });
    expect(await fetchValidators("https://cdn/a.m4a")).toBeNull();
    global.fetch.mockRejectedValueOnce(new Error("offline"));
    expect(await fetchValidators("https://cdn/a.m4a")).toBeNull();
  });
});
