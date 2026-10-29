import { constant, logError, logNetworkError } from "@common";
import { isOnline, OfflineError } from "./connectivity";
import { readFreshCache, writeCache } from "./dailyCache";

// Backend feed cache (per local day — the event list is stable, and daysAway is
// computed relative to "today", so a same-day cache is always correct).
const CACHE_KEY = "@upcoming_events_cache_v1";

// Sikh Gurpurabs and celebrations for the Discover "Upcoming" card — the
// offline mirror of the backend's /dashboard/events feed. Keep the two in sync:
// the canonical copy is gurpurabs.data.ts in khalis-users-api, and this list is
// what users see when that feed is unreachable.
//
// Source of truth is the SGPC calendar as published by SikhNet
// (https://sikhnet.com/pages/sikh-gurpurab-calendar), Nanakshahi Samat 558.
// Scope is Guru events plus celebrations; non-Guru births/martyrdoms, purely
// historical days and political events are deliberately not listed.
//
// `subtitle` is the Nanakshahi date, which is also what distinguishes the two
// same-named Foundation Stone entries.
//
// These are NOT stable Gregorian dates — SGPC reckons the solar months
// sidereally, so they drift a day between years, and the `nanakshahi` package
// implements the older 2003 calendar instead (it puts Parkash Guru Nanak Dev Ji
// and Bandi Chhor one day earlier than SGPC does). That is why the movable
// gurpurabs are listed here too rather than computed. Refresh from the URL above
// once the next Samat's calendar is published; see SAMAT_VALID_THROUGH below.
const GURPURABS = [
  {
    name: "Foundation Stone of Sachkhand Sri Harimandir Sahib",
    month: 1,
    day: 14,
    subtitle: "01 Magh",
  },
  {
    name: "Jorh Mela Sri Muktsar Sahib (Maaghi)",
    month: 1,
    day: 14,
    subtitle: "01 Magh",
  },
  {
    name: "Prakash Guru Gobind Singh Sahib Ji",
    month: 1,
    day: 15,
    subtitle: "02 Magh",
  },
  {
    name: "Marriage of Guru Gobind Singh Ji & Mata Jito Ji",
    month: 2,
    day: 11,
    subtitle: "29 Magh",
  },
  { name: "Nanakshahi New Year", month: 3, day: 14, subtitle: "01 Chet" },
  {
    name: "Gurgaddi Guru Har Rai Sahib Ji",
    month: 3,
    day: 17,
    subtitle: "04 Chet",
  },
  {
    name: "Gurgaddi Guru Amar Das Sahib Ji",
    month: 3,
    day: 19,
    subtitle: "06 Chet",
  },
  {
    name: "Joti Jot Guru Angad Dev Ji",
    month: 3,
    day: 22,
    subtitle: "09 Chet",
  },
  {
    name: "Joti Jot Guru Hargobind Sahib Ji",
    month: 3,
    day: 23,
    subtitle: "10 Chet",
  },
  {
    name: "Gurgaddi Guru Tegh Bahadur Sahib Ji",
    month: 4,
    day: 1,
    subtitle: "19 Chet",
  },
  {
    name: "Joti Jot Guru Har Krishan Sahib Ji",
    month: 4,
    day: 1,
    subtitle: "19 Chet",
  },
  {
    name: "Prakash Guru Tegh Bahadur Sahib Ji",
    month: 4,
    day: 7,
    subtitle: "25 Chet",
  },
  { name: "Prakash Guru Arjan Dev Ji", month: 4, day: 9, subtitle: "27 Chet" },
  { name: "Sikh Dastaar Divas", month: 4, day: 13, subtitle: "31 Chet" },
  {
    name: "Khalsa Saajna Divas (Vaisakhi)",
    month: 4,
    day: 14,
    subtitle: "01 Vaisakh",
  },
  {
    name: "Prakash Guru Angad Dev Ji",
    month: 4,
    day: 18,
    subtitle: "05 Vaisakh",
  },
  {
    name: "Prakash Guru Amar Das Sahib Ji",
    month: 4,
    day: 30,
    subtitle: "17 Vaisakh",
  },
  {
    name: "Gurgaddi Guru Hargobind Sahib Ji",
    month: 6,
    day: 8,
    subtitle: "25 Jeth",
  },
  {
    name: "Shaheedi Guru Arjan Dev Ji",
    month: 6,
    day: 18,
    subtitle: "04 Harh",
  },
  {
    name: "Prakash Guru Hargobind Sahib Ji",
    month: 6,
    day: 30,
    subtitle: "16 Harh",
  },
  {
    name: "Foundation Stone of Sachkhand Sri Harimandir Sahib",
    month: 7,
    day: 5,
    subtitle: "21 Harh",
  },
  { name: "Miri Piri Divas", month: 7, day: 24, subtitle: "09 Savan" },
  {
    name: "Prakash Guru Har Krishan Sahib Ji",
    month: 8,
    day: 7,
    subtitle: "23 Savan",
  },
  {
    name: "Sampuranta Divas Sri Guru Granth Sahib Ji",
    month: 8,
    day: 30,
    subtitle: "14 Bhadon",
  },
  {
    name: "First Prakash Sri Guru Granth Sahib Ji",
    month: 9,
    day: 12,
    subtitle: "27 Bhadon",
  },
  {
    name: "Gurgaddi Guru Arjan Dev Ji",
    month: 9,
    day: 13,
    subtitle: "28 Bhadon",
  },
  {
    name: "Joti Jot Guru Ram Das Ji",
    month: 9,
    day: 14,
    subtitle: "29 Bhadon",
  },
  {
    name: "Jorh Mela Gurdwara Kandh Sahib (Marriage of Guru Nanak Dev Ji)",
    month: 9,
    day: 18,
    subtitle: "02 Assu",
  },
  { name: "Gurgaddi Guru Ram Das Ji", month: 9, day: 24, subtitle: "08 Assu" },
  { name: "Joti Jot Guru Amar Das Ji", month: 9, day: 26, subtitle: "10 Assu" },
  {
    name: "Gurgaddi Guru Angad Dev Ji",
    month: 10,
    day: 1,
    subtitle: "15 Assu",
  },
  {
    name: "Joti Jot Guru Nanak Dev Ji",
    month: 10,
    day: 5,
    subtitle: "19 Assu",
  },
  {
    name: "Darbar Khalsa (Dussehra)",
    month: 10,
    day: 20,
    subtitle: "04 Katak",
  },
  { name: "Prakash Guru Ram Das Ji", month: 10, day: 27, subtitle: "11 Katak" },
  {
    name: "Gurgaddi Guru Har Krishan Sahib Ji",
    month: 11,
    day: 3,
    subtitle: "18 Katak",
  },
  {
    name: "Joti Jot Guru Har Rai Sahib Ji",
    month: 11,
    day: 3,
    subtitle: "18 Katak",
  },
  { name: "Bandi Chhor Divas", month: 11, day: 8, subtitle: "23 Katak" },
  {
    name: "Gurgaddi Sri Guru Granth Sahib Ji (Nanded)",
    month: 11,
    day: 11,
    subtitle: "26 Katak",
  },
  {
    name: "Joti Jot Guru Gobind Singh Ji",
    month: 11,
    day: 14,
    subtitle: "29 Katak",
  },
  {
    name: "Prakash Guru Nanak Dev Ji",
    month: 11,
    day: 24,
    subtitle: "09 Maghar",
  },
  {
    name: "Gurgaddi Guru Gobind Singh Ji",
    month: 12,
    day: 12,
    subtitle: "27 Maghar",
  },
  {
    name: "Shaheedi Guru Tegh Bahadur Sahib Ji",
    month: 12,
    day: 14,
    subtitle: "29 Maghar",
  },
  {
    name: "Gurgaddi Guru Khalsa Panth (Chamkaur Sahib)",
    month: 12,
    day: 14,
    subtitle: "29 Maghar",
  },
  { name: "Hola Mohalla", month: 3, day: 4, subtitle: "21 Phagun" },
];

// Last date the list above is known-good for (end of Samat 558). Past this the
// dates are last year's — the backend feed logs a warning at the same boundary.
const SAMAT_VALID_THROUGH = "2027-02-28";

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

const daysAwayFrom = (month, day) => {
  const today = startOfToday();
  let target = new Date(today.getFullYear(), month - 1, day);
  if (target < today) target = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((target - today) / 86400000);
};

// Device-local "today" as YYYY-MM-DD, for comparing against SAMAT_VALID_THROUGH.
const todayIso = () => {
  const t = startOfToday();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${mm}-${dd}`;
};

const daysAwayFromDate = (d) => {
  const today = startOfToday();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target - today) / 86400000);
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

// Parse "YYYY-MM-DD" (ignoring any time part) as a device-local date so the
// day boundary matches what the user sees, not UTC.
const parseIsoLocal = (str) => {
  const parts = String(str).slice(0, 10).split("-");
  if (parts.length !== 3) return null;
  const [y, mo, d] = parts.map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
};

// Maps the backend feed → the app's event shape. Accepts `{ events: [...] }` or a
// bare array. Each entry needs a `name` plus EITHER an explicit `date`
// ("YYYY-MM-DD", for movable/one-off days you feed per year) OR a recurring
// `month` + `day` (for fixed solar gurpurabs — feed once, recurs every year).
const parseApiEvents = (data) => {
  let list = null;
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.events)) list = data.events;
  if (!list) return null;
  const out = [];
  list.forEach((e) => {
    if (!e || !e.name) return;
    let daysAway = null;
    if (e.date) {
      const d = parseIsoLocal(e.date);
      const da = d ? daysAwayFromDate(d) : null;
      if (da != null && da >= 0) daysAway = da; // drop explicit dates already past
    } else if (e.month && e.day) {
      daysAway = daysAwayFrom(Number(e.month), Number(e.day)); // recurring
    }
    if (daysAway == null) return;
    out.push({
      name: e.name,
      subtitle: e.subtitle ?? "",
      daysAway,
      _source: "api",
    });
  });
  return out.length ? out.sort((a, b) => a.daysAway - b.daysAway) : null;
};

// Bundled local computation — always available. Used offline, or if the backend
// feed is unreachable. Warns once the table is out of its Samat rather than
// quietly serving last year's dates.
const computeLocalEvents = () => {
  if (todayIso() > SAMAT_VALID_THROUGH) {
    logError(
      new Error(
        `Bundled gurpurab dates expired on ${SAMAT_VALID_THROUGH} — refresh GURPURABS from the SGPC calendar`
      )
    );
  }
  return GURPURABS.map((e) => ({
    name: e.name,
    subtitle: e.subtitle ?? "",
    daysAway: daysAwayFrom(e.month, e.day),
    _source: "list",
  })).sort((a, b) => a.daysAway - b.daysAway || a.name.localeCompare(b.name));
};

// True when an event came from the bundled GURPURABS list rather than the
// backend feed or the day-scoped cache — i.e. the card is showing offline
// content and should refetch once connectivity returns. Exported so the UI
// doesn't have to know the `_source` tag values; see useRefetchOnReconnect.
// Takes null as well as undefined: the Discover card holds `useState(null)`
// until the first fetch settles, and a default parameter only covers undefined.
export const isBundledEvent = (event) => {
  const { _source: source } = event ?? {};
  return source === "list";
};

export const getUpcomingEvents = async ({ requireOnline = false } = {}) => {
  // 1. Today's cached feed → use it (offline-safe, refreshes daily).
  const cached = await readFreshCache(CACHE_KEY);
  if (cached) return cached;

  // 2. Backend feed (the yearly list maintained server-side), when configured.
  //    On any failure (incl. the endpoint not being deployed yet) we silently fall
  //    through to the bundled local computation, so the card always shows events.
  const url = constant.UPCOMING_EVENTS_API_URL;
  if (url) {
    try {
      const parsed = parseApiEvents(await fetchJson(url));
      if (parsed) {
        writeCache(CACHE_KEY, parsed);
        return parsed;
      }
    } catch (err) {
      logNetworkError(`upcoming events feed failed, using local: ${err?.message || err}`, err);
    }
  }

  // 3. requireOnline callers (rare) get an offline signal instead of the local list.
  if (requireOnline && !(await isOnline())) throw new OfflineError();

  // 4. Local fallback.
  return computeLocalEvents();
};

// Convenience: the single nearest upcoming event (for the compact Discover card).
export const getNextEvent = async (opts) => {
  const events = await getUpcomingEvents(opts);
  return events[0] ?? null;
};

export default getUpcomingEvents;
