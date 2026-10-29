import { constant, logNetworkError } from "@common";
import { isOnline, OfflineError } from "./connectivity";
import { readFreshCache, writeCache } from "./dailyCache";
import { UnavailableError } from "./dataFailures";

// Persist today's vaak so it stays available offline for the same IST day.
// Keyed by the IST date (see istParts) — the official Sri Darbar Sahib Hukamnama
// rolls over at Amritsar (IST) midnight, so the vaak must follow IST, not the
// device timezone. v3: IST-dated fetch + IST cache key + dateLabel.
//
// v4 evicts rather than changes shape. Entries written before the staleness
// check existed hold YESTERDAY's shabad relabelled as today's, and nothing can
// dislodge one: the read below short-circuits ahead of every network call, and
// an app update keeps AsyncStorage, so shipping the fix alone left an affected
// user on the same wrong hukamnama until IST midnight — reinstalling to clear
// app data was the only cure, which is what they were reduced to. A new key is
// read as a miss, so the first launch on this build refetches once and the
// poisoned entry is never read again.
const CACHE_KEY = "@daily_vaak_cache_v4";

// How long a vaak taken from the secondary backend stays cached. Long enough to
// spare a refetch on every Dashboard mount, short enough that BaniDB publishing
// mid-morning is picked up the same day.
const FALLBACK_CACHE_MS = 30 * 60 * 1000;

// Current wall-clock date in IST (UTC+5:30, no DST).
//
// Derived from the device's absolute clock, NOT its timezone: the hukamnama
// rolls over at Amritsar, so a reader in Vancouver and one in Delhi are looking
// at the same shabad on the same day. The user's own date never decides which
// vaak is fetched — only which date string is printed alongside it.
const istParts = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000; // local → UTC
  const ist = new Date(utcMs + 5.5 * 3600000); // UTC → IST
  return { y: ist.getFullYear(), m: ist.getMonth() + 1, d: ist.getDate(), wd: ist.getDay() };
};
// Exported so the card can tell whether what it is showing is today's or a
// stand-in, without re-implementing the IST shift and drifting from it.
export const istDateKey = () => {
  const { y, m, d } = istParts();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

// Shifts a YYYY-MM-DD by whole days. Local-time constructor, so month, year and
// leap-day rollover are handled for us.
const shiftDay = (dateKey, deltaDays) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const day = new Date(y, m - 1, d + deltaDays);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
    day.getDate()
  ).padStart(2, "0")}`;
};

// Today's Vaak — the official daily Hukamnama from Sri Darbar Sahib, shown exactly
// as on https://www.sikhitothemax.org/hukamnama. SikhiToTheMax is powered by
// BaniDB, so we read BaniDB directly as the source of truth. We request the
// hukamnama for the explicit IST date (not /today, whose meaning depends on the
// caller's clock) so every user worldwide sees the right day's vaak. The
// configured backend is only a secondary fallback if BaniDB is unreachable.
//
// Only when both sources fail (or offline) does this throw, and the card shows an
// offline notice rather than presenting placeholder lines as the official vaak.
// Built from the vaak day, not the calendar day, so before the cutover it asks
// for the hukamnama that exists rather than the one that does not yet.
const baniDbUrl = (dateKey) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return `https://api.banidb.com/v2/hukamnamas/${y}/${m}/${d}`;
};
const backendUrl = () => constant.DAILY_VAAK_API_URL || "";

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      // Status carried on the error: a 404 for a day is an ANSWER ("no
      // hukamnama for that date"), not a fault, and must not be reported as one.
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * The IST day a payload says it is for, or null when it does not say.
 *
 * Two shapes: our backend returns a plain `date: "YYYY-MM-DD"` string, BaniDB
 * returns `date.gregorian: { year, month, date }`. Anything else is unknown
 * rather than wrong, and is judged on its own below.
 */
const payloadDateKey = (data) => {
  const flat = data?.date;
  if (typeof flat === "string" && /^\d{4}-\d{2}-\d{2}$/.test(flat)) return flat;
  const g = typeof flat === "object" ? flat?.gregorian : null;
  if (g?.year && g?.month && g?.date) {
    return `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.date).padStart(2, "0")}`;
  }
  return null;
};

/**
 * True when the payload is for a DIFFERENT day than the one we asked for.
 *
 * This is the whole bug. Both mappers used to stamp `istDate: istDateKey()`
 * onto whatever came back, so a source still serving yesterday's shabad — which
 * BaniDB does until the new hukamnama is published — was relabelled as today's
 * and then cached under today's key. The card stayed a day behind until IST
 * midnight, because the cache short-circuits before any network call, while the
 * "Read Hukamnama" button (a hardcoded link to the live STTM page) showed the
 * real one. That mismatch is what made it obvious.
 *
 * A payload that carries no date at all is NOT rejected: BaniDB is asked for an
 * explicit date in the URL, so an undated answer is still an answer to that
 * question. Only a stated, contradicting date is disqualifying.
 */
const isForAnotherDay = (data, dateKey) => {
  const stamped = payloadDateKey(data);
  return !!stamped && stamped !== dateKey;
};

// Picks the first meaningful translation (skips title/header verses whose
// translation is just a heading ending in ":", e.g. "Fourth Mehla:").
const pickTranslation = (translations) => {
  const trs = (translations || []).filter((t) => t && t.trim());
  return trs.find((t) => !t.trim().endsWith(":")) || trs[0] || "";
};

// A verse is a real line of the hukamnama (vs. a structural heading like
// "Fourth Mehla:" or "Sorat'h, Fifth Mehla:") when its English translation
// isn't just a heading ending in ":". Mirrors randomShabad.js's
// isMeaningfulVerse — the heading isn't reliably always verse[0], so this
// content-based check replaces the card's old fixed-index slice(1, 3).
const isMeaningfulVerse = (v) => {
  const t = v?.translation?.en?.bdb;
  return typeof t === "string" && t.trim() && !t.trim().endsWith(":");
};

// Maps a raw BaniDB hukamnama payload ({ shabads: [{ shabadInfo, verses }] }).
// Picks the first 2 non-heading verses — the card only ever shows a 2-line
// preview (with a "Read Hukamnama" link out to the full page), so there's no
// need to carry the rest.
const fromBaniDb = (data, dateKey = istDateKey()) => {
  if (isForAnotherDay(data, dateKey)) return null;
  const shabad = data?.shabads?.[0];
  const info = shabad?.shabadInfo ?? {};
  const verses = Array.isArray(shabad?.verses) ? shabad.verses : [];
  const good = verses.filter(isMeaningfulVerse);
  const picked = (good.length ? good : verses).slice(0, 2);
  const lines = picked.map((v) => v?.verse?.unicode).filter(Boolean);
  if (!lines.length) return null;
  return {
    lines,
    translation: pickTranslation(verses.map((v) => v?.translation?.en?.bdb)),
    raag: info?.raag?.unicode ?? "",
    ang: info?.pageNo ?? picked[0]?.pageNo ?? verses[0]?.pageNo ?? null,
    shabadId: info?.shabadId ?? null,
    source: "Sri Darbar Sahib",
    istDate: dateKey,
    _source: "banidb",
  };
};

// Accepts our backend's clean shape ({ lines, translation, ... }) or a raw BaniDB
// payload. Used for the secondary backend fallback only.
const parseVaak = (data, dateKey = istDateKey()) => {
  // Rejected outright when the backend names a different day. It proxies the
  // same BaniDB, so when BaniDB has not published yet the backend answers with
  // yesterday's shabad and says so in `date` — that field is the only way to
  // tell, and it is why we deliberately DO NOT send `?date=` to the backend:
  // it echoes the requested date back unvalidated, which would erase the very
  // evidence this check depends on.
  if (isForAnotherDay(data, dateKey)) return null;
  if (Array.isArray(data?.lines) && data.lines.length) {
    return {
      lines: data.lines,
      translation: data.translation ?? "",
      raag: data.raag ?? "",
      ang: data.ang ?? null,
      shabadId: data.shabadId ?? null,
      source: data.source ?? "Sri Darbar Sahib",
      istDate: dateKey,
      _source: "api",
    };
  }
  return fromBaniDb(data, dateKey);
};

// BaniDB for one named day. Returns null when that day has no hukamnama yet,
// which is an answer rather than a failure and is not reported as one.
const baniDbForDay = async (dateKey) => {
  try {
    return fromBaniDb(await fetchJson(baniDbUrl(dateKey)), dateKey);
  } catch (err) {
    if (err?.status !== 404) {
      logNetworkError(`daily vaak BaniDB failed: ${err?.message || err}`, err);
    }
    return null;
  }
};

/**
 * The most recent hukamnama there is.
 *
 * Deliberately NOT decided from a clock. The darbar reads the day's first
 * hukamnama around 05:00–05:30 IST, but that time moves with the Punjabi
 * months, publication lags it by an unknown amount, and any fixed cutover we
 * picked would be wrong on one side of it — too early and we ask for a day that
 * does not exist, too late and we sit on yesterday's for hours after the new
 * one is out. So we simply ask for the newest day first and fall back: whatever
 * exists is what the user gets, the moment it exists.
 *
 * The user's own timezone never enters into it. The hukamnama rolls over at
 * Amritsar, so Vancouver and Delhi see the same shabad; IST decides the day,
 * and the card prints that day's date next to it.
 */
export const getDailyVaak = async ({ requireOnline = false, force = false } = {}) => {
  const today = istDateKey();
  const previous = shiftDay(today, -1);

  // 1. Cache. An entry for today is final — nothing newer can exist — while an
  //    entry for the previous day is only the best we had, and is written with
  //    a short life so the next read looks again for today's.
  //
  //    `force` is the manual refresh button, and it must skip this: the point
  //    of asking is that the user believes what is on screen is not the latest,
  //    and a control that re-reads the cache would agree with itself every time
  //    and look broken.
  if (!force) {
    const cached =
      (await readFreshCache(CACHE_KEY, today)) ?? (await readFreshCache(CACHE_KEY, previous));
    if (cached) return cached;
  }

  // 2. No fresh cache. If offline, surface it — we never present a previous
  //    day's vaak as today's official hukamnama.
  if (requireOnline && !(await isOnline())) {
    throw new OfflineError();
  }

  // 3. Newest first, then the day before. BaniDB is the source of truth — the
  //    exact one the STTM hukamnama page reads.
  let mapped = await baniDbForDay(today);
  if (!mapped) mapped = await baniDbForDay(previous);

  // 4. Secondary fallback: the configured backend, only if BaniDB was
  //    unreachable for both. It takes no date (see parseVaak), so it is judged
  //    by the day it names — either of the two is acceptable, anything else is
  //    a stale answer and is refused.
  if (!mapped && backendUrl()) {
    try {
      const data = await fetchJson(backendUrl());
      const named = payloadDateKey(data);
      // An UNDATED payload is accepted but makes no claim about which day it is
      // for — with two acceptable days there is nothing to check it against, so
      // it is carried with a null date and the card simply prints no date line.
      // Silence is better than a guess: asserting the wrong day is the bug this
      // whole path exists to prevent.
      if (!named || named === today || named === previous) mapped = parseVaak(data, named);
    } catch (err) {
      logNetworkError(`daily vaak backend fallback failed: ${err?.message || err}`, err);
    }
  }

  if (!mapped) throw new UnavailableError("daily vaak unavailable");

  // Today's from BaniDB is final and keeps for the day. Anything else — the
  // previous day, or the secondary source — gets a short life, so the card
  // upgrades to the real thing as soon as it is published instead of being
  // pinned to a stand-in until tomorrow.
  // eslint-disable-next-line no-underscore-dangle -- the mappers' own marker
  const isFinal = mapped.istDate === today && mapped._source === "banidb";
  // An undated answer is filed under today so it is not re-fetched on every
  // mount, but only for the short life every stand-in gets.
  writeCache(CACHE_KEY, mapped, mapped.istDate ?? today, {
    ttlMs: isFinal ? undefined : FALLBACK_CACHE_MS,
  }); // best-effort
  return mapped;
};

export default getDailyVaak;
