import constant from "../common/constant";
import { initDB } from "./connect";
import { getTranslitText } from "./utils/utils";

export function getBaniList(language) {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        db.transaction((tx) => {
          tx.executeSql(
            "SELECT ID, Gurmukhi, Transliterations FROM Banis",
            [],
            (_tx, results) => {
              const { rows } = results;
              const count = rows.length;
              const totalResults = [];
              for (let i = 0; i < count; i += 1) {
                const { ID, Gurmukhi, Transliterations } = rows.item(i);

                totalResults.push({
                  id: ID,
                  gurmukhi: Gurmukhi,
                  translit: getTranslitText(Transliterations, language),
                });
              }
              resolve(totalResults);
            },
            (error) => {
              reject(error);
            }
          );
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getShabadFromID(shabadID, length, language) {
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
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT ID, Seq,header, Paragraph, Gurmukhi, Visraam, Transliterations,Translations FROM mv_Banis_Shabad where Bani=${shabadID} AND ${baniLength}=1 ORDER BY Seq ASC;`,
            [],
            (_tx, results) => {
              const baniData = results.rows.raw().map((row) => {
                const translationJson = JSON.parse(row.Translations);
                const defaultTranslation = " ";
                const getTranslation = (lang, field) =>
                  translationJson == null || translationJson[lang][field] == null
                    ? defaultTranslation
                    : translationJson[lang][field];
                const translit =
                  getTranslitText(row.Transliterations, language) || defaultTranslation;
                const englishTranslations = getTranslation("en", "bdb");
                const punjabiTranslations = getTranslation("pu", "bdb");
                const spanishTranslations = getTranslation("es", "sn");

                return {
                  id: row.ID,
                  seq: row.Seq,
                  gurmukhi: row.Gurmukhi,
                  header: row.header,
                  translit,
                  englishTranslations,
                  punjabiTranslations,
                  spanishTranslations,
                  paragraph: row.Paragraph,
                  visramDB: row.Visraam,
                };
              });
              return resolve(baniData);
            }
          );
        });
      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
}

export function getBookmarksForID(baniId, length, language) {
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

  return new Promise((resolve) => {
    initDB().then((db) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT ID, BaniShabadID, Seq, Gurmukhi, Transliterations FROM Banis_Bookmarks WHERE Bani = ${baniId} AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = ${baniId} AND ${baniLength} = 1)` +
            ` ORDER BY Seq ASC;`,
          [],
          (_tx, results) => {
            const totalResults = new Array(results.rows.length);
            const len = results.rows.length;
            for (let i = 0; i < len; i += 1) {
              const row = results.rows.item(i);
              const { BaniShabadID, Gurmukhi, Transliterations, Seq, ID } = row;
              totalResults[i] = {
                shabadID: BaniShabadID,
                gurmukhi: Gurmukhi,
                translit: getTranslitText(Transliterations, language),
                seq: Seq,
                id: ID,
              };
            }
            return resolve(totalResults);
          }
        );
      });
    });
  });
}
