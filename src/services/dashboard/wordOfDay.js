import { constant, logNetworkError } from "@common";
import { isOnline, OfflineError } from "./connectivity";
import { readFreshCache, writeCache } from "./dailyCache";

// Persist the resolved word for the day so it stays available offline within the
// same calendar day (rolls over at local midnight).
const CACHE_KEY = "@word_of_day_cache_v1";

// Word of the Day for the Discover section.
// Source priority:
//   1. A dedicated backend word-of-day endpoint (constant.WORD_OF_DAY_API_URL),
//      when configured.
//   2. Derived from today's REAL Hukamnama (the same source as Today's Vaak): we
//      pick the most prominent word of the opening line and show it with its
//      transliteration and the line's translation as context. Meaning is the
//      line's translation, not a dictionary gloss of the single word — there's
//      no word-level dictionary in the payload, so this is contextual by design.
//   3. A rotating local set (one per day-of-year) when offline or if both fail,
//      so the card is never empty.

// Reuse the vaak's hukamnama source so dev (local backend) and release (BaniDB)
// both work. The clean backend shape exposes { lines, translation }; raw BaniDB
// exposes { shabads:[{ verses:[{ verse, transliteration, translation }] }] }.
const HUKAMNAMA_FALLBACK_URL = "https://api.banidb.com/v2/hukamnamas/today";
const hukamnamaUrl = () => constant.DAILY_VAAK_API_URL || HUKAMNAMA_FALLBACK_URL;

// Offline fallback dictionary — the bundled mirror of the backend's word list
// (word-of-day.service.ts in khalis-users-api). Keep the two in sync, and in the
// SAME ORDER: both rotate by day-of-year modulo the list length, so identical
// content plus identical ordering is what makes a given day show the SAME word
// whether or not the device has internet. A different offline list would mean
// the word silently changes when connectivity drops, which is worse than the
// card being stale.
const FALLBACK_WORDS = [
  { gurmukhi: "ਨਦਰਿ", transliteration: "nadar", meaning: "The glance of grace; divine mercy." },
  {
    gurmukhi: "ਹੁਕਮੁ",
    transliteration: "hukam",
    meaning: "The Divine Order; God's command and will.",
  },
  {
    gurmukhi: "ਸੇਵਾ",
    transliteration: "sevaa",
    meaning: "Selfless service done without desire for reward.",
  },
  {
    gurmukhi: "ਸਿਮਰਨੁ",
    transliteration: "simran",
    meaning: "Loving remembrance and meditation on God.",
  },
  {
    gurmukhi: "ਸੰਗਤਿ",
    transliteration: "sangat",
    meaning: "The holy congregation; company of the devoted.",
  },
  { gurmukhi: "ਕਿਰਪਾ", transliteration: "kirpaa", meaning: "Grace; divine mercy and kindness." },
  { gurmukhi: "ਨਾਮੁ", transliteration: "naam", meaning: "The Divine Name; the presence of God." },
  { gurmukhi: "ਸਬਦੁ", transliteration: "sabad", meaning: "The Divine Word; the Guru's teaching." },
  { gurmukhi: "ਅਨੰਦੁ", transliteration: "anand", meaning: "Bliss; deep spiritual joy." },
  {
    gurmukhi: "ਸੰਤੋਖੁ",
    transliteration: "santokh",
    meaning: "Contentment; acceptance of God's will.",
  },
  { gurmukhi: "ਦਇਆ", transliteration: "daiaa", meaning: "Compassion and mercy toward all." },
  {
    gurmukhi: "ਚਰਨ",
    transliteration: "charan",
    meaning: "The feet of the Guru; a symbol of humility.",
  },
  { gurmukhi: "ਭਗਤਿ", transliteration: "bhagati", meaning: "Loving devotion and worship of God." },
  {
    gurmukhi: "ਮੁਕਤਿ",
    transliteration: "mukat",
    meaning: "Liberation; freedom from the cycle of birth and death.",
  },
  { gurmukhi: "ਸਹਜ", transliteration: "sahaj", meaning: "Intuitive peace and natural equipoise." },
  { gurmukhi: "ਪ੍ਰੇਮ", transliteration: "prem", meaning: "Pure, selfless divine love." },
  {
    gurmukhi: "ਧਿਆਨੁ",
    transliteration: "dhiaan",
    meaning: "Focused meditation; loving attention on God.",
  },
  { gurmukhi: "ਨਿਮ੍ਰਤਾ", transliteration: "nimrataa", meaning: "Humility; freedom from ego." },
  { gurmukhi: "ਜੋਤਿ", transliteration: "jot", meaning: "The Divine Light present within all." },
  {
    gurmukhi: "ਅੰਮ੍ਰਿਤੁ",
    transliteration: "amrit",
    meaning: "Nectar of immortality; the sweetness of Naam.",
  },
  {
    gurmukhi: "ਵਾਹਿਗੁਰੂ",
    transliteration: "waheguru",
    meaning: "Wondrous Enlightener; the Sikh name for God.",
  },
  {
    gurmukhi: "ਗਿਆਨੁ",
    transliteration: "giaan",
    meaning: "Spiritual wisdom and divine knowledge.",
  },
  { gurmukhi: "ਦਰਸਨੁ", transliteration: "darsan", meaning: "The blessed vision of the Divine." },
  { gurmukhi: "ਭਾਣਾ", transliteration: "bhaanaa", meaning: "God's will, accepted with love." },
  { gurmukhi: "ਸਤੁ", transliteration: "sat", meaning: "Truth; that which is eternal and real." },
  {
    gurmukhi: "ਕਰਮੁ",
    transliteration: "karam",
    meaning: "Grace; also action and its consequence.",
  },
  { gurmukhi: "ਸੰਤ", transliteration: "sant", meaning: "A saint; one absorbed in God." },
  {
    gurmukhi: "ਸਾਧਸੰਗਤਿ",
    transliteration: "saadhsangat",
    meaning: "The company of the holy and wise.",
  },
  {
    gurmukhi: "ਮਨੁ",
    transliteration: "man",
    meaning: "The mind; that which must be stilled and turned to God.",
  },
  { gurmukhi: "ਹਰਿ", transliteration: "har", meaning: "God; the all-pervading Lord." },
  {
    gurmukhi: "ਕਦਰ",
    transliteration: "kadar",
    meaning: "Appreciation; recognising the true worth of someone or something.",
  },
  {
    gurmukhi: "ਹਵਾ",
    transliteration: "havaa",
    meaning: "Air; the wind that sustains all breathing life.",
  },
  {
    gurmukhi: "ਸਰੂਪ",
    transliteration: "saroop",
    meaning: "Form or appearance; also a bound volume of Sri Guru Granth Sahib Ji.",
  },
  {
    gurmukhi: "ਅਲੌਕਿਕ",
    transliteration: "alaukik",
    meaning: "Otherworldly; beyond the ordinary or the material.",
  },
  {
    gurmukhi: "ਚਾਨਣ",
    transliteration: "chaanan",
    meaning: "Light; illumination, whether of the sun or of the mind.",
  },
  {
    gurmukhi: "ਬਖਸ਼ਸ਼",
    transliteration: "bakhshash",
    meaning: "A blessing; a gift bestowed by God or by elders.",
  },
  {
    gurmukhi: "ਅਨਾਥ",
    transliteration: "anaath",
    meaning: "One left without a protector; an orphan.",
  },
  {
    gurmukhi: "ਨੀਚ",
    transliteration: "neech",
    meaning: "Lowly; lacking elevation of soul or character.",
  },
  {
    gurmukhi: "ਜਾਗਣਾ",
    transliteration: "jaaganaa",
    meaning: "To awaken; to rise from sleep, and to stay awake within.",
  },
  {
    gurmukhi: "ਔਗੁਣ",
    transliteration: "augun",
    meaning: "A demerit; a flaw in one's nature or character.",
  },
  {
    gurmukhi: "ਨਿਰਾਦਰ",
    transliteration: "niraadar",
    meaning: "Disrespect; conduct that dishonours another.",
  },
  {
    gurmukhi: "ਯਾਤਰਾ",
    transliteration: "yaatraa",
    meaning: "A journey; travel undertaken from one place to another.",
  },
  { gurmukhi: "ਸੱਜਰਾ", transliteration: "sajjaraa", meaning: "Fresh; newly made or newly come." },
  {
    gurmukhi: "ਪਹਾੜ",
    transliteration: "pahaarh",
    meaning: "A mountain; land naturally raised high above the earth.",
  },
  {
    gurmukhi: "ਹੱਸਣਾ",
    transliteration: "hassanaa",
    meaning: "To laugh; to let joy show on the face.",
  },
  {
    gurmukhi: "ਹੈਰਾਨ",
    transliteration: "hairaan",
    meaning: "Astonished; struck by something unexpected.",
  },
  {
    gurmukhi: "ਅਰਦਾਸ",
    transliteration: "ardaas",
    meaning: "The Sikh prayer of supplication offered before Waheguru.",
  },
  {
    gurmukhi: "ਕਾਲ",
    transliteration: "kaal",
    meaning: "Time; also death — that which Akal Purakh is beyond.",
  },
  {
    gurmukhi: "ਮੂਲ",
    transliteration: "mool",
    meaning: "The root or origin from which a thing springs.",
  },
  {
    gurmukhi: "ਦਸਤਾਰ",
    transliteration: "dastaar",
    meaning: "The turban; the crown of a Sikh's identity.",
  },
  {
    gurmukhi: "ਸੂਰਮਾ",
    transliteration: "sooramaa",
    meaning: "A warrior; one brave in the face of fear.",
  },
  {
    gurmukhi: "ਜੱਥੇਦਾਰ",
    transliteration: "jathedaar",
    meaning: "The leader of a jatha; the head of a Takht.",
  },
  {
    gurmukhi: "ਬੇਅਦਬੀ",
    transliteration: "beadabee",
    meaning: "Sacrilege; irreverence shown towards what is sacred.",
  },
  {
    gurmukhi: "ਸਕੂਨ",
    transliteration: "sakoon",
    meaning: "Tranquillity; a settled ease of heart.",
  },
  {
    gurmukhi: "ਚੰਚਲ",
    transliteration: "chanchal",
    meaning: "Restless and fickle, as the unstilled mind is.",
  },
  {
    gurmukhi: "ਕਠੋਰ",
    transliteration: "kathor",
    meaning: "Hard-hearted; harsh in word or manner.",
  },
  {
    gurmukhi: "ਨਿਰਧਨ",
    transliteration: "niradhan",
    meaning: "Destitute; without wealth of any kind.",
  },
  { gurmukhi: "ਸਦਾ", transliteration: "sadaa", meaning: "Always; for all time, without ceasing." },
  {
    gurmukhi: "ਚੇਤੇ",
    transliteration: "chete",
    meaning: "Remembrance; that which is kept in mind.",
  },
  {
    gurmukhi: "ਤਰਸ",
    transliteration: "taras",
    meaning: "Pity; tenderness stirred by another's suffering.",
  },
  { gurmukhi: "ਆਸ", transliteration: "aas", meaning: "Hope; expectation held in the heart." },
  {
    gurmukhi: "ਅਰਮਾਨ",
    transliteration: "armaan",
    meaning: "A longing; a cherished wish or aspiration.",
  },
  { gurmukhi: "ਹਾਸਾ", transliteration: "haasaa", meaning: "Laughter; the sound of joy expressed." },
  { gurmukhi: "ਸੁਖਾਲਾ", transliteration: "sukhaalaa", meaning: "Easy; done without difficulty." },
  { gurmukhi: "ਮੁਸ਼ਕਲ", transliteration: "mushkal", meaning: "Difficult; hard to accomplish." },
  { gurmukhi: "ਸਹੀ", transliteration: "sahee", meaning: "Correct; that which is not wrong." },
  { gurmukhi: "ਸਟੀਕ", transliteration: "sateek", meaning: "Precise; exact and without error." },
  { gurmukhi: "ਪੱਕਾ", transliteration: "pakkaa", meaning: "Firm; settled and not easily shaken." },
  { gurmukhi: "ਅੱਵਲ", transliteration: "avval", meaning: "First; foremost in rank or order." },
  { gurmukhi: "ਅੰਤਮ", transliteration: "antam", meaning: "Final; the last in a sequence." },
  {
    gurmukhi: "ਕਮੀ",
    transliteration: "kamee",
    meaning: "A lack; the shortfall in what is needed.",
  },
  { gurmukhi: "ਨੁਕਸ", transliteration: "nukas", meaning: "A defect; a fault in a thing's making." },
  {
    gurmukhi: "ਨਖ਼ਰਾ",
    transliteration: "nakhraa",
    meaning: "Affectation; airs put on to draw notice.",
  },
  {
    gurmukhi: "ਆਲਸ",
    transliteration: "aalas",
    meaning: "Laziness; reluctance to rouse oneself to work.",
  },
  {
    gurmukhi: "ਓਪਰਾ",
    transliteration: "opraa",
    meaning: "Unfamiliar; a stranger, or a thing not one's own.",
  },
  { gurmukhi: "ਪਰੇਸ਼ਾਨ", transliteration: "pareshaan", meaning: "Worried; troubled in mind." },
  {
    gurmukhi: "ਕਹਿਰ",
    transliteration: "kahir",
    meaning: "Wrath; a fury that falls like calamity.",
  },
  {
    gurmukhi: "ਉਸਤਾਦ",
    transliteration: "ustaad",
    meaning: "A teacher; a master of a craft or art.",
  },
  {
    gurmukhi: "ਨੌਕਰ",
    transliteration: "naukar",
    meaning: "A servant; one who works in another's household.",
  },
  { gurmukhi: "ਮਦਦ", transliteration: "madad", meaning: "Help; assistance given to another." },
  {
    gurmukhi: "ਤਿਆਰੀ",
    transliteration: "tiaaree",
    meaning: "Preparation; the making ready for what is to come.",
  },
  { gurmukhi: "ਦੇਸ", transliteration: "des", meaning: "A country; the land one belongs to." },
  { gurmukhi: "ਥਾਂ", transliteration: "thaan", meaning: "A place; the spot a thing occupies." },
  {
    gurmukhi: "ਇਮਾਰਤ",
    transliteration: "imaarat",
    meaning: "A building; a raised structure of stone or brick.",
  },
  {
    gurmukhi: "ਅਖਾੜਾ",
    transliteration: "akhaarhaa",
    meaning: "An arena; the ground where a contest is held.",
  },
  {
    gurmukhi: "ਕੁਰਸੀ",
    transliteration: "kursee",
    meaning: "A chair; a seat with a back to rest against.",
  },
  { gurmukhi: "ਸਦੀ", transliteration: "sadee", meaning: "A century; a span of one hundred years." },
  {
    gurmukhi: "ਤਾਰੀਖ਼",
    transliteration: "taareekh",
    meaning: "A date; the day marked on the calendar.",
  },
  {
    gurmukhi: "ਘੜੀ",
    transliteration: "gharhee",
    meaning: "A watch or clock; also a brief moment of time.",
  },
  {
    gurmukhi: "ਰੌਸ਼ਨੀ",
    transliteration: "raushanee",
    meaning: "Light; the brightness by which things are seen.",
  },
  {
    gurmukhi: "ਬੱਤੀ",
    transliteration: "battee",
    meaning: "A lamp; the light kindled against darkness.",
  },
  {
    gurmukhi: "ਖੰਭ",
    transliteration: "khambh",
    meaning: "A wing; the feathered limb by which a bird flies.",
  },
  {
    gurmukhi: "ਆਲ੍ਹਣਾ",
    transliteration: "aalhanaa",
    meaning: "A nest; the shelter a bird builds for its young.",
  },
  { gurmukhi: "ਕਤੂਰਾ", transliteration: "katooraa", meaning: "A puppy; a young dog." },
  {
    gurmukhi: "ਅੰਬ",
    transliteration: "amb",
    meaning: "The mango; the sweet, juicy fruit of summer.",
  },
  {
    gurmukhi: "ਸਬਜ਼ੀ",
    transliteration: "sabzee",
    meaning: "A vegetable; also a cooked dish made of one.",
  },
  { gurmukhi: "ਮਿੱਠਾ", transliteration: "mitthaa", meaning: "Sweet; carrying the taste of sugar." },
  {
    gurmukhi: "ਗਰਮੀ",
    transliteration: "garmee",
    meaning: "Heat; warmth greater than is comfortable.",
  },
  { gurmukhi: "ਠੰਡਾ", transliteration: "thandaa", meaning: "Cold; low in warmth." },
  {
    gurmukhi: "ਸਖ਼ਤ",
    transliteration: "sakhat",
    meaning: "Hard; firm and difficult to bend or break.",
  },
  { gurmukhi: "ਠੋਸ", transliteration: "thos", meaning: "Solid; dense throughout, not hollow." },
  { gurmukhi: "ਪਤਲਾ", transliteration: "patlaa", meaning: "Thin; slender or of little thickness." },
  { gurmukhi: "ਮੋਟਾ", transliteration: "motaa", meaning: "Thick; broad or stout in bulk." },
  {
    gurmukhi: "ਗੋਲ",
    transliteration: "gol",
    meaning: "Round; equal from the centre on every side.",
  },
  {
    gurmukhi: "ਪੁੱਠਾ",
    transliteration: "putthaa",
    meaning: "Reversed; turned the wrong way about.",
  },
  { gurmukhi: "ਥੋੜਾ", transliteration: "thorhaa", meaning: "A little; small in amount." },
  { gurmukhi: "ਖ਼ਤਮ", transliteration: "khatam", meaning: "Finished; brought to an end." },
  {
    gurmukhi: "ਟੱਕਰ",
    transliteration: "takkar",
    meaning: "A collision; also a contest of equal strength.",
  },
  {
    gurmukhi: "ਕਰਜ਼ਾ",
    transliteration: "karzaa",
    meaning: "A debt; what is borrowed and owed back.",
  },
  {
    gurmukhi: "ਕਿਤਾਬ",
    transliteration: "kitaab",
    meaning: "A book; bound pages meant to be read.",
  },
  {
    gurmukhi: "ਅਖ਼ਬਾਰ",
    transliteration: "akhbaar",
    meaning: "A newspaper; the daily record of events.",
  },
  {
    gurmukhi: "ਨਜ਼ਾਰਾ",
    transliteration: "nazaaraa",
    meaning: "A view; a sight pleasing to behold.",
  },
  { gurmukhi: "ਔਰਤ", transliteration: "aurat", meaning: "A woman; an adult female." },
  { gurmukhi: "ਮਰਦ", transliteration: "marad", meaning: "A man; an adult male." },
  { gurmukhi: "ਮੁੰਡਾ", transliteration: "mundaa", meaning: "A boy; a male child." },
  {
    gurmukhi: "ਜਾਣਨਾ",
    transliteration: "jaananaa",
    meaning: "To know; to hold a thing in understanding.",
  },
  {
    gurmukhi: "ਕੋਟੀ",
    transliteration: "kotee",
    meaning: "A sweater; a knitted garment worn for warmth.",
  },
];

// 1-based day of the year (Jan 1 = 1), from the device-local calendar date.
// Date-only arithmetic so a DST shift can't move the boundary. Matches the
// backend's dayOfYear(), which reckons in IST — the two can therefore disagree
// for the part of the day where the device's date differs from India's, which
// is the same window in which the day-scoped cache would roll over anyway.
const localDayOfYear = (d = new Date()) => {
  const startOfYear = Date.UTC(d.getFullYear(), 0, 0);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((today - startOfYear) / 86400000);
};

const fallbackWord = () => ({
  ...FALLBACK_WORDS[localDayOfYear() % FALLBACK_WORDS.length],
  _source: "fallback",
});

// True when the word came from the bundled list above rather than the network
// or the day-scoped cache — i.e. the card is showing offline content and should
// refetch once connectivity returns. Exported so the UI doesn't have to know the
// `_source` tag values; see useRefetchOnReconnect.
// Takes null as well as undefined: the Discover card holds `useState(null)`
// until the first fetch settles, and a default parameter only covers undefined.
export const isBundledWord = (word) => {
  const { _source: source } = word ?? {};
  return source === "fallback";
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

// Tolerant mapping for a dedicated backend endpoint: accepts a few common key
// spellings for the word fields.
const mapWord = (d) => {
  if (!d || typeof d !== "object") return null;
  const gurmukhi = d.gurmukhi || d.word || d.unicode || "";
  if (!gurmukhi) return null;
  return {
    gurmukhi,
    transliteration: d.transliteration || d.translit || d.roman || d.english || "",
    meaning: d.meaning || d.definition || d.translation || d.english || "",
    _source: "api",
  };
};

// Tokens that are only a danda (॥ ।) or Gurmukhi digits aren't real words.
const isWordToken = (t) => t && !/^[।॥੦-੯]+$/.test(t);

// Pick the most prominent word of a Gurmukhi line (longest content token — a
// cheap heuristic to skip short connectives/particles), with its aligned
// transliteration token when the line and its transliteration tokenize 1:1.
const pickWord = (gurmukhiLine, transliterationLine) => {
  const gurTokens = (gurmukhiLine || "").trim().split(/\s+/).filter(Boolean);
  const trTokens = (transliterationLine || "").trim().split(/\s+/).filter(Boolean);
  let bestIdx = -1;
  let bestLen = 0;
  gurTokens.forEach((t, i) => {
    if (isWordToken(t) && t.length > bestLen) {
      bestLen = t.length;
      bestIdx = i;
    }
  });
  if (bestIdx < 0) return null;
  const aligned = gurTokens.length === trTokens.length ? trTokens[bestIdx] : "";
  return {
    gurmukhi: gurTokens[bestIdx],
    transliteration: aligned.replace(/[.,;:]+$/, ""),
  };
};

// A verse is a real line of the shabad (vs. a structural heading like "Salok
// Mehla 4:" or "Sorat'h, Fifth Mehla:") when its English translation isn't
// just a heading ending in ":". Mirrors randomShabad.js / buildEmergencyShabads.mjs
// so the word — and its "meaning" — never comes from the heading line.
const isMeaningfulVerse = (v) => {
  const t = v?.translation?.en?.bdb;
  return typeof t === "string" && t.trim() && !t.trim().endsWith(":");
};

// Derive a word from today's hukamnama, handling both the clean backend shape
// and a raw BaniDB payload.
const deriveFromHukamnama = (data) => {
  // Clean backend shape: { lines:[...], translation }
  if (Array.isArray(data?.lines) && data.lines.length) {
    // Line 1 is usually the Raag/Mehla heading — prefer line 2 when it exists.
    const line = data.lines[1] ?? data.lines[0];
    const picked = pickWord(line, "");
    if (!picked) return null;
    return { ...picked, meaning: data.translation ?? "", _source: "hukamnama" };
  }
  // Raw BaniDB shape: { shabads:[{ verses:[...] }] }
  const verses = Array.isArray(data?.shabads?.[0]?.verses) ? data.shabads[0].verses : [];
  const verse = verses.find(isMeaningfulVerse) ?? verses[0];
  if (!verse) return null;
  const translitLine = verse?.transliteration?.english || verse?.transliteration?.en || "";
  const picked = pickWord(verse?.verse?.unicode, translitLine);
  if (!picked) return null;
  return { ...picked, meaning: verse?.translation?.en?.bdb ?? "", _source: "hukamnama" };
};

export const getWordOfDay = async ({ requireOnline = false } = {}) => {
  // 0. Today's cached word (same local day) → serve it, even offline.
  const cached = await readFreshCache(CACHE_KEY);
  if (cached) return cached;

  // 1. Dedicated backend endpoint, when configured.
  const url = constant.WORD_OF_DAY_API_URL;
  if (url) {
    try {
      const mapped = mapWord(await fetchJson(url));
      if (mapped) {
        writeCache(CACHE_KEY, mapped);
        return mapped;
      }
    } catch (err) {
      logNetworkError(`getWordOfDay (api) failed: ${err?.message || err}`, err);
    }
  }

  // 2. Derive from today's real hukamnama.
  try {
    if (requireOnline && !(await isOnline())) throw new OfflineError();
    const derived = deriveFromHukamnama(await fetchJson(hukamnamaUrl()));
    if (derived) {
      writeCache(CACHE_KEY, derived);
      return derived;
    }
  } catch (err) {
    if (err instanceof OfflineError) throw err;
    logNetworkError(`getWordOfDay (hukamnama) failed: ${err?.message || err}`, err);
  }

  // 3. Offline / no internet for more than a day → the bundled list, which
  //    mirrors the backend's, so this is the same word the API would have
  //    returned today. Deliberately NOT cached: caching it would make the
  //    fallback outlive the outage, and `_source: "fallback"` is what tells the
  //    Discover card to refetch once connectivity returns.
  return fallbackWord();
};

export default getWordOfDay;
