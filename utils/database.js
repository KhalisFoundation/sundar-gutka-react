import SQLite from "react-native-sqlite-storage";
import { getTranslitText } from "./helpers";

var database_name = "gutka.db";
var db;
SQLite.deleteDatabase(
  {
    name: database_name,
    location: 1,
  },
  function(res, err) {
    // success
    db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });
  },
  function() {
    // error
    db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });
  }
);

class Database {
  static getBaniList(language) {
    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT ID, Gurmukhi, Transliterations FROM Banis",
        [],
        (results) => {
          var totalResults = {};
          var len = results.rows.length;

          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
            totalResults[row.ID] = {
              gurmukhi: row.Gurmukhi,
              translit: getTranslitText(row.Transliterations, language),
            };
          }
          resolve(totalResults);
        }
      );
    });
  }

  static getShabadForId(
    baniId,
    length,
    larivaar,
    padcched,
    mangalPosition,
    paragraphMode,
    visram,
    vishraamOption,
    vishraamSource,
    language
  ) {
    var baniLength;
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
    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT ID, Paragraph, header, Gurmukhi, Visraam, Transliterations, Translations FROM mv_Banis_Shabad WHERE Bani = " +
          baniId +
          " AND " +
          baniLength +
          " = 1 AND (MangalPosition IS NULL OR MangalPosition = " +
          (mangalPosition == "CURRENT_SAROOPS" ? "'current'" : "'above'") +
          ")ORDER BY Seq ASC;",
        [],
        (results) => {
          var totalResults = new Array(results.rows.length);
          var paragraphResults = new Array();
          var len = results.rows.length;

          var gurmukhi;
          var paragraphId;
          var transliteration;
          var englishTranslation;
          var punjabiTranslation;
          var spanishTranslation;
          var paragraphHeader;
          var prevParagraph;
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);

            var gurmukhiLine =
              visram && row.GurmukhiBisram ? row.GurmukhiBisram : row.Gurmukhi;

            let vishraamJson = JSON.parse(row.Visraam);

            var vishraamPositions = {};
            if (
              visram &&
              vishraamJson != null &&
              vishraamJson[vishraamSource] != null &&
              vishraamJson[vishraamSource].length > 0
            ) {
              vishraamJson[vishraamSource].forEach(function(pos) {
                vishraamPositions[pos.p] = pos.t;
              });
            }
            var splitted = gurmukhiLine.split(" ");

            var arr = splitted.map((word, index) => {
              var style = "style='";
              if (visram && index in vishraamPositions) {
                switch (vishraamOption) {
                  case "VISHRAAM_GRADIENT":
                    style +=
                      " border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, ";
                    style +=
                      vishraamPositions[index] == "v"
                        ? "rgba(167, 0, 0, 0.5)"
                        : "rgba(255, 242, 41, 0.5)";
                    style += " 100%);";
                    break;
                  case "VISHRAAM_COLORED":
                  default:
                    style += " color:";
                    style +=
                      vishraamPositions[index] == "v" ? "#c0392b" : "#ffc500";
                }
                return (
                  "<span " +
                  style +
                  "; white-space: nowrap;'>" +
                  word +
                  "</span>"
                );
              } else
                return "<span style='white-space: nowrap;'>" + word + "</span>";
            });

            let curGurmukhi = larivaar ? arr.join("<wbr>") : arr.join(" ");

            let translationJson = JSON.parse(row.Translations);
            // Remove nulls
            row.English =
              translationJson == null || translationJson.en.bdb == null
                ? " "
                : translationJson.en.bdb;
            row.Punjabi =
              translationJson == null || translationJson.pu.ss == null
                ? " "
                : translationJson.pu.ss;
            row.Spanish =
              translationJson == null || translationJson.es.sn == null
                ? " "
                : translationJson.es.sn;
            let translit = getTranslitText(row.Transliterations, language);
            translit = translit == "" || translit == null ? " " : translit;

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
                    id: "" + paragraphId,
                    gurmukhi: gurmukhi,
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
                gurmukhi += larivaar ? curGurmukhi : " " + curGurmukhi;
                transliteration += " " + translit;
                englishTranslation += " " + row.English;
                punjabiTranslation += " " + row.Punjabi;
                spanishTranslation += " " + row.Spanish;
              }

              if (i === len - 1) {
                paragraphResults.push({
                  id: "" + paragraphId,
                  gurmukhi: gurmukhi,
                  translit: transliteration,
                  englishTranslations: englishTranslation,
                  punjabiTranslations: punjabiTranslation,
                  spanishTranslations: spanishTranslation,
                  header: paragraphHeader,
                });
              }
            } else {
              totalResults[i] = {
                id: "" + row.ID,
                gurmukhi: curGurmukhi,
                translit: translit,
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
  }

  static getBookmarksForId(baniId, length, language) {
    var baniLength;
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

    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT BaniShabadID, Gurmukhi, Transliterations FROM Banis_Bookmarks WHERE Bani = " +
          baniId +
          " AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = " +
          baniId +
          " AND " +
          baniLength +
          " = 1)" +
          " ORDER BY Seq ASC;",
        [],
        (results) => {
          var totalResults = new Array(results.rows.length);
          var len = results.rows.length;
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
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
  }
}

export default Database;
