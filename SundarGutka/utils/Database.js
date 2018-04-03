import React from "react";
import SQLite from "react-native-sqlite-storage";

var database_name = "sundargutka.db";

let db = SQLite.openDatabase({ name: database_name, createFromLocation: 1 });

class Database {
  static getResults() {
    db.executeSql("SELECT * FROM Banis", [], results => {
      console.log("Query completed");
      // Get rows with Web SQL Database spec compliance.
      var len = results.rows.length;
      var totalResults = "";
      for (let i = 0; i < len; i++) {
        let row = results.rows.item(i);
        totalResults += row.ID + ": " + row.Gurmukhi + "\n";
      }
      alert(totalResults);
    });
  }
}

export default Database;
