import SQLite from "react-native-sqlite-storage";
import constant from "./constant";
import globals from "./globals";
import { getTranslitText } from "./helpers";

const databaseName = constant.DB;
let db;

class Database {
  static initDB() {
    return new Promise((resolve) => {
      if (db !== undefined) {
        resolve(true);
        return;
      }
      db = SQLite.openDatabase(
        {
          name: databaseName,
          createFromLocation: 1,
        },
        () => {
          console.log("Database open Successfully");
        },
        (error) => {
          console.log("Error", error);
        }
      );
      resolve(true);
    });
  }

  static getBaniList(language) {
    return new Promise((resolve) => {
      Database.initDB().then(() => {
        db.executeSql("SELECT ID, Gurmukhi, Transliterations FROM Banis", [], (results) => {
          const totalResults = {};
          const len = results.rows.length;

          for (let i = 0; i < len; i += 1) {
            const row = results.rows.item(i);
            const { ID, Gurmukhi, Transliterations } = row;
            totalResults[ID] = {
              gurmukhi: Gurmukhi,
              translit: getTranslitText(Transliterations, language),
            };
          }
          resolve(totalResults);
        });
      });
    });
  }

  static getShabadForId(
    baniId,
    length,
    larivaar,
    larivaarAssist,
    padcched,
    mangalPosition,
    paragraphMode,
    visram,
    vishraamOption,
    vishraamSource,
    language
  ) {
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
      Database.initDB().then(() => {
        db.executeSql(
          `SELECT ID, Paragraph, header, Gurmukhi, Visraam, Transliterations, Translations FROM mv_Banis_Shabad WHERE Bani = ${baniId} AND ${baniLength} = 1 AND (MangalPosition IS NULL OR MangalPosition = ${
            mangalPosition === "CURRENT_SAROOPS" ? "'current'" : "'above'"
          })ORDER BY Seq ASC;`,
          [],
          (results) => {
            const totalResults = new Array(results.rows.length);
            const paragraphResults = [];
            const len = results.rows.length;

            let gurmukhi;
            let paragraphId;
            let transliteration;
            let englishTranslation;
            let punjabiTranslation;
            let spanishTranslation;
            let paragraphHeader;
            let prevParagraph;
            for (let i = 0; i < len; i += 1) {
              const row = results.rows.item(i);
              const {
                GurmukhiBisram,
                Gurmukhi,
                Visraam,
                Transliterations,
                Translations,
                Paragraph,
                ID,
                header,
              } = row;
              let { English, Punjabi, Spanish } = row;

              const gurmukhiLine = visram && GurmukhiBisram ? GurmukhiBisram : Gurmukhi;

              const vishraamJson = JSON.parse(Visraam);

              const vishraamPositions = {};
              if (
                visram &&
                vishraamJson != null &&
                vishraamJson[vishraamSource] != null &&
                vishraamJson[vishraamSource].length > 0
              ) {
                vishraamJson[vishraamSource].forEach(function (pos) {
                  vishraamPositions[pos.p] = pos.t;
                });
              }
              const splitted = gurmukhiLine.split(" ");

              const arr = splitted.map((word, index) => {
                let style = "";
                const { VISHRAAM_GRADIENT, VISHRAAM_COLORED } = constant;
                const { VISHRAM_BASIC, VISHRAM_SHORT } = globals.COLOR;
                if (visram && index in vishraamPositions) {
                  switch (vishraamOption) {
                    case VISHRAAM_GRADIENT:
                      style +=
                        " border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, ";
                      style +=
                        vishraamPositions[index] === "v"
                          ? "rgba(167, 0, 0, 0.5)"
                          : "rgba(255, 242, 41, 0.5)";
                      style += " 100%);";
                      break;
                    case VISHRAAM_COLORED:
                      style += " color:";
                      style +=
                        vishraamPositions[index] === "v" ? `${VISHRAM_BASIC}` : `${VISHRAM_SHORT};`;
                      break;
                    default:
                      style += " color:";
                      style +=
                        vishraamPositions[index] === "v" ? `${VISHRAM_BASIC}` : `${VISHRAM_SHORT};`;
                  }
                  let line = "";
                  if (style !== "") {
                    if (larivaar) {
                      line = `<span style='
                    ${style}'>${word}</span>`;
                    } else {
                      line = `<span style='
                    ${style}'>
                    ${word} </span>`;
                    }
                  } else {
                    line = word;
                  }
                  return line;
                }
                if (larivaar && larivaarAssist && index % 2 !== 0) {
                  style += " opacity: .65;";
                }
                let lineWord = "";
                if (style !== "") {
                  lineWord = `<span style='${style}'>${word}</span>`;
                } else {
                  lineWord = word;
                }
                return lineWord;
              });
              let curGurmukhi = larivaar ? arr.join("&#8203;") : arr.join(" ");

              const translationJson = JSON.parse(Translations);
              // Remove nulls
              English =
                translationJson == null || translationJson.en.bdb == null
                  ? " "
                  : translationJson.en.bdb;
              Punjabi =
                translationJson == null || translationJson.pu.bdb == null
                  ? " "
                  : translationJson.pu.bdb;
              Spanish =
                translationJson == null || translationJson.es.sn == null
                  ? " "
                  : translationJson.es.sn;
              let translit = getTranslitText(Transliterations, language);
              translit = translit === "" || translit == null ? " " : translit;

              if ((baniId === 9 || baniId === 21) && padcched === constant.MAST_SABH_MAST) {
                curGurmukhi = curGurmukhi.replace(/smwpqm squ suBm squ/g, "smwpq msqu suB msqu");
              }

              if (paragraphMode) {
                if (prevParagraph !== Paragraph) {
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
                  gurmukhi += larivaar ? curGurmukhi : ` ${curGurmukhi}`;
                  transliteration += ` ${translit}`;
                  englishTranslation += ` ${English}`;
                  punjabiTranslation += ` ${Punjabi}`;
                  spanishTranslation += ` ${Spanish}`;
                }

                if (i === len - 1) {
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
                totalResults[i] = {
                  id: `${ID}`,
                  gurmukhi: curGurmukhi,
                  translit,
                  englishTranslations: English,
                  punjabiTranslations: Punjabi,
                  spanishTranslations: Spanish,
                  header,
                };
              }
            }

            if (paragraphMode) {
              resolve(paragraphResults);
            } else {
              resolve(totalResults);
            }
          }
        );
      });
    });
  }

  static getBookmarksForId(baniId, length, language) {
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

    return new Promise(function (resolve) {
      Database.initDB().then(() => {
        db.executeSql(
          `SELECT BaniShabadID, Gurmukhi, Transliterations FROM Banis_Bookmarks WHERE Bani = ${baniId} AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = ${baniId} AND ${baniLength} = 1)` +
            ` ORDER BY Seq ASC;`,
          [],
          (results) => {
            const totalResults = new Array(results.rows.length);
            const len = results.rows.length;
            for (let i = 0; i < len; i += 1) {
              const row = results.rows.item(i);
              const { BaniShabadID, Gurmukhi, Transliterations } = row;
              totalResults[i] = {
                shabadId: BaniShabadID,
                gurmukhi: Gurmukhi,
                translit: getTranslitText(Transliterations, language),
              };
            }
            resolve(totalResults);
          }
        );
      });
    });
  }
}

export default Database;
