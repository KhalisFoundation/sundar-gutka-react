import GLOBAL from "./globals";
import SQLite from "react-native-sqlite-storage";

var database_name = "gutka.db";
var db;
SQLite.deleteDatabase({
  name: database_name,        
  location: 1 
}, function (res, err) { // success
    db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });
}, function () { // error
    db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });
});

class Database {
  static getBaniList() {
    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT ID, Gurmukhi, Transliteration FROM Banis",
        [],
        results => {
          var totalResults = {};
          var len = results.rows.length;
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
            totalResults[row.ID] = {
              gurmukhi: row.Gurmukhi,
              roman: row.Transliteration
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
    vishraamSource
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
        "SELECT ID, Paragraph, header, Gurmukhi, GurmukhiBisram, Transliteration, English, Punjabi, Spanish FROM mv_Banis_Shabad WHERE Bani = " +
          baniId +
          " AND " +
          baniLength +
          " = 1 AND (MangalPosition IS NULL OR MangalPosition = " +
          (mangalPosition == "CURRENT_SAROOPS" ? "'current'" : "'above'") +
          ")ORDER BY Seq ASC;",
        [],
        results => {
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

            var splitted = gurmukhiLine.split(" ");

            let vishraamMain = 'VISHRAAM_GRADIENT';

            var arr = [];
            splitted.forEach(function(word) {
              if (visram && word.indexOf(";") >= 0) {
                arr.push(
                  "<span style='color:" +
                    GLOBAL.COLOR.VISHRAM_LONG +
                    "; white-space: nowrap;'>" +
                    word.slice(0, -1) +
                    "</span>"
                );
              } else if (visram && word.indexOf(",") >= 0) {
                arr.push(
                  "<span style='color:" +
                    GLOBAL.COLOR.VISHRAM_SHORT +
                    "; white-space: nowrap;'>" +
                    word.slice(0, -1) +
                    "</span>"
                );
              } else {
                arr.push(
                  "<span style='white-space: nowrap;'>" + word + "</span>"
                );
              }
            });

            // Yamki #ffc500
            // Main: #c0392b
            //"<span style='white-space: nowrap; padding-right:5px; border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, rgba(255, 242, 41, 0.5) 100%);'>" + word + "</span>"
            //"<span style='white-space: nowrap; padding-right:5px; border-radius: 5px; background: linear-gradient(to right,rgba(229, 229, 229, 0) 20%, rgba(167, 0, 0, 0.5) 100%);'>" + word + "</span>"


            let curGurmukhi = larivaar ? arr.join("<wbr>") : arr.join(" ");

            // Remove nulls
            row.English =
              row.English == "" || row.English == null ? " " : row.English;
            row.Punjabi =
              row.Punjabi == "" || row.Punjabi == null ? " " : row.Punjabi;
            row.Spanish =
              row.Spanish == "" || row.Spanish == null ? " " : row.Spanish;
            row.Transliteration =
              row.Transliteration == "" || row.Transliteration == null
                ? " "
                : row.Transliteration;

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
                    roman: transliteration,
                    englishTranslations: englishTranslation,
                    punjabiTranslations: punjabiTranslation,
                    spanishTranslations: spanishTranslation,
                    header: paragraphHeader
                  });
                }
                paragraphId = row.ID;
                paragraphHeader = row.header;
                gurmukhi = curGurmukhi;
                transliteration = row.Transliteration;
                englishTranslation = row.English;
                punjabiTranslation = row.Punjabi;
                spanishTranslation = row.Spanish;
                prevParagraph = row.Paragraph;
              } else {
                gurmukhi += larivaar ? curGurmukhi : " " + curGurmukhi;
                transliteration += " " + row.Transliteration;
                englishTranslation += " " + row.English;
                punjabiTranslation += " " + row.Punjabi;
                spanishTranslation += " " + row.Spanish;
              }

              if (i === len - 1) {
                paragraphResults.push({
                  id: "" + paragraphId,
                  gurmukhi: gurmukhi,
                  roman: transliteration,
                  englishTranslations: englishTranslation,
                  punjabiTranslations: punjabiTranslation,
                  spanishTranslations: spanishTranslation,
                  header: paragraphHeader
                });
              }
            } else {
              totalResults[i] = {
                id: "" + row.ID,
                gurmukhi: curGurmukhi,
                roman: row.Transliteration,
                englishTranslations: row.English,
                punjabiTranslations: row.Punjabi,
                spanishTranslations: row.Spanish,
                header: row.header
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

  static getBookmarksForId(baniId, length) {
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
        "SELECT BaniShabadID, Gurmukhi, Transliteration FROM Banis_Bookmarks WHERE Bani = " +
          baniId +
          " AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = " +
          baniId +
          " AND " +
          baniLength +
          " = 1)" +
          " ORDER BY Seq ASC;",
        [],
        results => {
          var totalResults = new Array(results.rows.length);
          var len = results.rows.length;
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
            totalResults[i] = {
              shabadId: row.BaniShabadID,
              gurmukhi: row.Gurmukhi,
              roman: row.Transliteration
            };
          }
          resolve(totalResults);
        }
      );
    });
  }
}

export default Database;
