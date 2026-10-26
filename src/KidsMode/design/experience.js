/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
import { parseWardrobe } from './wardrobe';








export function freshExperience() {
  return { version: 1, kids: false, night: false, meaning: true, illustrations: true, textSize: 27, character: 'prem', started: false,
    progress: { coins: 0, best: {} }, selected: 1, region: 0, attempts: [] };
}
function record(value) {return typeof value === 'object' && value !== null && !Array.isArray(value);}
function bounded(value, min, max) {return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;}
// Browser storage is untrusted. Build a new typed snapshot only from checked fields.
export function parseExperience(value) {
  if (!record(value) || value.version !== 1 || !record(value.progress)) return null;
  const p = value.progress;
  const wardrobe = p.wardrobe === undefined ? undefined : parseWardrobe(p.wardrobe);
  if (wardrobe === null || !bounded(p.coins, 0, 1140) || !record(p.best)) return null;
  // Retired frame fields are ignored while earned coins and stars are retained.
  const best = {};
  for (const [key, stars] of Object.entries(p.best)) {
    if (!/^[1-9][0-9]*$/.test(key) || !bounded(Number(key), 1, 38) || !(stars === 0 || stars === 1 || stars === 2 || stars === 3)) return null;
    best[key] = stars;
  }
  if (typeof value.kids !== 'boolean' || typeof value.night !== 'boolean' || typeof value.meaning !== 'boolean' || typeof value.started !== 'boolean') return null;
  if (value.illustrations !== undefined && typeof value.illustrations !== 'boolean') return null;
  if (value.character !== 'prem' && value.character !== 'sehaj') return null;
  if (!bounded(value.textSize, 21, 35) || !bounded(value.selected, 1, 38) || !bounded(value.region, 0, 5) || !Array.isArray(value.attempts)) return null;
  const attempts = [];
  for (const a of value.attempts.slice(0, 50)) {
    if (!record(a) || !bounded(a.pauri, 1, 38) || !bounded(a.score, 0, 100) || !bounded(a.at, 0, Number.MAX_SAFE_INTEGER)) return null;
    attempts.push({ pauri: a.pauri, score: a.score, at: a.at });
  }
  return { version: 1, kids: value.kids, night: value.night, meaning: value.meaning, illustrations: value.illustrations ?? true, textSize: value.textSize, character: value.character,
    started: value.started, selected: value.selected, region: value.region, progress: { coins: p.coins, best, ...(wardrobe ? { wardrobe } : {}) }, attempts };
}
