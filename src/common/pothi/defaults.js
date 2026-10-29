import convertToUnicode from "../utils";
import {
  createPothi,
  EVENING_ID,
  EVENING_NITNEM_IDS,
  makeBaniItem,
  MORNING_ID,
  MORNING_NITNEM_IDS,
} from "./model";

// Builds the two pothis every user starts with.
//
// The ids and the bani lists live in `model.js` — resolving which folder is
// Morning Nitnem needs them too, and a second copy here is how the pair would
// drift apart. This file is only the part that needs the live bani database:
// turning those ids into items carrying real titles.

/**
 * The default pothis, built against the live bani list so each item carries the
 * real title the API requires.
 *
 * Seeded ONCE, tracked by `seededDefaults` — a user who deletes or renames them
 * must not find them back next launch. Returns an empty array when the bani
 * list has not loaded yet, so the caller retries rather than seeding a pothi
 * full of numeric placeholder titles.
 *
 * @param {Array} baniListData rows from `useBaniList()`.
 * @param {{morning: string, evening: string}} names localised pothi names.
 */
export const buildDefaultPothis = (baniListData, names) => {
  const byId = new Map();
  (baniListData ?? []).forEach((bani) => {
    if (bani?.id != null) byId.set(bani.id, bani);
  });
  const wanted = [...MORNING_NITNEM_IDS, ...EVENING_NITNEM_IDS];
  // All-or-nothing: a partial database would otherwise produce a Morning Nitnem
  // missing Anand Sahib, and `seededDefaults` would stop it ever being fixed.
  if (wanted.some((id) => !byId.has(id))) return [];

  const itemsFor = (ids) =>
    ids.map((id) => {
      const bani = byId.get(id);
      return makeBaniItem({
        baaniId: id,
        // The Unicode name — the ASCII one renders as mojibake under Baloo, and
        // the API stores this verbatim for every client that reads it back.
        // Converted when the table has no Unicode column, as the list does.
        title: bani.gurmukhiUni || convertToUnicode(bani.gurmukhi),
      });
    });

  // FIXED ids, not minted ones. addPothi de-duplicates by id, so if this ever
  // runs twice the second run replaces the pair instead of appending a copy —
  // which is exactly the bug a random id per call produced.
  return [
    createPothi({ id: MORNING_ID, name: names.morning, items: itemsFor(MORNING_NITNEM_IDS) }),
    createPothi({ id: EVENING_ID, name: names.evening, items: itemsFor(EVENING_NITNEM_IDS) }),
  ];
};

export default buildDefaultPothis;
