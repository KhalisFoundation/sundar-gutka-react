/* eslint-env jest */

// Use the real constant module (pure, no RN deps) so length-variant handling
// and AUDIO_API_BASE match production exactly.
jest.mock("@common", () => ({
  constant: jest.requireActual("@common/constant").default,
}));

import { selectTracksForBani, fetchRawBaniAudio, fetchManifest } from "./audioApi";

const constant = jest.requireActual("@common/constant").default;

// Mirrors the real GET /audios/:baniId response shape.
const artist = (over = {}) => ({
  artistId: 4,
  name: "Bhai Jarnail Singh",
  trackId: 1002,
  link: "https://cdn.example.net/audios/BhaiJarnailSingh/JapjiSahib.m4a",
  lyricsUrl: "https://cdn.example.net/audios/BhaiJarnailSingh/japji-sahib.json",
  durationSeconds: 985.5,
  sizeMb: 15.39,
  ...over,
});

describe("selectTracksForBani", () => {
  it("returns [] for null / non-object groups", () => {
    expect(selectTracksForBani(null, 2, constant.LONG)).toEqual([]);
    expect(selectTracksForBani(undefined, 2, constant.LONG)).toEqual([]);
    expect(selectTracksForBani("nope", 2, constant.LONG)).toEqual([]);
  });

  it("non-variant bani: unions all length groups and dedupes by trackId", () => {
    // A non-variant bani (e.g. Japji, id 2) returns identical artists in every
    // group. Union + dedupe should surface each reciter exactly once.
    const jarnail = artist();
    const indermohan = artist({ artistId: 8, name: "Bibi Indermohan Kaur", trackId: 2002 });
    const groups = {
      short: { artists: [jarnail, indermohan] },
      medium: { artists: [jarnail, indermohan] },
      long: { artists: [jarnail, indermohan] },
    };

    const tracks = selectTracksForBani(groups, 2, constant.LONG);
    expect(tracks).toHaveLength(2);
    expect(tracks.map((t) => t.track_id).sort()).toEqual([1002, 2002]);
    expect(tracks[0]).toMatchObject({
      bani_id: 2,
      track_id: 1002,
      track_url: jarnail.link,
      lyrics_url: jarnail.lyricsUrl,
      track_length_seconds: 985.5,
      track_size_mb: 15.39,
      artist_name: "Bhai Jarnail Singh",
      artist_id: 4,
    });
  });

  it("variant bani: selects strictly the group matching the length", () => {
    // Chaupai Sahib (id 9) is length-variant: short = Indermohan only,
    // long = Jarnail + Gurdev.
    const indermohan = artist({ artistId: 8, name: "Bibi Indermohan Kaur", trackId: 2009 });
    const jarnail = artist({ trackId: 1009 });
    const gurdev = artist({ artistId: 9, name: "Giani Gurdev Singh", trackId: 3009 });
    const groups = {
      short: { artists: [indermohan] },
      medium: { artists: [indermohan] },
      long: { artists: [jarnail, gurdev] },
    };

    const shortTracks = selectTracksForBani(groups, 9, constant.SHORT);
    expect(shortTracks.map((t) => t.track_id)).toEqual([2009]);

    const longTracks = selectTracksForBani(groups, 9, constant.LONG);
    expect(longTracks.map((t) => t.track_id).sort()).toEqual([1009, 3009]);
  });

  it("variant bani: EXTRA_LONG has no server group → empty (maafi)", () => {
    const groups = { short: { artists: [artist({ trackId: 2009 })] } };
    expect(selectTracksForBani(groups, 9, constant.EXTRA_LONG)).toEqual([]);
  });

  it("drops entries without a playable link", () => {
    const groups = {
      long: { artists: [artist(), artist({ trackId: 9999, link: null })] },
    };
    const tracks = selectTracksForBani(groups, 2, constant.LONG);
    expect(tracks).toHaveLength(1);
    expect(tracks[0].track_id).toBe(1002);
  });

  it("confirms the length-variant id set it relies on", () => {
    expect(constant.BANI_IDS_WITH_LENGTH_VARIANTS).toEqual([9, 21, 23]);
  });
});

describe("fetchRawBaniAudio", () => {
  const groups = { long: { artists: [artist()] } };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns { baniId, baniName, groups } on a 200", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ baaniName: "Japji Sahib", data: groups }),
      })
    );

    const raw = await fetchRawBaniAudio(2);
    expect(raw).toEqual({ baniId: 2, baniName: "Japji Sahib", groups });
    expect(global.fetch).toHaveBeenCalledWith(
      `${constant.AUDIO_API_BASE}/2`,
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("returns null on a 404 (bani without audio)", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));
    expect(await fetchRawBaniAudio(1)).toBeNull();
  });

  it("returns null when the payload has no data object", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ baaniName: "x" }) })
    );
    expect(await fetchRawBaniAudio(2)).toBeNull();
  });

  it("returns null (never throws) on a network error", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("offline")));
    await expect(fetchRawBaniAudio(2)).resolves.toBeNull();
  });
});

describe("fetchManifest", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns { status, data } with the selected tracks", async () => {
    const groups = { long: { artists: [artist()] } };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ baaniName: "Japji", data: groups }) })
    );
    const manifest = await fetchManifest(2, constant.LONG);
    expect(manifest.status).toBe("success");
    expect(manifest.data).toHaveLength(1);
    expect(manifest.data[0].track_id).toBe(1002);
  });

  it("returns null when the bani has no audio", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));
    expect(await fetchManifest(1, constant.LONG)).toBeNull();
  });

  it("returns an empty-but-valid manifest for a missing length group", async () => {
    // Variant bani, EXTRA_LONG → no group → { data: [] } (not null) so the reader
    // can show the length-specific message instead of a network error.
    const groups = { short: { artists: [artist({ trackId: 2009 })] } };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ baaniName: "Chaupai", data: groups }) })
    );
    const manifest = await fetchManifest(9, constant.EXTRA_LONG);
    expect(manifest).toEqual({ status: "success", data: [] });
  });
});
