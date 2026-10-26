/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.












/** `stars` comes from the service's bands when it scored the line. */


// Preserve whitespace, Gurmukhi combining marks and verse markers verbatim.
// start/end are UTF-16 offsets into the unchanged source line, end exclusive.
export function tokenizeLine(text) {
  let offset = 0;
  return text.split(/(\s+|[॥।੦-੯0-9]+)/u).filter(Boolean).map((part) => {
    const start = offset;offset += part.length;
    return { text: part, start, end: offset, word: /\p{L}/u.test(part) };
  });
}

// Display fixtures only. The average stays equal to the displayed line score.
function sampleScores(score, count, lineIndex) {
  if (!count) return [];
  const values = Array.from({ length: count }, (_, i) => Math.max(0, Math.min(100, score + (score >= 95 ? 0 : (i + lineIndex) % 3 === 0 ? -24 : 12))));
  let remaining = score * count - values.reduce((a, b) => a + b, 0);
  while (remaining !== 0) {
    for (let i = 0; i < count && remaining !== 0; i++) {
      const step = Math.sign(remaining);
      if (values[i] + step >= 0 && values[i] + step <= 100) {values[i] += step;remaining -= step;}
    }
  }
  return values;
}
export function sampleWordReview(pauri, lineScores) {
  return pauri.lines.map((line, lineIndex) => {
    const parts = tokenizeLine(line.text);
    const score = lineScores[lineIndex];
    const scores = sampleScores(score, parts.filter((p) => p.word).length, lineIndex);
    let wordIndex = 0;
    const tokens = parts.map((part) => {
      if (!part.word) return { kind: 'separator', text: part.text };
      const index = wordIndex++;
      return { kind: 'word', text: part.text, feedback: { id: `${lineIndex}:${index}`, text: part.text, lineIndex, wordIndex: index, start: part.start, end: part.end, score: scores[index], focus: index % 3 === 0 ? 'ending' : index % 3 === 1 ? 'beginning' : 'whole-word' } };
    });
    return { text: line.text, score, tokens };
  });
}
/**
 * What the child reads when they tap a word.
 *
 * Written for a five-year-old: one short sentence at a time, words they
 * already know, and the word itself named so the advice is concrete. No
 * "reference", no "pronunciation", no instruction longer than a breath.
 */
export function practicePrompt(word) {
  const tip =
  word.focus === 'ending' ?
  `Listen to the end of ${word.text}. Then say it slowly.` :
  word.focus === 'beginning' ?
  `Listen to how ${word.text} starts. Then say it slowly.` :
  `Listen to ${word.text}. Then say it the same way.`;
  return {
    title: word.score < 80 ? `Let\u2019s try ${word.text} again` : `You said ${word.text} well!`,
    tip,
    steps: ['Listen to the word.', 'Say it out loud.', 'Now say the whole line.']
  };
}
