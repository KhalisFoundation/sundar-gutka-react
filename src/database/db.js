import { constant, logError, logMessage } from "@common";
import initDB from "./connect";
import { createFormattedText, getTranslitText, parseVishraamPositions } from "./utils";

export const getBaniList = (language) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        db.transaction((tx) => {
          tx.executeSql(
            "SELECT ID, GurmukhiUni, Transliterations FROM Banis",
            [],
            (_tx, results) => {
              const { rows } = results;
              const count = rows.length;
              const totalResults = [];
              for (let i = 0; i < count; i += 1) {
                const { ID, GurmukhiUni, Transliterations } = rows.item(i);

                totalResults.push({
                  id: ID,
                  gurmukhi: GurmukhiUni,
                  translit: getTranslitText(Transliterations, language),
                });
              }
              resolve(totalResults);
            },
            (error) => {
              reject(error);
              throw error;
            }
          );
        });
      })
      .catch((error) => {
        logMessage("Fetching Bani list error");
        logError(error);
        reject(error);
        throw error;
      });
  });
};

export const getShabadFromID = async (
  shabadID,
  length,
  language,
  vishraamSource,
  vishraamOption,
  isLarivar,
  isLarivarAssist,
  isParagraphMode,
  isVishraam,
  padcched
) => {
  let baniLength;
  switch (length) {
    case constant.EXTRA_LONG:
      baniLength = constant.EXISTS_BUDDHA_DAL;
      break;
    case constant.LONG:
      baniLength = constant.EXISTS_TAKSAL;
      break;
    case constant.SHORT:
      baniLength = constant.EXISTS_SGPS;
      break;
    default:
      baniLength = constant.EXISTS_MEDIUM;
  }
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT ID, Seq, header, Paragraph, GurmukhiUni, Visraam, Transliterations, Translations 
           FROM mv_Banis_Shabad 
           WHERE Bani = ? AND ${baniLength} = 1 AND (MangalPosition IS NULL OR MangalPosition = 'current')
           ORDER BY Seq ASC;`,
          [shabadID],
          (_tx, results) => {
            try {
              const len = results.rows.length;
              const totalResults = [];
              const paragraphResults = [];
              let paragraphId = null;
              let paragraphHeader = null;
              let prevParagraph = null;
              let gurmukhi = "";
              let transliteration = "";
              let englishTranslation = "";
              let punjabiTranslation = "";
              let spanishTranslation = "";

              for (let i = 0; i < len; i += 1) {
                const row = results.rows.item(i);
                const {
                  ID,
                  GurmukhiBisram,
                  Visraam,
                  GurmukhiUni,
                  Paragraph,
                  header,
                  Transliterations,
                  Translations,
                } = row;
                const gurmukhiLine = Visraam && GurmukhiBisram ? GurmukhiBisram : GurmukhiUni;
                const vishraamPositions = parseVishraamPositions(
                  JSON.parse(Visraam),
                  vishraamSource
                );
                let curGurmukhi = createFormattedText(gurmukhiLine.split(" "), vishraamPositions, {
                  isVishraam,
                  vishraamOption,
                  isLarivar,
                  isLarivarAssist,
                });

                const translationJson = JSON.parse(Translations) || {};
                const getTranslation = (lang, field) => {
                  return (translationJson[lang] && translationJson[lang][field]) || " ";
                };
                const translit = Transliterations
                  ? getTranslitText(Transliterations, language) || " "
                  : "";
                const English = getTranslation("en", "bdb");
                const Punjabi = getTranslation("pu", "bdb");
                const Spanish = getTranslation("es", "sn");

                // Padched settings for Chopayi Sahib and Rehraas Sahib
                if (
                  (shabadID === constant.CHOPAYI_SAHIB_ID ||
                    shabadID === constant.REHRAAS_SAHIB_ID) &&
                  padcched === constant.MAST_SABH_MAST
                ) {
                  const replaced = curGurmukhi.replace(
                    /smwpqm squ suBm squ/g,
                    constant.MAST_SABH_MAST_TUKK
                  );
                  curGurmukhi = replaced;
                }

                if (isParagraphMode) {
                  const isParagraphChange = prevParagraph !== Paragraph;
                  const isLastIteration = i === len - 1;

                  if (isParagraphChange) {
                    if (i !== 0) {
                      paragraphResults.push({
                        id: `${paragraphId}`,
                        gurmukhi,
                        translit: transliteration,
                        englishTranslations: englishTranslation,
                        punjabiTranslations: punjabiTranslation,
                        spanishTranslations: spanishTranslation,
                        header: paragraphHeader,
                      });
                    }

                    paragraphId = ID;
                    paragraphHeader = header;
                    gurmukhi = curGurmukhi;
                    transliteration = translit;
                    englishTranslation = English;
                    punjabiTranslation = Punjabi;
                    spanishTranslation = Spanish;
                    prevParagraph = Paragraph;
                  } else {
                    const space = isLarivar ? "" : " ";
                    gurmukhi += `${space}${curGurmukhi}`;
                    transliteration += ` ${translit}`;
                    englishTranslation += ` ${English}`;
                    punjabiTranslation += ` ${Punjabi}`;
                    spanishTranslation += ` ${Spanish}`;
                  }

                  if (isLastIteration) {
                    paragraphResults.push({
                      id: `${paragraphId}`,
                      gurmukhi,
                      translit: transliteration,
                      englishTranslations: englishTranslation,
                      punjabiTranslations: punjabiTranslation,
                      spanishTranslations: spanishTranslation,
                      header: paragraphHeader,
                    });
                  }
                } else {
                  totalResults.push({
                    id: `${ID}`,
                    gurmukhi: curGurmukhi,
                    translit,
                    englishTranslations: English,
                    punjabiTranslations: Punjabi,
                    spanishTranslations: Spanish,
                    header,
                  });
                }
              }
              resolve(isParagraphMode ? paragraphResults : totalResults);
            } catch (error) {
              logMessage("Error processing results:");
              logError(error);
              reject(error);
              throw error;
            }
          },
          (txError) => {
            logMessage("SQL Error:");
            logError(txError);
            reject(txError);
            throw txError;
          }
        );
      });
    });
  } catch (dbError) {
    logMessage("Database Initialization Error:");
    logError(dbError);
    throw dbError;
  }
};

export const getBookmarksForID = (baniId, length, language) => {
  let baniLength;
  const {
    EXTRA_LONG,
    EXISTS_BUDDHA_DAL,
    LONG,
    EXISTS_SGPS,
    EXISTS_TAKSAL,
    EXISTS_MEDIUM,
    SHORT,
    MEDIUM,
  } = constant;
  switch (length) {
    case EXTRA_LONG:
      baniLength = EXISTS_BUDDHA_DAL;
      break;
    case LONG:
      baniLength = EXISTS_TAKSAL;
      break;
    case MEDIUM:
      baniLength = EXISTS_MEDIUM;
      break;
    case SHORT:
      baniLength = EXISTS_SGPS;
      break;
    default:
      baniLength = EXISTS_MEDIUM;
  }

  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT ID, BaniShabadID, Seq, GurmukhiUni, Transliterations, TukGurmukhiUni, TukTransliterations FROM Banis_Bookmarks WHERE Bani = ${baniId} AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = ${baniId} AND ${baniLength} = 1)` +
              ` ORDER BY Seq ASC;`,
            [],
            (_tx, results) => {
              const totalResults = Array.from({ length: results.rows.length }, (_, i) => {
                const row = results.rows.item(i);

                return {
                  shabadID: row.BaniShabadID,
                  gurmukhi: row.GurmukhiUni,
                  tukGurmukhi: row.TukGurmukhiUni,
                  translit: getTranslitText(row.Transliterations, language),
                  tukTranslit: row.TukTransliterations
                    ? getTranslitText(row.TukTransliterations, language)
                    : null,
                };
              });
              return resolve(totalResults);
            }
          );
        });
      })
      .catch((error) => {
        logError(error);
        logMessage("Fetching bookmarks data error");
        reject(error);
      });
  });
};
