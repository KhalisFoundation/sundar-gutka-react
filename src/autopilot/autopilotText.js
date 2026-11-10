// What Autopilot follows: the open Bani's pangtis exactly as the database gives them (GurmukhiUni,
// by row ID), the same rows the Reader shows, and the other Nitnem Banis as "other Gurbani" for the
// follower's is-it-this-Bani check (Rehras shares Chaupai and Anand, so those are left out for each
// other). Read only; nothing is written.
import { constant } from "@common";
import initDB from "../database/connect";

// The Bani length setting -> its column: the same rule as getShabadFromID in src/database/db.js
// (kept here so db.js stays untouched; keep the two in step).
const LENGTH_COLUMN = {
  [constant.EXTRA_LONG]: constant.EXISTS_BUDDHA_DAL,
  [constant.LONG]: constant.EXISTS_TAKSAL,
  [constant.SHORT]: constant.EXISTS_SGPS,
};
const NITNEM = [2, 4, 9, 10, 21, 23];
const SHARED = { 21: [9, 10], 9: [21], 10: [21] };

const query = async (sql, args) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        args,
        (_tx, { rows }) => resolve(Array.from({ length: rows.length }, (_, i) => rows.item(i))),
        (_tx, error) => reject(error)
      );
    });
  });
};

const autopilotText = async (baniId, length) => {
  const col = LENGTH_COLUMN[length] || constant.EXISTS_MEDIUM;
  const where = `${col} = 1 AND (MangalPosition IS NULL OR MangalPosition = 'current')`;
  const others = NITNEM.filter((b) => b !== baniId && !(SHARED[baniId] || []).includes(b));
  const lines = await query(
    `SELECT ID, Paragraph, GurmukhiUni FROM mv_Banis_Shabad WHERE Bani = ? AND ${where} ORDER BY Seq ASC`,
    [baniId]
  );
  const background = await query(
    `SELECT GurmukhiUni FROM mv_Banis_Shabad WHERE Bani IN (${others.join(",")}) AND ${where}`,
    []
  );
  return {
    lines: lines.map((r) => ({ verseId: r.ID, paragraph: r.Paragraph, text: r.GurmukhiUni })),
    background: background.map((r) => r.GurmukhiUni),
  };
};

export default autopilotText;
