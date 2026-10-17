import { fetchManifest, scoreRecording, seqsForPauri } from "./client";

jest.mock("@common/constant", () => ({
  KIDS_SCORING_URL: "https://score.example",
  KIDS_SCORING_API_KEY: "test-key",
}));

const opts = { bani: 2, reciter: "bjs", seqs: [5], optedIn: true };

describe("scoreRecording", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("makes no network call when the parent has not opted in", async () => {
    await expect(scoreRecording("/tmp/a.m4a", { ...opts, optedIn: false })).resolves.toEqual({
      status: "opted_out",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps a 200 response onto line scores and words", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: "ok",
        lines: [{ seq: 5, share_like: 0.82, words: [{ idx: 1, state: "check", reasons: [] }] }],
        focus: { seq: 5, idx: 1 },
      }),
    });
    const result = await scoreRecording("/tmp/a.m4a", opts);
    expect(result.lineScores).toEqual([82]);
    expect(result.words).toEqual([{ lineIndex: 0, wordIndex: 1, state: "check", reasons: [] }]);
    expect(result.focus).toEqual({ lineIndex: 0, wordIndex: 1 });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("https://score.example/v1/score");
    expect(init.headers["X-Api-Key"]).toBe("test-key");
    expect(["bani", "reciter", "seqs"].map((field) => init.body.get(field))).toEqual([
      "2",
      "bjs",
      "5",
    ]);
  });

  it("surfaces a 401 as a key error", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, text: async () => "" });
    await expect(scoreRecording("/tmp/a.m4a", opts)).rejects.toThrow("did not accept");
  });
});

describe("seqsForPauri", () => {
  it("reads each line's verse Seq from the loaded bani", () => {
    const pauris = [
      { number: 1, lines: [{ seq: 5 }, { seq: 6 }] },
      { number: 2, lines: [{ seq: 11 }, { seq: 12 }] },
    ];
    expect(seqsForPauri(pauris, 2)).toEqual([11, 12]);
    expect(seqsForPauri(pauris, 3)).toEqual([]);
  });
});

describe("fetchManifest", () => {
  it("fetches and caches each bani's manifest separately", async () => {
    global.fetch = jest.fn(async (url) => ({ ok: true, status: 200, json: async () => ({ url }) }));
    await fetchManifest(10);
    await fetchManifest(10);
    await expect(fetchManifest(2)).resolves.toEqual({
      url: "https://score.example/v1/manifest?bani=2",
    });
    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://score.example/v1/manifest?bani=10",
      "https://score.example/v1/manifest?bani=2",
    ]);
  });
});
