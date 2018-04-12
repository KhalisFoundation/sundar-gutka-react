import React from "react";
import SQLite from "react-native-sqlite-storage";

var database_name = "sundargutka.db";

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
    paragraphMode
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
        "SELECT ID, Paragraph, header, Gurmukhi, Transliteration, English FROM mv_Banis_Shabad WHERE Bani = " +
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
            let curGurmukhi = larivaar
              ? row.Gurmukhi.replace(/ /g, "")
              : row.Gurmukhi;
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
                    header: paragraphHeader
                  });
                }
                paragraphId = row.ID;
                paragraphHeader = row.header;
                gurmukhi = curGurmukhi;
                transliteration = row.Transliteration;
                englishTranslation = row.English;
                prevParagraph = row.Paragraph;
              } else {
                gurmukhi += larivaar ? curGurmukhi : "\n" + curGurmukhi;
                transliteration += "\n" + row.Transliteration;
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

  static getBookmarksForId(baniId) {
    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT BaniShabadID, Gurmukhi, Transliteration FROM Banis_Bookmarks WHERE Bani = " +
          baniId +
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
