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

  static getShabadForId(shabadId, length, larivaar) {
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
        "SELECT ID, header, Gurmukhi, Transliteration, English FROM mv_Banis_Shabad WHERE Bani = " +
          shabadId +
          " AND " +
          baniLength +
          " = 1 ORDER BY Seq ASC;",
        [],
        results => {
          var totalResults = new Array(results.rows.length);
          var len = results.rows.length;
          for (let i = 0; i < len; i++) {
            let row = results.rows.item(i);
            let gurmukhi = larivaar
              ? row.Gurmukhi.replace(/ /g, "")
              : row.Gurmukhi;
            totalResults[i] = {
              id: "" + row.ID,
              gurmukhi: gurmukhi,
              roman: row.Transliteration,
              englishTranslations: row.English,
              header: row.header
            };
          }
          resolve(totalResults);
        }
      );
    });
  }

  static getBookmarksForId(shabadId) {
    return new Promise(function(resolve) {
      db.executeSql(
        "SELECT BaniShabadID, Gurmukhi, Transliteration FROM Banis_Bookmarks WHERE Bani = " +
          shabadId +
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
