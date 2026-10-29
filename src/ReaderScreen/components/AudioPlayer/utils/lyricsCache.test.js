/* eslint-env jest */

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/documents",
  exists: jest.fn(() => Promise.resolve(false)),
  mkdir: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve("")),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));

import {
  getCachedLyricsRelativePath,
  getCachedLyricsFullPath,
  ensureLyricsCached,
  readCachedLyrics,
} from "./lyricsCache";

const rnfs = require("react-native-fs");
const CACHE_DIR = "/test/documents/audio_lyrics";

describe("lyricsCache path keying", () => {
  it("keys on the last two path segments (host-independent)", () => {
    const url = "https://cdn.example.net/audios/BhaiJarnailSingh/japji-sahib.json?v=2";
    expect(getCachedLyricsRelativePath(url)).toBe("BhaiJarnailSingh/japji-sahib.json");
    expect(getCachedLyricsFullPath(url)).toBe(`${CACHE_DIR}/BhaiJarnailSingh/japji-sahib.json`);
  });
});

describe("ensureLyricsCached", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rnfs.exists.mockResolvedValue(false);
    global.fetch = jest.fn();
  });

  it("returns null for a non-remote url without touching the network", async () => {
    const result = await ensureLyricsCached("BhaiJarnailSingh/japji-sahib.json");
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("downloads and writes a valid JSON body, returning the local path", async () => {
    const url = "https://cdn.example.net/audios/A/one.json";
    global.fetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('[{"start":0}]') });

    const result = await ensureLyricsCached(url);

    expect(result).toBe(`${CACHE_DIR}/A/one.json`);
    expect(rnfs.writeFile).toHaveBeenCalledWith(`${CACHE_DIR}/A/one.json`, '[{"start":0}]', "utf8");
  });

  it("short-circuits when the file is already cached", async () => {
    rnfs.exists.mockResolvedValue(true);
    const url = "https://cdn.example.net/audios/A/two.json";

    const result = await ensureLyricsCached(url);

    expect(result).toBe(`${CACHE_DIR}/A/two.json`);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(rnfs.writeFile).not.toHaveBeenCalled();
  });

  it("returns null and never writes on a non-OK response", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404 });
    const result = await ensureLyricsCached("https://cdn.example.net/audios/A/three.json");
    expect(result).toBeNull();
    expect(rnfs.writeFile).not.toHaveBeenCalled();
  });

  it("never caches a body that isn't valid JSON (e.g. a captive-portal page)", async () => {
    global.fetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("<html>login</html>") });
    const result = await ensureLyricsCached("https://cdn.example.net/audios/A/four.json");
    expect(result).toBeNull();
    expect(rnfs.writeFile).not.toHaveBeenCalled();
  });
});

describe("ensureLyricsCached revalidation", () => {
  const url = "https://cdn.example.net/audios/A/one.json";
  const jsonPath = `${CACHE_DIR}/A/one.json`;
  const metaPath = `${jsonPath}.meta`;

  const headers = (map) => ({ get: (name) => map[String(name).toLowerCase()] ?? null });

  beforeEach(() => {
    jest.clearAllMocks();
    // File + its sidecar already on disk; sidecar carries a prior ETag.
    rnfs.exists.mockResolvedValue(true);
    rnfs.readFile.mockImplementation((p) =>
      p === metaPath ? Promise.resolve('{"etag":"old-etag"}') : Promise.resolve("[]")
    );
    global.fetch = jest.fn();
  });

  it("sends a conditional GET and keeps the file on a 304", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 304, headers: headers({}) });

    const result = await ensureLyricsCached(url, { revalidate: true });

    expect(result).toBe(jsonPath);
    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ headers: expect.objectContaining({ "If-None-Match": "old-etag" }) })
    );
    // The JSON body is untouched on a 304 (only the sidecar is refreshed).
    const wroteJson = rnfs.writeFile.mock.calls.some(([p]) => p === jsonPath);
    expect(wroteJson).toBe(false);
  });

  it("overwrites the file and sidecar on a 200 with new content", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('[{"start":0,"end":1}]'),
      headers: headers({ etag: "new-etag", "last-modified": "Wed, 16 Jul 2026 00:00:00 GMT" }),
    });

    const result = await ensureLyricsCached(url, { revalidate: true });

    expect(result).toBe(jsonPath);
    expect(rnfs.writeFile).toHaveBeenCalledWith(jsonPath, '[{"start":0,"end":1}]', "utf8");
    // Sidecar updated with the fresh validator.
    const metaWrite = rnfs.writeFile.mock.calls.find(([p]) => p === metaPath);
    expect(metaWrite).toBeTruthy();
    expect(JSON.parse(metaWrite[1])).toMatchObject({ etag: "new-etag" });
  });

  it("never drops a good cache when the revalidation request fails (offline)", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));

    const result = await ensureLyricsCached(url, { revalidate: true });

    expect(result).toBe(jsonPath);
    expect(rnfs.unlink).not.toHaveBeenCalled();
  });

  it("does not touch the network on the default (non-revalidating) call when cached", async () => {
    const result = await ensureLyricsCached(url);
    expect(result).toBe(jsonPath);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("readCachedLyrics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns parsed JSON when cached", async () => {
    rnfs.exists.mockResolvedValue(true);
    rnfs.readFile.mockResolvedValue('[{"start":1,"end":2}]');
    const data = await readCachedLyrics("https://cdn.example.net/audios/A/five.json");
    expect(data).toEqual([{ start: 1, end: 2 }]);
  });

  it("returns null when not cached", async () => {
    rnfs.exists.mockResolvedValue(false);
    const data = await readCachedLyrics("https://cdn.example.net/audios/A/six.json");
    expect(data).toBeNull();
  });

  it("deletes and returns null on a corrupt cache file", async () => {
    rnfs.exists.mockResolvedValue(true);
    rnfs.readFile.mockResolvedValue("{ not json");
    const data = await readCachedLyrics("https://cdn.example.net/audios/A/seven.json");
    expect(data).toBeNull();
    expect(rnfs.unlink).toHaveBeenCalled();
  });
});
