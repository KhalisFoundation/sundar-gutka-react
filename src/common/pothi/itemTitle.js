import convertToUnicode from "../utils";

/**
 * The title a bani item is STORED under: the Unicode name, whatever this
 * device happens to display. The API keeps it verbatim for every client that
 * reads the pothi back, so a transliterated or ASCII (Gurbani Akhar) title
 * would show as the wrong script, or as mojibake, everywhere else. Converted
 * when the row has no Unicode column, as the bani list does.
 */
const baniItemTitle = (bani) => bani?.gurmukhiUni || convertToUnicode(bani?.gurmukhi ?? "");

export default baniItemTitle;
