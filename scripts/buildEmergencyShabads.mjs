// Build-time generator for the offline "emergency" Random Shabad list.
//
// Fetches N unique shabads from BaniDB and writes a compact, authentic bundle to
// src/services/dashboard/emergencyShabads.json. The app ships this file so the
// Random Shabad card shows real, complete shabads (with ang/raag + a working
// "Read Shabad" link) even with no internet — no hand-typed Gurbani involved.
//
// Re-run when you want to refresh/expand the set:
//   node scripts/buildEmergencyShabads.mjs [count]
//
/* eslint-disable no-await-in-loop, no-console, no-underscore-dangle */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COUNT = Number(process.argv[2]) || 100;
const RANDOM_URL = "https://api.banidb.com/v2/random";
const MAX_ATTEMPTS = COUNT * 6;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../src/services/dashboard/emergencyShabads.json");

const sleep = (ms) =>
  new Promise((r) => {
    setTimeout(r, ms);
  });

// A verse is "meaningful" (vs. a section header like "Salok Mehla 4") when it has
// an English translation that isn't just a heading ending in ":".
const meaningful = (v) => {
  const t = v?.translation?.en?.bdb;
  return typeof t === "string" && t.trim() && !t.trim().endsWith(":");
};

const mapShabad = (data) => {
  const info = data?.shabadInfo ?? {};
  const verses = Array.isArray(data?.verses) ? data.verses : [];
  // Use only meaningful (non-header) verses for the displayed lines. A shabad
  // with a single meaningful verse yields one clean tukk — better than padding
  // with a structural header line like "Salok Mehla 4".
  const good = verses.filter(meaningful);
  const picked = (good.length ? good : verses).slice(0, 2);
  const lines = picked.map((v) => v?.verse?.unicode).filter(Boolean);
  const transliteration = picked
    .map((v) => v?.transliteration?.en || v?.transliteration?.english)
    .filter(Boolean);
  const translation = (good[0]?.translation?.en?.bdb || "").trim();
  const shabadId = info?.shabadId ?? null;
  if (!lines.length || !shabadId) return null;
  return {
    lines,
    translation,
    transliteration,
    raag: info?.raag?.unicode ?? "",
    ang: info?.pageNo ?? picked[0]?.pageNo ?? null,
    shabadId,
  };
};

const run = async () => {
  const byId = new Map();
  let attempts = 0;
  process.stdout.write(`Fetching ${COUNT} unique shabads from BaniDB`);
  while (byId.size < COUNT && attempts < MAX_ATTEMPTS) {
    attempts += 1;
    try {
      const res = await fetch(RANDOM_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const mapped = mapShabad(await res.json());
      if (mapped && !byId.has(mapped.shabadId)) {
        byId.set(mapped.shabadId, mapped);
        process.stdout.write(".");
      }
    } catch (err) {
      process.stdout.write("x");
    }
    await sleep(120); // be polite to the API
  }
  process.stdout.write("\n");

  const shabads = [...byId.values()];
  const payload = {
    _generated: new Date().toISOString().slice(0, 10),
    _source: "api.banidb.com/v2/random",
    count: shabads.length,
    shabads,
  };
  await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${shabads.length} shabads (${attempts} attempts) → ${OUT_PATH}`);
  if (shabads.length < COUNT) {
    console.warn(`Warning: only got ${shabads.length}/${COUNT}. Re-run to top up.`);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
