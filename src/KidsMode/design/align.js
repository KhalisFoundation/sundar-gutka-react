/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
/**
 * Turning raw scores into what the review screen renders.
 *
 * The UI consumes ReviewedLine[] from wordFeedback.ts, whose `sampleWordReview`
 * is explicitly a display fixture. This builds the same shape from real scores,
 * reusing the same tokenizer so word offsets line up with the source text
 * exactly — the review screen relies on those offsets to highlight words.
 */

import {
  tokenizeLine } from


'./wordFeedback';


/** Below this a word is shown as needing practice. Calibrate against ustaad judgement. */
export const PRACTICE_THRESHOLD = 80;

/**
 * Pick the practice hint for a word. Until the scorer reports *where* in the
 * word the problem lies, this stays 'whole-word' rather than inventing a
 * position the data does not support.
 */
function focusFor() {
  return 'whole-word';
}

/**
 * Build the review rows for one pauri.
 *
 * A word with no score from the provider is left at the line's score rather
 * than defaulting to zero — a missing measurement is not a failed word.
 */
export function toReviewedLines(
lines,
response)
{
  const byWord = new Map();
  for (const word of response.words) {
    byWord.set(`${word.lineIndex}:${word.wordIndex}`, word);
  }
  const focus = response.focus ?
  `${response.focus.lineIndex}:${response.focus.wordIndex}` :
  null;

  return lines.map((line, lineIndex) => {
    const lineScore = response.lineScores[lineIndex] ?? 0;
    const parts = tokenizeLine(line.text);
    let wordIndex = 0;

    const tokens = parts.map((part) => {
      if (!part.word) return { kind: 'separator', text: part.text };

      const index = wordIndex++;
      const id = `${lineIndex}:${index}`;
      const scored = byWord.get(id);
      return {
        kind: 'word',
        text: part.text,
        feedback: {
          id,
          text: part.text,
          lineIndex,
          wordIndex: index,
          start: part.start,
          end: part.end,
          score: scored?.score ?? lineScore,
          focus: focusFor(),
          ...(scored?.state ?
          { state: scored.state, reasons: scored.reasons ?? [], practise: id === focus } :
          {})
        }
      };
    });

    return { text: line.text, score: lineScore, tokens };
  });
}
