import React from "react";
import SQLite from "react-native-sqlite-storage";

var database_name = "gutkav8.db";

let db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });

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
    visram
  ) {
    var baniLength;
    switch (length) {
      case "LONG":
        baniLength = "existsBuddhaDal";
        break;
      case "MEDIUM":
        baniLength = "existsTaksal";
        break;
      default:
        baniLength = "existsStandard";
    }
    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT ID, ParagraphLong, header, Gurmukhi, GurmukhiBisram, Transliteration, English FROM mv_Banis_Shabad WHERE Bani = " +
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
          var paragraphHeader;
          var prevParagraph;
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);

            var gurmukhiLine =
              visram && row.GurmukhiBisram ? row.GurmukhiBisram : row.Gurmukhi;

            var splitted = gurmukhiLine.split(" ");

            var arr = [];
            splitted.forEach(function(word) {
              if (word.indexOf(";") >= 0) {
                arr.push(
                  "<span style='color:orange'>" + word.slice(0, -1) + "</span>"
                );
              } else if (word.indexOf(",") >= 0) {
                arr.push(
                  "<span style='color:green'>" + word.slice(0, -1) + "</span>"
                );
              } else {
                arr.push(word);
              }
            });

            let curGurmukhi = larivaar ? arr.join("<wbr>") : arr.join(" ");

            row.English = row.English == "" ? " " : row.English;
            row.Transliteration =
              row.Transliteration == "" ? " " : row.Transliteration;

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
              if (prevParagraph !== row.ParagraphLong) {
                if (i !== 0) {
                  paragraphResults.push({
                    id: "" + paragraphId,
                    gurmukhi: gurmukhi,
                    roman: transliteration,
                    englishTranslations: englishTranslation,
                    header: paragraphHeader
                  });
                }
                paragraphId = row.ID;
                paragraphHeader = row.header;
                gurmukhi = curGurmukhi;
                transliteration = row.Transliteration;
                englishTranslation = row.English;
                prevParagraph = row.ParagraphLong;
              } else {
                gurmukhi += larivaar ? curGurmukhi : " " + curGurmukhi;
                transliteration += " " + row.Transliteration;
                englishTranslation += " " + row.English;
              }

              if (i === len - 1) {
                paragraphResults.push({
                  id: "" + paragraphId,
                  gurmukhi: gurmukhi,
                  roman: transliteration,
                  englishTranslations: englishTranslation,
                  header: paragraphHeader
                });
              }
            } else {
              totalResults[i] = {
                id: "" + row.ID,
                gurmukhi: curGurmukhi,
                roman: row.Transliteration,
                englishTranslations: row.English,
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
      case "LONG":
        baniLength = "existsBuddhaDal";
        break;
      case "MEDIUM":
        baniLength = "existsTaksal";
        break;
      default:
        baniLength = "existsStandard";
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
