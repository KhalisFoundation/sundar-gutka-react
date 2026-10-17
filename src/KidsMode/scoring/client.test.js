import { scoreRecording } from "./client";

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
  });

  it("surfaces a 401 as a key error", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, text: async () => "" });
    await expect(scoreRecording("/tmp/a.m4a", opts)).rejects.toThrow("did not accept");
  });
});
