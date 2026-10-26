import { constant, logNetworkError } from "@common";
import { readFreshCache, writeCache } from "./dailyCache";

// The Nanakshahi date shown under the Fateh on the Dashboard.
//
// It comes from our backend, which proxies the SGPC-sourced calendar at
// api.gurpurab.com — the same authority the gurpurab list follows. That matters
// because the app used to compute this locally with the `nanakshahi` package,
// which implements the ORIGINAL 2003 calendar: it begins Bhadon on 16 August
// where SGPC begins it on the 17th, so the header read one day ahead of the
// gurpurab dates sitting directly beneath it. One source now answers both, and
// a correction upstream reaches users without an app release.
//
// Resolution is: today's cache -> our backend -> the bundled table below.

const CACHE_KEY = "@nanakshahi_date_cache_v1";

// Gregorian start of each Nanakshahi month, taken from the same calendar the
// backend serves (queried per month at /v1/ns/558/:month/1). Used only when the
// network is gone AND nothing is cached for today.
//
// These are NOT stable year to year — SGPC reckons the months sidereally, so
// the starts drift a day: Magh began 13 Jan in 2026 and begins 14 Jan in 2027.
// The NS 558 values are used, matching the gurpurab table, and like it they
// want refreshing once the next Samat is published. Being a day out in the
// offline fallback is a far smaller thing than the card being blank, which is
// why this exists at all.
const FALLBACK_MONTHS = [
  { name: "Chet", gurmukhi: "ਚੇਤ", startMonth: 3, startDay: 14 },
  { name: "Vaisakh", gurmukhi: "ਵੈਸਾਖ", startMonth: 4, startDay: 14 },
  { name: "Jeth", gurmukhi: "ਜੇਠ", startMonth: 5, startDay: 15 },
  { name: "Harh", gurmukhi: "ਹਾੜ", startMonth: 6, startDay: 15 },
  { name: "Sawan", gurmukhi: "ਸਾਵਣ", startMonth: 7, startDay: 16 },
  { name: "Bhadon", gurmukhi: "ਭਾਦੋਂ", startMonth: 8, startDay: 17 },
  { name: "Assu", gurmukhi: "ਅੱਸੂ", startMonth: 9, startDay: 17 },
  { name: "Katik", gurmukhi: "ਕੱਤਕ", startMonth: 10, startDay: 17 },
  { name: "Maghar", gurmukhi: "ਮੱਘਰ", startMonth: 11, startDay: 16 },
  { name: "Poh", gurmukhi: "ਪੋਹ", startMonth: 12, startDay: 16 },
  { name: "Magh", gurmukhi: "ਮਾਘ", startMonth: 1, startDay: 14 },
  { name: "Phagun", gurmukhi: "ਫੱਗਣ", startMonth: 2, startDay: 13 },
];

const startOf = (month, year) => new Date(year, month.startMonth - 1, month.startDay);

/**
 * The bundled computation. SYNCHRONOUS on purpose: the header needs something
 * to print on its very first frame, and an empty date line that fills in a
 * moment later reads as a bug. The remote value replaces it when it arrives.
 */
export const getNanakshahiDate = (date = new Date()) => {
  const year = date.getFullYear();
  // The latest month start that is not in the future. Months whose start falls
  // in Jan/Feb belong to the Nanakshahi year that began the previous March, so
  // a date in early January is still in the PREVIOUS Gregorian year's Poh —
  // hence the look-back rather than a plain scan of this year's starts.
  let current = null;
  let currentStart = null;
  FALLBACK_MONTHS.forEach((m) => {
    [year - 1, year].forEach((y) => {
      const start = startOf(m, y);
      if (start <= date && (!currentStart || start > currentStart)) {
        current = m;
        currentStart = start;
      }
    });
  });
  // Only reachable if `date` precedes every start we know, which the look-back
  // above makes impossible in practice; kept so the header cannot crash.
  if (!current) {
    current = FALLBACK_MONTHS[0];
    currentStart = startOf(current, year);
  }
  const day = Math.floor((date - currentStart) / 86400000) + 1;
  const d = day > 0 ? day : 1;
  return {
    day: d,
    monthName: current.name,
    monthGurmukhi: current.gurmukhi,
    label: `${d} ${current.name} (${current.gurmukhi})`,
    _source: "local",
  };
};

/**
 * The real value, from our backend. Resolves to null rather than throwing when
 * there is nothing better than the bundled table to show — the header treats a
 * null as "keep what you have", so an outage costs nothing visible.
 */
export const fetchNanakshahiDate = async () => {
  const cached = await readFreshCache(CACHE_KEY);
  if (cached) return cached;

  const url = constant.NANAKSHAHI_DATE_API_URL;
  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // A 200 is not the same as an answer — see the backend's mapDate for why
    // this source has to be checked rather than trusted.
    if (!data?.label) return null;
    const value = { ...data, _source: "api" };
    writeCache(CACHE_KEY, value);
    return value;
  } catch (err) {
    logNetworkError(`fetchNanakshahiDate failed, keeping bundled: ${err?.message || err}`, err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default getNanakshahiDate;
