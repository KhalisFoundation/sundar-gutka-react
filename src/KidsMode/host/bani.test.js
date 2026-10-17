import { renderHook, waitFor } from "@testing-library/react-native";
import { setMockState } from "@common/test-utils/mocks/react-redux";
import { fetchManifest } from "@service";
import initDB from "../../database/connect";
import fetchLRCData from "../../ReaderScreen/components/AudioPlayer/utils/fetchLRC";
import { attachTimings, toSections, useBani } from "./bani";

// The shared @common mock has no transliteration languages for the reader's getTranslitText.
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({ constant: { ENGLISH: "ENGLISH", HINDI: "HINDI" } });
});
jest.mock("../../database/connect", () => jest.fn());
jest.mock("@service", () => ({ fetchManifest: jest.fn() }));
jest.mock("../../ReaderScreen/components/AudioPlayer/utils/fetchLRC", () => jest.fn());

const row = (Seq, Paragraph, GurmukhiUni = `line ${Seq}`, Bani = 10) => ({
  Bani,
  Seq,
  Paragraph,
  GurmukhiUni,
  Transliterations: JSON.stringify({ en: `translit ${Seq}`, hi: `hi ${Seq}` }),
  Translations: JSON.stringify({ en: { bdb: `meaning ${Seq}` } }),
});

const serve = (rows) =>
  initDB.mockResolvedValue({
    transaction: (run) =>
      run({
        executeSql: (_sql, _params, ok) =>
          ok(null, { rows: { length: rows.length, item: (i) => rows[i] } }),
      }),
  });

const CDN = "https://cdn.example/audios";
const track = (folder) => ({
  track_url: `${CDN}/${folder}/AnandSahib.m4a`,
  lyrics_url: `${CDN}/${folder}/AnandSahib.json`,
});

describe("toSections", () => {
  it("groups verses by DB paragraph and keeps only the given Seq range", () => {
    const rows = [row(3, 3), row(5, 4), row(6, 4), row(7, 5), row(380, 50)];
    const sections = toSections(rows, "ENGLISH", [5, 378]);
    expect(sections.map((s) => s.number)).toEqual([1, 2]);
    expect(sections[0].lines.map((l) => l.seq)).toEqual([5, 6]);
    expect(sections[0].lines[0]).toEqual({
      seq: 5,
      text: "line 5",
      transliteration: "translit 5",
      translation: "meaning 5",
    });
  });

  it("uses the reader's transliteration language", () => {
    expect(toSections([row(1, 1)], "HINDI")[0].lines[0].transliteration).toBe("hi 1");
  });

  it("cuts an over-long paragraph after each numbered verse", () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      row(i + 1, 1, (i + 1) % 4 === 0 ? `verse ॥${"੧੨੩੪੫੬੭"[i % 7]}॥` : `line ${i + 1}`)
    );
    const sizes = toSections(rows, "ENGLISH").map((s) => s.lines.length);
    expect(sizes).toEqual([4, 4, 4, 4, 4, 4, 4, 2]);
  });
});

describe("attachTimings", () => {
  const sections = [
    { number: 1, lines: [{ seq: 1 }, { seq: 2 }, { seq: 3 }, { seq: 4 }] },
    { number: 2, lines: [{ seq: 5 }, { seq: 6 }] },
  ];

  it("takes each line's range from the lyrics row with its Seq", () => {
    const [first] = attachTimings(sections, [{ sequence: 1, start: 0, end: 2 }]);
    expect(first.lines[0]).toEqual({ seq: 1, start: 0, end: 2, timed: true });
  });

  it("splits the gap between timed neighbours across untimed lines and flags them", () => {
    const lrc = [
      { sequence: 1, start: 0, end: 2 },
      { sequence: 4, start: 8, end: 10 },
      { sequence: 5, start: 10, end: 12 },
    ];
    const [first, second] = attachTimings(sections, lrc);
    expect(first.lines[1]).toEqual({ seq: 2, start: 2, end: 5, timed: false });
    expect(first.lines[2]).toEqual({ seq: 3, start: 5, end: 8, timed: false });
    expect(second.lines[1]).toEqual({ seq: 6, start: 12, end: 12, timed: false });
  });

  it("leaves lines untimed when the reciter has no recording", () => {
    expect(attachTimings(sections, [])[1].lines[0]).toEqual({ seq: 5, timed: false });
  });
});

describe("useBani", () => {
  beforeEach(() => {
    setMockState({ baniLength: "MEDIUM", transliterationLanguage: "ENGLISH" });
    fetchManifest.mockReset();
    fetchLRCData.mockReset();
  });

  it("builds the bani from the DB with the chosen reciter's timings", async () => {
    serve([row(1, 1), row(2, 1), row(3, 2)]);
    fetchManifest.mockResolvedValue({
      data: [track("BhaiJarnailSingh"), track("GianiGurdevSingh")],
    });
    fetchLRCData.mockResolvedValue([
      { sequence: 1, start: 1, end: 2 },
      { sequence: 2, start: 2, end: 3 },
      { sequence: 3, start: 3, end: 4 },
    ]);
    const { result } = renderHook(() => useBani("anand", "ggs"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(fetchManifest).toHaveBeenCalledWith(10);
    expect(fetchLRCData).toHaveBeenCalledWith(`${CDN}/GianiGurdevSingh/AnandSahib.json`);
    expect(result.current).toMatchObject({
      baniId: 10,
      reciter: "ggs",
      trackUrl: `${CDN}/GianiGurdevSingh/AnandSahib.m4a`,
      error: null,
    });
    expect(result.current.pauris.map((p) => p.lines.map((l) => [l.seq, l.start]))).toEqual([
      [
        [1, 1],
        [2, 2],
      ],
      [[3, 3]],
    ]);
  });

  it("falls back to another reciter's recording and says whose it is", async () => {
    serve([row(1, 1, "line", 21)]);
    fetchManifest.mockResolvedValue({ data: [track("BhaiJarnailSingh")] });
    fetchLRCData.mockResolvedValue([{ sequence: 1, start: 1, end: 2 }]);
    const { result } = renderHook(() => useBani("rehras", "ggs"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.reciter).toBe("bjs");
  });

  it("shows the text without timings when the bani has no recording", async () => {
    serve([row(1, 1, "line", 31)]);
    fetchManifest.mockResolvedValue(null);
    const { result } = renderHook(() => useBani("sukhmani", "bjs"));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.trackUrl).toBeNull();
    expect(result.current.pauris[0].lines[0].timed).toBe(false);
  });

  it("reports a token the database does not have", async () => {
    serve([]);
    const { result } = renderHook(() => useBani("missing", "bjs"));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.pauris).toEqual([]);
  });
});
