import { logNetworkError } from "@common";
import { getRandomTukk } from "@database";
import { isOnline } from "./connectivity";
import emergencyShabads from "./emergencyShabads.json";

// Random Shabad for the dashboard card (2 lines + translation + ang/raag).
// Fallback chain (so the card always shows something meaningful):
//   1. Online  → BaniDB v2 random shabad (full shabad, fresh each Shuffle).
//   2. Offline → a complete shabad from the bundled emergency list (100 real
//      shabads with ang/raag/shabadId, generated via scripts/buildEmergencyShabads.mjs).
//   3. A random tukk from the on-device gutka DB.
//   4. A hardcoded mock.
const RANDOM_URL = "https://api.banidb.com/v2/random";

const MOCK_SHABAD = {
  lines: ["ਤੂੰ ਮੇਰਾ ਪਿਤਾ ਤੂੰਹੈ ਮੇਰਾ ਮਾਤਾ ॥", "ਤੂੰ ਮੇਰਾ ਬੰਧਪੁ ਤੂੰ ਮੇਰਾ ਭ੍ਰਾਤਾ ॥"],
  translation: "You are my father, You are my mother; You are my kin, You are my brother.",
  raag: "ਰਾਗੁ ਮਾਝ",
  ang: 103,
  shabadId: 246,
  _source: "mock",
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

// Picks a meaningful English translation, skipping title/header verses whose
// translation is just a heading like "Fourth Mehla:" / "Sorat'h, Fifth Mehla:".
const pickTranslation = (verses) => {
  const trs = verses.map((v) => v?.translation?.en?.bdb).filter((t) => t && t.trim());
  const meaningful = trs.find((t) => !t.trim().endsWith(":"));
  return meaningful || trs[0] || "";
};

// A verse is a real line of the shabad (vs. a structural heading like "Salok
// Mehla 4:" or "Sorat'h, Fifth Mehla:") when its English translation isn't
// just a heading ending in ":". Mirrors buildEmergencyShabads.mjs so the
// online and offline-bundled shabads skip the same heading verse.
const isMeaningfulVerse = (v) => {
  const t = v?.translation?.en?.bdb;
  return typeof t === "string" && t.trim() && !t.trim().endsWith(":");
};

// Maps a BaniDB shabad payload to the card shape.
const mapShabad = (data) => {
  const info = data?.shabadInfo ?? {};
  const verses = Array.isArray(data?.verses) ? data.verses : [];
  const good = verses.filter(isMeaningfulVerse);
  const picked = (good.length ? good : verses).slice(0, 2);
  const lines = picked.map((v) => v?.verse?.unicode).filter(Boolean);
  const translation = pickTranslation(verses);
  return {
    lines,
    translation,
    raag: info?.raag?.unicode ?? "",
    ang: info?.pageNo ?? picked[0]?.pageNo ?? verses[0]?.pageNo ?? null,
    shabadId: info?.shabadId ?? null,
    _source: "api",
  };
};

// A complete shabad from the bundled emergency list. Has ang/raag/shabadId, so
// the card renders its full footer (incl. Read Shabad) just like an online shabad.
const pickEmergency = () => {
  const list = emergencyShabads?.shabads;
  if (!Array.isArray(list) || !list.length) return null;
  const e = list[Math.floor(Math.random() * list.length)];
  return { ...e, _source: "emergency" };
};

// A random tukk from the on-device gutka DB. No ang/raag/shabadId exist for
// gutka lines, so the card hides its "Read Shabad" footer for this source.
const localShabad = async (language) => {
  try {
    const tukk = await getRandomTukk(language);
    if (tukk?.gurmukhi) {
      return {
        lines: [tukk.gurmukhi],
        translation: tukk.translation,
        transliteration: tukk.transliteration,
        raag: "",
        ang: null,
        shabadId: null,
        _source: "local",
      };
    }
  } catch (err) {
    logNetworkError(`getRandomTukk failed: ${err?.message || err}`, err);
  }
  return MOCK_SHABAD;
};

export const getRandomShabad = async ({ language } = {}) => {
  // Online-first: full shabad from BaniDB (keeps ang/raag + Read Shabad link).
  // Wrapped so a connectivity-check or fetch failure can never reject — the card
  // always gets a usable shabad from one of the fallbacks below.
  try {
    if (await isOnline()) {
      const data = await fetchJson(RANDOM_URL);
      const mapped = mapShabad(data);
      if (mapped.lines.length) return mapped;
    }
  } catch (err) {
    logNetworkError(`getRandomShabad online failed: ${err?.message || err}`, err);
  }
  // Offline or API failure: a complete shabad from the bundled emergency list,
  // then a random tukk from the gutka DB, then a hardcoded mock.
  return pickEmergency() || localShabad(language);
};

export default getRandomShabad;
