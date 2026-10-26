// The design's Pauri[] for any bani the app ships: text from the app's own database, line
// timings from the chosen reciter's lyrics file, matched by verse Seq as the reader does.
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getBaniLinesByToken } from "@database";
import { fetchManifest } from "@service";
import { getTranslitText } from "../../database/utils";
import fetchLRCData from "../../ReaderScreen/components/AudioPlayer/utils/fetchLRC";
import { reciterForUrl } from "../reciters";

// Japji's journey is numbered by pauri; the Mool Mantar, opening salok and closing salok
// around the 38 pauris are not stops on it.
const SEQ_RANGE = { japji: [5, 378] };

// Japji's longest pauri runs 26 lines. Longer DB paragraphs are runs of short numbered
// stanzas (Jaap Sahib), so they are cut after each verse number.
const MAX_SECTION_LINES = 26;
const VERSE_END = /॥[੦-੯]+॥\s*$/;

const toLine = (row, language) => ({
  seq: row.Seq,
  text: row.GurmukhiUni,
  transliteration: (row.Transliterations && getTranslitText(row.Transliterations, language)) || "",
  translation: JSON.parse(row.Translations || "null")?.en?.bdb || "",
});

const splitAtVerseEnds = (lines) =>
  lines
    .reduce(
      (parts, line) => {
        parts[parts.length - 1].push(line);
        if (VERSE_END.test(line.text)) parts.push([]);
        return parts;
      },
      [[]]
    )
    .filter((part) => part.length);

// Sections follow the DB's Paragraph column, which marks Japji's pauris exactly.
export const toSections = (rows, language, [first, last] = [-Infinity, Infinity]) => {
  const groups = [];
  let paragraph;
  rows.forEach((row) => {
    if (row.Seq < first || row.Seq > last) return;
    if (!groups.length || row.Paragraph !== paragraph) groups.push([]);
    paragraph = row.Paragraph;
    groups[groups.length - 1].push(toLine(row, language));
  });
  return groups
    .flatMap((lines) => (lines.length > MAX_SECTION_LINES ? splitAtVerseEnds(lines) : [lines]))
    .map((lines, i) => ({ number: i + 1, lines }));
};

// A line the recording has no timing for shares the gap between its timed neighbours and is
// flagged `timed: false`; with a neighbour on one side only, its range is empty.
export const attachTimings = (sections, lrc = []) => {
  const bySeq = new Map(lrc.map((row) => [Number(row.sequence), row]));
  const lines = sections.flatMap((section) => section.lines);
  const own = lines.map((line) => bySeq.get(line.seq));
  const before = [];
  own.reduce((last, timing, i) => {
    before[i] = last;
    return timing ? i : last;
  }, -1);
  const after = [];
  own.reduceRight((next, timing, i) => {
    after[i] = next;
    return timing ? i : next;
  }, lines.length);

  const timings = new Map(
    lines.map((line, i) => {
      if (own[i]) return [line, { start: own[i].start, end: own[i].end, timed: true }];
      const from = before[i] >= 0 ? own[before[i]].end : own[after[i]]?.start;
      if (from === undefined) return [line, { timed: false }];
      const to = after[i] < lines.length ? own[after[i]].start : from;
      const step = (to - from) / (after[i] - before[i] - 1);
      const k = i - before[i] - 1;
      return [line, { start: from + step * k, end: from + step * (k + 1), timed: false }];
    })
  );
  return sections.map((section) => ({
    ...section,
    lines: section.lines.map((line) => ({ ...line, ...timings.get(line) })),
  }));
};

const loadText = async (token, length, language) => {
  const rows = await getBaniLinesByToken(token, length);
  if (!rows.length) throw new Error(`No bani "${token}" in the database.`);
  return { baniId: rows[0].Bani, sections: toSections(rows, language, SEQ_RANGE[token]) };
};

// Without a recording by the chosen reciter for this bani, another known reciter's is used,
// and `reciter` says whose, so scoring compares against the voice the child heard. A track
// by a reciter the scorer has no reference for is left out rather than mislabelled.
const loadTiming = async (baniId, wanted) => {
  const tracks = (await fetchManifest(baniId))?.data ?? [];
  const known = tracks.filter((t) => reciterForUrl(t.track_url));
  const track = known.find((t) => reciterForUrl(t.track_url).key === wanted) ?? known[0];
  const lrc = track?.lyrics_url ? await fetchLRCData(track.lyrics_url) : null;
  return {
    track: track ?? null,
    reciter: reciterForUrl(track?.track_url)?.key ?? wanted,
    lrc: Array.isArray(lrc) ? lrc : [],
  };
};

// Kept for the session so switching back to a bani renders without waiting on the DB.
const texts = new Map();
const timings = new Map();

export const useBani = (token, reciter) => {
  const length = useSelector((state) => state.baniLength);
  const language = useSelector((state) => state.transliterationLanguage);
  const [loaded, setLoaded] = useState({});
  const [error, setError] = useState(null);

  const textKey = `${token}|${length}|${language}`;
  const text = texts.get(textKey) ?? loaded[textKey];
  const timingKey = text ? `${text.baniId}|${reciter}` : null;
  const timing = timingKey ? timings.get(timingKey) ?? loaded[timingKey] : undefined;

  useEffect(() => {
    if (text) return undefined;
    let live = true;
    setError(null);
    loadText(token, length, language)
      .then((value) => {
        texts.set(textKey, value);
        if (live) setLoaded((all) => ({ ...all, [textKey]: value }));
      })
      .catch((caught) => live && setError(caught));
    return () => {
      live = false;
    };
  }, [text, textKey, token, length, language]);

  useEffect(() => {
    if (!text || timing) return undefined;
    let live = true;
    loadTiming(text.baniId, reciter)
      .catch(() => ({ track: null, reciter, lrc: [] }))
      .then((value) => {
        // A miss is not cached, so the next visit asks the manifest again.
        if (value.track) timings.set(timingKey, value);
        if (live) setLoaded((all) => ({ ...all, [timingKey]: value }));
      });
    return () => {
      live = false;
    };
  }, [text, timing, timingKey, reciter]);

  const pauris = useMemo(
    () => (text ? attachTimings(text.sections, timing?.lrc) : []),
    [text, timing]
  );

  return {
    pauris,
    baniId: text?.baniId ?? null,
    trackUrl: timing?.track?.track_url ?? null,
    reciter: timing?.reciter ?? reciter,
    ready: Boolean(text && timing),
    error,
  };
};
