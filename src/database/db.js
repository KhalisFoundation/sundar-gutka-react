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

export const sample = () => {};
