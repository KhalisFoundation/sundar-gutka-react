import STRINGS from "./localization";

/**
 * Hermes-safe, app-language-aware date localisation for the Dashboard.
 *
 * The dashboard's calendars, header and charts previously formatted month /
 * weekday / date names with JS `Date.prototype.toLocaleString(...)`. That is
 * wrong here twice over:
 *   1. Hermes (this app's JS engine) ships without full-ICU, so Intl date
 *      formatting is unreliable and generally falls back to English — the same
 *      reason services/currency.js hand-rolls its number grouping.
 *   2. Even where it works, it keys off the *device* locale (or a hardcoded
 *      "en-US"), not the language the user picked *in the app*.
 * So a Punjabi user saw English months and weekday letters everywhere.
 *
 * This module keeps explicit, translator-checked name tables (Gregorian month
 * names and weekday names in each of the six supported languages) and formats
 * off the app's own selected language via STRINGS.getLanguage(). No Intl, no
 * device-locale coupling — the dashboard now reads in the chosen language.
 *
 * Weekday arrays are Sunday-first (index 0 = Sunday) to match JS getDay().
 */

// Maps a STRINGS language key (or the "DEFAULT"/unknown sentinel) to our tables.
const LANG_MAP = {
  "en-US": "en",
  en: "en",
  es: "es",
  fr: "fr",
  it: "it",
  hi: "hi",
  pa: "pa",
};

const resolveLang = () => {
  try {
    return LANG_MAP[STRINGS.getLanguage()] || "en";
  } catch (_) {
    return "en";
  }
};

// ── Month names (index 0 = January) ──────────────────────────────────────────
const MONTHS_LONG = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  it: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्तूबर", "नवंबर", "दिसंबर"],
  pa: ["ਜਨਵਰੀ", "ਫ਼ਰਵਰੀ", "ਮਾਰਚ", "ਅਪ੍ਰੈਲ", "ਮਈ", "ਜੂਨ", "ਜੁਲਾਈ", "ਅਗਸਤ", "ਸਤੰਬਰ", "ਅਕਤੂਬਰ", "ਨਵੰਬਰ", "ਦਸੰਬਰ"],
};

const MONTHS_SHORT = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"],
  // Devanagari/Gurmukhi have no conventional 3-letter abbreviations — use the
  // full names (they're short enough for the week-range label).
  hi: MONTHS_LONG.hi,
  pa: MONTHS_LONG.pa,
};

// ── Weekday names, Sunday-first (index 0 = Sunday, matches Date.getDay()) ─────
const WEEKDAYS_LONG = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  it: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
  pa: ["ਐਤਵਾਰ", "ਸੋਮਵਾਰ", "ਮੰਗਲਵਾਰ", "ਬੁੱਧਵਾਰ", "ਵੀਰਵਾਰ", "ਸ਼ੁੱਕਰਵਾਰ", "ਸ਼ਨੀਵਾਰ"],
};

// Narrow single/short labels for calendar column headers, Sunday-first. Latin
// scripts use one letter; Devanagari/Gurmukhi use the shortest recognisable
// 1–2 character form (a lone consonant is ambiguous).
const WEEKDAYS_NARROW = {
  en: ["S", "M", "T", "W", "T", "F", "S"],
  fr: ["D", "L", "M", "M", "J", "V", "S"],
  it: ["D", "L", "M", "M", "G", "V", "S"],
  es: ["D", "L", "M", "X", "J", "V", "S"],
  hi: ["र", "सो", "मं", "बु", "गु", "शु", "श"],
  pa: ["ਐ", "ਸੋ", "ਮੰ", "ਬੁੱ", "ਵੀ", "ਸ਼ੁੱ", "ਸ਼"],
};

const clampMonth = (m) => ((Number(m) % 12) + 12) % 12;
const clampDay = (d) => ((Number(d) % 7) + 7) % 7;

/** Full month name for a 0-based month index (0 = January) in the app language. */
export const monthLong = (monthIndex0) => MONTHS_LONG[resolveLang()][clampMonth(monthIndex0)];

/** Short month name for a 0-based month index in the app language. */
export const monthShort = (monthIndex0) => MONTHS_SHORT[resolveLang()][clampMonth(monthIndex0)];

/** Full weekday name for a 0-based day index (0 = Sunday) in the app language. */
export const weekdayLong = (dayIndex0) => WEEKDAYS_LONG[resolveLang()][clampDay(dayIndex0)];

/** Narrow weekday label for a 0-based day index (0 = Sunday) in the app language. */
export const weekdayNarrow = (dayIndex0) => WEEKDAYS_NARROW[resolveLang()][clampDay(dayIndex0)];

/**
 * The 7 narrow weekday labels as a display row.
 * @param {boolean} mondayFirst  true → [Mon…Sun], false → [Sun…Sat] (default).
 */
export const weekdayNarrowRow = (mondayFirst = false) => {
  const row = WEEKDAYS_NARROW[resolveLang()];
  return mondayFirst ? [...row.slice(1), row[0]] : [...row];
};

/** "January 2026" (en) / "जनवरी 2026" — localised month name + numeric year. */
export const formatMonthYear = (date) => `${monthLong(date.getMonth())} ${date.getFullYear()}`;

/**
 * A day+month label. English reads "month day" (January 5); every other
 * supported language reads "day month" (5 janvier / 5 जनवरी), which is the
 * natural order in those languages.
 * @param {Date} date
 * @param {boolean} short  use the short month name (for tight week-range labels).
 */
export const formatDayMonth = (date, short = false) => {
  const name = short ? monthShort(date.getMonth()) : monthLong(date.getMonth());
  const day = date.getDate();
  return resolveLang() === "en" ? `${name} ${day}` : `${day} ${name}`;
};

/** Localised long weekday name for a date (e.g. "Monday" / "ਸੋਮਵਾਰ"). */
export const formatWeekdayLong = (date) => weekdayLong(date.getDay());

/**
 * A localised full date: "Saturday, 25 July 2026" / "शनिवार, 25 जुलाई 2026"
 * — weekday, day, month, year. Weekday-first in every language (matches the
 * Hukamnama card's established format).
 */
export const formatFullDate = (date) =>
  `${weekdayLong(date.getDay())}, ${date.getDate()} ${monthLong(date.getMonth())} ${date.getFullYear()}`;

/**
 * A localised date + 24h time, e.g. "January 5, 14:30" / "5 janvier, 14:30".
 * The date part is language-aware (via formatDayMonth); the clock is numeric
 * (locale-neutral), so this stays Hermes-safe with no Intl.
 */
export const formatDateTime = (date) => {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${formatDayMonth(date)}, ${hh}:${mm}`;
};
