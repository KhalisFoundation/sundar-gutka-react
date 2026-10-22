import STRINGS from "../localization";
import convertToUnicode from "../utils";

// What a reminder is called, in one place.
//
// A reminder's name leaves the app: it is drawn by the SYSTEM in a
// notification, on the lock screen, and in the shade, where none of the app's
// Gurbani faces exist. That is the whole reason this is not simply
// `section.gurmukhi` — that field holds the legacy ASCII encoding
// (`gur mMqR`), which only looks like Gurmukhi under GurbaniAkhar and reads as
// Latin nonsense anywhere else. Titles used to be built from the
// TRANSLITERATION to dodge that, which meant a reminder said `gur ma(n)tr` even
// with transliteration switched off.
//
// Unicode Gurmukhi is the answer: it renders everywhere, with no font of ours
// involved. `gurmukhiUni` carries it when the row came from the bani database,
// and convertToUnicode derives it from the legacy string when it did not.
//
// The order matches useBaniTitle, which is the same rule for in-app text:
// transliteration WINS, because it is an explicit choice about the script the
// user reads in, and is asked before the Gurmukhi question at all.

/** Every language's stock title opens with its own "Time for". */
const STOCK_TITLE_LANGUAGES = ["en-US", "hi", "pa", "fr", "it", "es"];

const stockTitlePrefixes = () =>
  STOCK_TITLE_LANGUAGES.map((lang) =>
    typeof STRINGS.getString === "function"
      ? STRINGS.getString("time_for", lang) || STRINGS.time_for
      : STRINGS.time_for
  ).filter(Boolean);

/**
 * Whether a reminder's notification title is the user's own words.
 *
 * A rename sets `titleCustom`, but titles renamed before that flag existed have
 * no flag — so the text itself is the fallback: the stock title is
 * "<Time for> <bani>" in whichever language it was created in, and a title that
 * opens with none of those six prefixes was typed. Prefix only, so a later
 * language or transliteration switch cannot make an untouched title look
 * customised.
 */
export const isCustomTitle = (section) => {
  if (!section || !section.title) return false;
  if (section.titleCustom) return true;
  const title = String(section.title);
  return !stockTitlePrefixes().some((prefix) => title.startsWith(`${prefix} `));
};

/**
 * How a bani is named. THE implementation — useBaniTitle wraps this for in-app
 * text, and the reminders call it directly.
 *
 * Transliteration wins: it is an explicit choice about the script the user
 * reads in, so it is asked before the Gurmukhi question at all.
 *
 * `unicode` is the only thing the two callers disagree about, and it is about
 * the FONT rather than the language. Text the app draws itself may be handed
 * the legacy ASCII encoding, because a Gurbani face is what renders it. Text
 * the system draws — a notification, the lock screen — has no such face, so it
 * must be real Unicode. Passing it in keeps one rule instead of two copies.
 *
 * @param {{ translit?: string, gurmukhi?: string, gurmukhiUni?: string }} bani
 * @param {{ isTransliteration?: boolean, unicode?: boolean }} options
 */
export const baniName = (bani, { isTransliteration = false, unicode = true } = {}) => {
  if (!bani) return "";
  if (isTransliteration) return bani.translit || "";
  if (!unicode) return bani.gurmukhi || "";
  const converted = bani.gurmukhiUni || convertToUnicode(bani.gurmukhi || "");
  // A row with no Gurmukhi at all is better named in Latin than left blank.
  return converted || bani.translit || "";
};

/**
 * The bani's name as a REMINDER should say it: always Unicode, because a
 * notification is drawn by the system.
 */
export const reminderBaniName = (item, isTransliteration) =>
  baniName(item, { isTransliteration, unicode: true });

/**
 * A reminder's full title: the user's own words if they wrote any, otherwise
 * the stock "<Time for> <bani>" resolved against the CURRENT setting.
 *
 * Resolved rather than stored, so turning transliteration on or off retitles
 * every reminder the user never renamed.
 */
export const reminderTitle = (item, isTransliteration, timeForPrefix = STRINGS.time_for) => {
  if (!item) return "";
  if (isCustomTitle(item)) return item.title;
  return `${timeForPrefix} ${reminderBaniName(item, isTransliteration)}`.trim();
};

export default reminderTitle;
