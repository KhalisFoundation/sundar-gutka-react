import React from "react";
import SQLite from "react-native-sqlite-storage";

var database_name = "sundargutka.db";

let db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });

class Database {
  static getResults() {
    return new Promise(function(resolve, reject) {
      db.executeSql("SELECT * FROM Banis", [], results => {
        var totalResults = "";
        var len = results.rows.length;
        for (let i = 0; i < len; i++) {
          let row = results.rows.item(i);
          totalResults += row.ID + ": " + row.Gurmukhi + "\n";
        }
        resolve(totalResults);
      });
    });
  }

  static getBaniList() {
    return new Promise(function(resolve, reject) {
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
  
}

export default Database;
