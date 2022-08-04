import SQLite from "react-native-sqlite-storage";
import {
  getTranslitText
} from "./helpers";

const databaseName = "gutka.db";
let db;

class Database {
  static initDB() {
    return new Promise((resolve) => {
      if (db !== undefined) {
        resolve(true);
        return;
      }
      db = SQLite.openDatabase({
          name: databaseName,
          createFromLocation: 1
        }, () => {
          console.log("Database open Successfully")
        },
        (error) => {
          console.log("Error", error)
        });
      resolve(true);
    })
  }

  static getBaniList(language) {
    return new Promise((resolve)=> {
      Database.initDB().then(() => {
        db.executeSql(
          "SELECT ID, Gurmukhi, Transliterations FROM Banis",
          [],
          (results) => {
            
            const totalResults = {};
            const len = results.rows.length;

            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < len; i++) {
              const row = results.rows.item(i);
              totalResults[row.ID] = {
                gurmukhi: row.Gurmukhi,
                translit: getTranslitText(row.Transliterations, language),
              };
            }
            resolve(totalResults);
          }
        );
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
    switch (length) {
      case "EXTRA_LONG":
        baniLength = "existsBuddhaDal";
        break;
      case "LONG":
        baniLength = "existsTaksal";
        break;
      case "MEDIUM":
        baniLength = "existsMedium";
        break;
      case "SHORT":
        baniLength = "existsSGPC";
        break;
      default:
        baniLength = "existsMedium";
    }
    return new Promise(function (resolve) {
      Database.initDB().then(() => {
        db.executeSql(
          `SELECT ID, Paragraph, header, Gurmukhi, Visraam, Transliterations, Translations FROM mv_Banis_Shabad WHERE Bani = ${ 
          baniId 
          } AND ${ 
          baniLength 
          } = 1 AND (MangalPosition IS NULL OR MangalPosition = ${ 
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
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < len; i++) {
              const row = results.rows.item(i);

              const gurmukhiLine =
                visram && row.GurmukhiBisram ? row.GurmukhiBisram : row.Gurmukhi;

              const vishraamJson = JSON.parse(row.Visraam);

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

                if (visram && index in vishraamPositions) {
                  switch (vishraamOption) {
                    case "VISHRAAM_GRADIENT":
                      style +=
                        " border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, ";
                      style +=
                        vishraamPositions[index] === "v" ?
                        "rgba(167, 0, 0, 0.5)" :
                        "rgba(255, 242, 41, 0.5)";
                      style += " 100%);";
                      break;
                    case "VISHRAAM_COLORED":
                    default:
                      style += " color:";
                      style +=
                        vishraamPositions[index] === "v" ? "#c0392b;" : "#ffc500;";
                  }
                  return (
                    `<span style='
                    ${style} white-space: nowrap;'>
                    ${word} </span>`
                  );
                } 
                  if (larivaar && larivaarAssist && index % 2 !== 0) {
                    style += " opacity: .65;";
                  }
                  return `<span style='${  style  } white-space: nowrap;'>${  word  }</span>`;
                
              });
              let curGurmukhi = larivaar ? arr.join("&#8203;") : arr.join(" ");

              const translationJson = JSON.parse(row.Translations);
              // Remove nulls
              row.English =
                translationJson == null || translationJson.en.bdb == null ?
                " " :
                translationJson.en.bdb;
              row.Punjabi =
                translationJson == null || translationJson.pu.bdb == null ?
                " " :
                translationJson.pu.bdb;
              row.Spanish =
                translationJson == null || translationJson.es.sn == null ?
                " " :
                translationJson.es.sn;
              let translit = getTranslitText(row.Transliterations, language);
              translit = translit === "" || translit == null ? " " : translit;

              if (
                (baniId === 9 || baniId === 21) &&
                padcched === "MAST_SABH_MAST"
              ) {
                curGurmukhi = curGurmukhi.replace(
                  /smwpqm squ suBm squ/g,
                  "smwpq msqu suB msqu"
                );
              }

              if (paragraphMode) {
                if (prevParagraph !== row.Paragraph) {
                  if (i !== 0) {
                    paragraphResults.push({
                      id: `${  paragraphId}`,
                      gurmukhi,
                      translit: transliteration,
                      englishTranslations: englishTranslation,
                      punjabiTranslations: punjabiTranslation,
                      spanishTranslations: spanishTranslation,
                      header: paragraphHeader,
                    });
                  }
                  paragraphId = row.ID;
                  paragraphHeader = row.header;
                  gurmukhi = curGurmukhi;
                  transliteration = translit;
                  englishTranslation = row.English;
                  punjabiTranslation = row.Punjabi;
                  spanishTranslation = row.Spanish;
                  prevParagraph = row.Paragraph;
                } else {
                  gurmukhi += larivaar ? curGurmukhi : ` ${  curGurmukhi}`;
                  transliteration += ` ${  translit}`;
                  englishTranslation += ` ${  row.English}`;
                  punjabiTranslation += ` ${  row.Punjabi}`;
                  spanishTranslation += ` ${  row.Spanish}`;
                }

                if (i === len - 1) {
                  paragraphResults.push({
                    id: `${  paragraphId}`,
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
                  id: `${  row.ID}`,
                  gurmukhi: curGurmukhi,
                  translit,
                  englishTranslations: row.English,
                  punjabiTranslations: row.Punjabi,
                  spanishTranslations: row.Spanish,
                  header: row.header,
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
    switch (length) {
      case "EXTRA_LONG":
        baniLength = "existsBuddhaDal";
        break;
      case "LONG":
        baniLength = "existsTaksal";
        break;
      case "MEDIUM":
        baniLength = "existsMedium";
        break;
      case "SHORT":
        baniLength = "existsSGPC";
        break;
      default:
        baniLength = "existsMedium";
    }

    return new Promise(function (resolve) {
      Database.initDB().then(() => {
        db.executeSql(
          `SELECT BaniShabadID, Gurmukhi, Transliterations FROM Banis_Bookmarks WHERE Bani = ${ 
          baniId 
          } AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = ${ 
          baniId 
          } AND ${ 
          baniLength 
          } = 1)` +
          ` ORDER BY Seq ASC;`,
          [],
          (results) => {
            const totalResults = new Array(results.rows.length);
            const len = results.rows.length;
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < len; i++) {
              const row = results.rows.item(i);
              totalResults[i] = {
                shabadId: row.BaniShabadID,
                gurmukhi: row.Gurmukhi,
                translit: getTranslitText(row.Transliterations, language),
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
