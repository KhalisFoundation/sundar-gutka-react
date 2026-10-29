/* eslint-env jest */
import { ensureLyricsCached } from "../../ReaderScreen/components/AudioPlayer/utils/lyricsCache";
import { reconcileDownloads, expectedTracksFromGroups, trackKeyForFile } from "./audioReconcile";

// In-memory disk: path → contents. Directories are implied by their files.
let mockDisk;
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/doc",
  exists: jest.fn(
    async (p) => mockDisk.has(p) || [...mockDisk.keys()].some((k) => k.startsWith(`${p}/`))
  ),
  readFile: jest.fn(async (p) => {
    if (!mockDisk.has(p)) throw new Error("ENOENT");
    return mockDisk.get(p);
  }),
  writeFile: jest.fn(async (p, d) => mockDisk.set(p, d)),
  unlink: jest.fn(async (p) => {
    if (mockDisk.has(p)) return mockDisk.delete(p);
    const children = [...mockDisk.keys()].filter((k) => k.startsWith(`${p}/`));
    if (!children.length) throw new Error("ENOENT");
    return children.forEach((k) => mockDisk.delete(k));
  }),
  stat: jest.fn(async (p) => ({ size: (mockDisk.get(p) || "").length })),
  readDir: jest.fn(async (p) => {
    const names = new Set();
    [...mockDisk.keys()].forEach((k) => {
      if (k.startsWith(`${p}/`)) names.add(k.slice(p.length + 1).split("/")[0]);
    });
    return [...names].map((name) => {
      const full = `${p}/${name}`;
      const isDir = !mockDisk.has(full);
      return { name, path: full, isDirectory: () => isDir, isFile: () => !isDir };
    });
  }),
  mkdir: jest.fn(async () => {}),
}));
const mockGetActiveTrack = jest.fn(async () => null);
jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: { getActiveTrack: (...a) => mockGetActiveTrack(...a) },
}));
const mockNet = jest.fn(async () => ({ type: "wifi" }));
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { fetch: (...a) => mockNet(...a) },
}));
const mockLogError = jest.fn();
jest.mock("@common", () => ({
  logError: (...a) => mockLogError(...a),
  logMessage: jest.fn(),
}));
jest.mock("../actions", () => ({
  enqueueDownload: (payload) => ({ type: "ENQUEUE_DOWNLOAD", payload }),
  removeDownloadEntries: (keys) => ({ type: "REMOVE_DOWNLOAD_ENTRIES", payload: keys }),
  updateDownloadEntries: (patches) => ({ type: "UPDATE_DOWNLOAD_ENTRIES", payload: patches }),
  setAudioManifest: (baniId, tracks) => ({
    type: "SET_AUDIO_MANIFEST",
    payload: { baniId, tracks },
  }),
}));
jest.mock("../../ReaderScreen/components/AudioPlayer/utils/lyricsCache", () => ({
  ensureLyricsCached: jest.fn(() => Promise.resolve("/doc/audio_lyrics/x")),
}));

const CDN = "https://cdn.example.net/audios";
const AUDIO = "/doc/audio";
const KEY = "BhaiJarnailSingh/JapjiSahib.m4a";
const JSON_KEY = "BhaiJarnailSingh/JapjiSahib.json";
const LINK = `${CDN}/${KEY}`;
const headers = (map) => ({ get: (name) => map[String(name).toLowerCase()] ?? null });

// The CDN as the test sees it: url → { etag, body } or missing → 404.
let cdn;
const serve = (url, init = {}) => {
  const entry = cdn[url];
  if (!entry) return { ok: false, status: 404, headers: headers({}) };
  const h = headers({ etag: entry.etag, "content-length": String(entry.body.length) });
  if (init.headers?.["If-None-Match"] === entry.etag) return { ok: false, status: 304, headers: h };
  return { ok: true, status: 200, headers: h, text: async () => entry.body };
};

const groupsWith = (over = {}) => ({
  short: {
    artists: [
      {
        artistId: 4,
        name: "Bhai Jarnail Singh",
        trackId: 1,
        link: LINK,
        lyricsUrl: `${CDN}/BhaiJarnailSingh/japji.json`,
        sizeMb: 15,
        ...over,
      },
    ],
  },
});

let state;
let dispatched;
const dispatch = (a) => dispatched.push(a);
const run = (manifests) => reconcileDownloads({ manifests, getState: () => state, dispatch });
const entry = (over = {}) => ({
  relativePath: KEY,
  artistDisplayName: "Bhai Jarnail Singh",
  baniTitle: "jpujI swihb",
  baniNameUni: "ਜਪੁਜੀ ਸਾਹਿਬ",
  baniId: 2,
  sizeMB: 15,
  sizeBytes: 10,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDisk = new Map([
    [`${AUDIO}/${KEY}`, "0123456789"],
    [`${AUDIO}/${JSON_KEY}`, "[]"],
  ]);
  cdn = {
    [LINK]: { etag: "v1", body: "0123456789" },
    [`${CDN}/${JSON_KEY}`]: { etag: "j1", body: "[]" },
  };
  global.fetch = jest.fn(async (url, init) => serve(url, init));
  state = {
    downloadRegistry: { [KEY]: entry() },
    downloadQueue: {},
    downloadWifiOnly: true,
    audioManifest: { 2: [{ id: 1, audioUrl: KEY }] },
  };
  dispatched = [];
  mockGetActiveTrack.mockResolvedValue(null);
  mockNet.mockResolvedValue({ type: "wifi" });
});

describe("helpers", () => {
  it("expectedTracksFromGroups unions every length group by on-disk path", () => {
    const groups = {
      short: { artists: [{ link: `${CDN}/A/one.m4a`, name: "A", sizeMb: 1 }] },
      long: {
        artists: [
          { link: `${CDN}/A/one.m4a`, name: "A" },
          { link: `${CDN}/B/two.m4a`, name: "B" },
        ],
      },
      xl: null,
    };
    expect(Object.keys(expectedTracksFromGroups(groups)).sort()).toEqual([
      "A/one.m4a",
      "B/two.m4a",
    ]);
    expect(expectedTracksFromGroups(null)).toEqual({});
  });

  it("trackKeyForFile maps audio, JSON and both sidecars to one key", () => {
    expect(trackKeyForFile("A", "x.m4a")).toBe("A/x.m4a");
    expect(trackKeyForFile("A", "x.json")).toBe("A/x.m4a");
    expect(trackKeyForFile("A", "x.m4a.meta")).toBe("A/x.m4a");
    expect(trackKeyForFile("A", "x.json.meta")).toBe("A/x.m4a");
  });
});

describe("nothing to act on", () => {
  it("does nothing with no manifests, without touching the network", async () => {
    const r = await run({});
    expect(r.changed).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("leaves a bani alone whose manifest is not in the pass", async () => {
    const r = await run({ 4: groupsWith() });
    expect(r.removed).toEqual([]);
    expect(mockDisk.has(`${AUDIO}/${KEY}`)).toBe(true);
  });

  it("adopts validators for a legacy download whose bytes match, then is exact next time", async () => {
    const r = await run({ 2: groupsWith() });
    expect(r.changed).toBe(false);
    expect(JSON.parse(mockDisk.get(`${AUDIO}/${KEY}.meta`))).toMatchObject({ etag: "v1" });
    global.fetch.mockClear();
    await run({ 2: groupsWith() });
    // HEAD for the audio + conditional GET for the companion JSON; no downloads.
    expect(global.fetch.mock.calls.map(([, init]) => init?.method || "GET")).toEqual([
      "HEAD",
      "GET",
    ]);
  });

  it("revalidates the lyrics every track of the bani plays against", async () => {
    await run({ 2: groupsWith() });
    expect(ensureLyricsCached).toHaveBeenCalledWith(`${CDN}/BhaiJarnailSingh/japji.json`, {
      revalidate: true,
    });
  });
});

describe("same URL, different bytes", () => {
  it("replaces the pair and queues the download", async () => {
    await run({ 2: groupsWith() });
    cdn[LINK] = { etag: "v2", body: "01234567" };
    const r = await run({ 2: groupsWith({ name: "Bhai Jarnail Singh" }) });
    expect(r.replaced).toEqual([KEY]);
    expect(mockDisk.has(`${AUDIO}/${KEY}`)).toBe(false);
    expect(mockDisk.has(`${AUDIO}/${JSON_KEY}`)).toBe(false);
    expect(mockDisk.has(`${AUDIO}/${KEY}.meta`)).toBe(false);
    expect(dispatched).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ENQUEUE_DOWNLOAD",
          payload: expect.objectContaining({
            trackKey: KEY,
            audioUrl: LINK,
            baniId: 2,
            baniNameUni: "ਜਪੁਜੀ ਸਾਹਿਬ",
          }),
        }),
        { type: "REMOVE_DOWNLOAD_ENTRIES", payload: [KEY] },
        { type: "SET_AUDIO_MANIFEST", payload: { baniId: "2", tracks: [] } },
      ])
    );
  });

  it("a legacy download with no sidecar is judged by byte length", async () => {
    cdn[LINK] = { etag: "v2", body: "01234567" };
    const r = await run({ 2: groupsWith() });
    expect(r.replaced).toEqual([KEY]);
  });

  it("is not replaced while the player holds it, on cellular with WiFi-only, or mid-download", async () => {
    cdn[LINK] = { etag: "v2", body: "01234567" };
    mockGetActiveTrack.mockResolvedValue({ url: `file://${AUDIO}/${KEY}` });
    expect((await run({ 2: groupsWith() })).replaced).toEqual([]);
    mockGetActiveTrack.mockResolvedValue(null);
    mockNet.mockResolvedValue({ type: "cellular" });
    expect((await run({ 2: groupsWith() })).replaced).toEqual([]);
    mockNet.mockResolvedValue({ type: "wifi" });
    state.downloadQueue[KEY] = { status: "downloading" };
    expect((await run({ 2: groupsWith() })).replaced).toEqual([]);
    expect(mockDisk.has(`${AUDIO}/${KEY}`)).toBe(true);
  });

  it("a validator that cannot be fetched is not a change", async () => {
    delete cdn[LINK];
    const r = await run({ 2: groupsWith() });
    expect(r.replaced).toEqual([]);
    expect(mockDisk.has(`${AUDIO}/${KEY}`)).toBe(true);
  });

  it("a sizeMb edit with the same bytes is not a change", async () => {
    await run({ 2: groupsWith() });
    const r = await run({ 2: groupsWith({ sizeMb: 99 }) });
    expect(r.replaced).toEqual([]);
  });
});

describe("companion JSON", () => {
  it("is refetched alone when it changed, and picked up when it did not exist", async () => {
    await run({ 2: groupsWith() });
    cdn[`${CDN}/${JSON_KEY}`] = { etag: "j2", body: '[{"start":1}]' };
    let r = await run({ 2: groupsWith() });
    expect(r.jsonRefreshed).toEqual([KEY]);
    expect(mockDisk.get(`${AUDIO}/${JSON_KEY}`)).toBe('[{"start":1}]');
    expect(mockDisk.has(`${AUDIO}/${KEY}`)).toBe(true);

    mockDisk.delete(`${AUDIO}/${JSON_KEY}`);
    mockDisk.delete(`${AUDIO}/${JSON_KEY}.meta`);
    r = await run({ 2: groupsWith() });
    expect(r.jsonRefreshed).toEqual([KEY]);
    expect(mockDisk.get(`${AUDIO}/${JSON_KEY}`)).toBe('[{"start":1}]');
  });

  it("keeps the copy on mockDisk when the CDN answers 404 or with something that is not JSON", async () => {
    await run({ 2: groupsWith() });
    delete cdn[`${CDN}/${JSON_KEY}`];
    expect((await run({ 2: groupsWith() })).jsonRefreshed).toEqual([]);
    cdn[`${CDN}/${JSON_KEY}`] = { etag: "j3", body: "<html>captive portal</html>" };
    expect((await run({ 2: groupsWith() })).jsonRefreshed).toEqual([]);
    expect(mockDisk.get(`${AUDIO}/${JSON_KEY}`)).toBe("[]");
  });
});

describe("catalog membership", () => {
  it("deletes a track the manifest no longer names, its folder when empty, and the session entry", async () => {
    const r = await run({ 2: { short: { artists: [] } } });
    expect(r.removed).toEqual([KEY]);
    expect([...mockDisk.keys()].some((k) => k.startsWith(`${AUDIO}/BhaiJarnailSingh`))).toBe(false);
    expect(dispatched).toContainEqual({ type: "REMOVE_DOWNLOAD_ENTRIES", payload: [KEY] });
    expect(dispatched).toContainEqual({
      type: "SET_AUDIO_MANIFEST",
      payload: { baniId: "2", tracks: [] },
    });
  });

  it("does not delete a track that only moved to another length group", async () => {
    const r = await run({ 2: { long: groupsWith().short } });
    expect(r.removed).toEqual([]);
  });

  it("corrects a renamed artist without re-downloading", async () => {
    const r = await run({ 2: groupsWith({ name: "Bhai Jarnail Singh Ji" }) });
    expect(r.renamed).toEqual([KEY]);
    expect(dispatched).toContainEqual({
      type: "UPDATE_DOWNLOAD_ENTRIES",
      payload: { [KEY]: { artistDisplayName: "Bhai Jarnail Singh Ji" } },
    });
    expect(dispatched.map((a) => a.type)).not.toContain("ENQUEUE_DOWNLOAD");
  });
});

describe("orphans", () => {
  it("sweeps files nothing owns, keeps queued ones and the player's", async () => {
    mockDisk.set(`${AUDIO}/Old/gone.m4a`, "x");
    mockDisk.set(`${AUDIO}/Old/gone.json.meta`, "{}");
    mockDisk.set(`${AUDIO}/BhaiJarnailSingh/incoming.m4a`, "y");
    mockDisk.set(`${AUDIO}/BhaiJarnailSingh/playing.m4a`, "z");
    state.downloadQueue["BhaiJarnailSingh/incoming.m4a"] = { status: "queued" };
    mockGetActiveTrack.mockResolvedValue({ url: `${AUDIO}/BhaiJarnailSingh/playing.m4a` });
    const r = await run({ 2: groupsWith() });
    expect(r.orphansDeleted.sort()).toEqual(["Old/gone.json.meta", "Old/gone.m4a"]);
    expect(mockDisk.has(`${AUDIO}/BhaiJarnailSingh/incoming.m4a`)).toBe(true);
    expect(mockDisk.has(`${AUDIO}/BhaiJarnailSingh/playing.m4a`)).toBe(true);
  });
});

describe("robustness", () => {
  it("one bad entry never stops the pass, and nothing reaches Crashlytics", async () => {
    state.downloadRegistry["B/other.m4a"] = entry({ relativePath: "B/other.m4a", baniId: 2 });
    global.fetch = jest.fn(async (url, init) => {
      if (url.includes("other")) throw new Error("boom");
      return serve(url, init);
    });
    const r = await run({
      2: {
        short: {
          artists: [...groupsWith().short.artists, { link: `${CDN}/B/other.m4a`, name: "B" }],
        },
      },
    });
    expect(r.replaced).toEqual([]);
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("serialises overlapping runs", async () => {
    const first = run({ 2: groupsWith() });
    const second = run({ 2: groupsWith() });
    const [a, b] = await Promise.all([first, second]);
    expect(a.changed).toBe(false);
    expect(b.changed).toBe(false);
  });
});
