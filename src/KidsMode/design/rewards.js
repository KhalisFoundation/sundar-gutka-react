/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.


export function starsForScore(score) {
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Score must be between 0 and 100');
  return score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
}
export function coinAward(previous, next) {
  return Math.max(0, next - previous) * 10;
}

export const initialProgress = { coins: 0, best: {} };
export function completePauri(progress, pauri, score) {
  const next = starsForScore(score);
  const previous = progress.best[String(pauri)] ?? 0;
  return { ...progress, coins: progress.coins + coinAward(previous, next), best: { ...progress.best, [pauri]: next > previous ? next : previous } };
}
