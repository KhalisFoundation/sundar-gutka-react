import { constant } from "@common";
import initDB from "./connect";
import { createFormattedText, getTranslitText, parseVishraamPositions } from "./utils";

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

export function getShabadFromID(
  shabadID,
  length,
  language,
  vishraamSource,
  vishraamOption,
  isLarivar,
  isLarivarAssist,
  isParagraphMode,
  isVishraam
) {
  let baniLength;
  switch (length) {
    case constant.EXTRA_LONG:
      baniLength = constant.EXISTS_BUDDHA_DAL;
      break;
    case constant.LONG:
      baniLength = constant.EXISTS_TAKSAL;
      break;
    case constant.SHORT:
      baniLength = constant.EXISTS_SGPS;
      break;
    default:
      baniLength = constant.EXISTS_MEDIUM;
  }
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        db.transaction((tx) => {
          tx.executeSql(
            `SELECT ID, Seq,header, Paragraph, Gurmukhi, Visraam, Transliterations,Translations FROM mv_Banis_Shabad where Bani=${shabadID} AND ${baniLength}=1 AND (MangalPosition IS NULL OR MangalPosition =  'current')
             ORDER BY Seq ASC;`,
            [],
            (_tx, results) => {
              const len = results.rows.length;
              const totalResults = [];
              const paragraphResults = [];
              let paragraphID;
              let paragraphHeader;
              let prevParagraph;
              let gurmukhi;
              let transliteration;
              let englishTranslation;
              let punjabiTranslation;
              let spanishTranslation;
              for (let i = 0; i < len; i += 1) {
                const row = results.rows.item(i);
                const { GurmukhiBisram, Visraam, Gurmukhi, Paragraph, ID, header } = row;
                let { English, Punjabi, Spanish } = row;
                const gurmukhiLine = Visraam && GurmukhiBisram ? GurmukhiBisram : Gurmukhi;
                const vishraamPositions = parseVishraamPositions(
                  JSON.parse(Visraam),
                  vishraamSource
                );
                const curGurmukhi = createFormattedText(
                  gurmukhiLine.split(" "),
                  vishraamPositions,
                  {
                    isVishraam,
                    vishraamOption,
                    isLarivar,
                    isLarivarAssist,
                  }
                );

                const translationJson = JSON.parse(row.Translations);
                const defaultTranslation = " ";
                const getTranslation = (lang, field) =>
                  translationJson == null || translationJson[lang][field] == null
                    ? defaultTranslation
                    : translationJson[lang][field];
                const translit =
                  getTranslitText(row.Transliterations, language) || defaultTranslation;
                English = getTranslation("en", "bdb");
                Punjabi = getTranslation("pu", "bdb");
                Spanish = getTranslation("es", "sn");

                if (isParagraphMode) {
                  const isParagraphChange = prevParagraph !== Paragraph;
                  const isLastIteration = i === len - 1;

                  if (isParagraphChange) {
                    if (i !== 0) {
                      paragraphResults.push({
                        id: `${paragraphID}`,
                        gurmukhi,
                        translit: transliteration,
                        englishTranslations: englishTranslation,
                        punjabiTranslations: punjabiTranslation,
                        spanishTranslations: spanishTranslation,
                        header: paragraphHeader,
                      });
                    }

                    paragraphID = ID;
                    paragraphHeader = header;
                    gurmukhi = curGurmukhi;
                    transliteration = translit;
                    englishTranslation = English;
                    punjabiTranslation = Punjabi;
                    spanishTranslation = Spanish;
                    prevParagraph = Paragraph;
                  } else {
                    const space = isLarivar ? "" : " ";
                    gurmukhi += `${space}${curGurmukhi}`;
                    transliteration += ` ${translit}`;
                    englishTranslation += ` ${English}`;
                    punjabiTranslation += ` ${Punjabi}`;
                    spanishTranslation += ` ${Spanish}`;
                  }

                  if (isLastIteration) {
                    paragraphResults.push({
                      id: `${paragraphID}`,
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
              if (isParagraphMode) {
                return resolve(paragraphResults);
              }
              return resolve(totalResults);
            }
          );
        });
      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
}

export function getBookmarksForID(baniId, length, language) {
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
    initDB().then((db) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT ID, BaniShabadID, Seq, Gurmukhi, Transliterations, TukGurmukhi, TukTransliterations FROM Banis_Bookmarks WHERE Bani = ${baniId} AND BaniShabadID in (SELECT ID from mv_Banis_Shabad where Bani = ${baniId} AND ${baniLength} = 1)` +
            ` ORDER BY Seq ASC;`,
          [],
          (_tx, results) => {
            const totalResults = new Array(results.rows.length);
            const len = results.rows.length;
            for (let i = 0; i < len; i += 1) {
              const row = results.rows.item(i);
              const { BaniShabadID, Gurmukhi, Transliterations, TukGurmukhi, TukTransliterations } =
                row;
              totalResults[i] = {
                shabadID: BaniShabadID,
                gurmukhi: Gurmukhi,
                tukGurmukhi: TukGurmukhi,
                translit: getTranslitText(Transliterations, language),
                tukTranslit: TukTransliterations
                  ? getTranslitText(TukTransliterations, language)
                  : null,
              };
            }
            return resolve(totalResults);
          }
        );
      });
    });
  });
}
