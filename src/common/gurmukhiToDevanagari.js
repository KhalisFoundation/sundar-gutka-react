/**
 * Gurmukhi → Devanagari transliteration (script conversion, not translation).
 *
 * Used so the Dashboard "Word of the Day" can show the word in the reader's own
 * script: ਸੰਤ (Punjabi) → संत (Hindi). The two scripts are parallel Brahmic
 * blocks, so most code points map by a fixed −0x100 offset
 * (Gurmukhi U+0Axx → Devanagari U+09xx); only a handful of signs need special
 * handling (tippi/addak, and the ਸ਼→श nukta case). This is deterministic and
 * font-agnostic — no Intl, no network.
 *
 * Scope: the short single words the word-of-day surfaces. It is not a full
 * Gurbani transliteration engine (no ੴ, halant-cluster niceties beyond the
 * common cases), which is why it lives here and not in the reader.
 */

const TIPPI = "ੰ"; // ੰ  → anusvara ं
const ADDAK = "ੱ"; // ੱ  → gemination (doubles the next consonant)
const NUKTA = "਼"; // ਼
const VIRAMA_DEV = "्"; // ्  (Devanagari halant)
const ANUSVARA = "ं"; // ं

const isGurmukhi = (ch) => ch >= "਀" && ch <= "੿";
// Devanagari consonants क(0915)…ह(0939); used to know whether addak can apply.
const isDevConsonant = (ch) => ch >= "क" && ch <= "ह";

// −0x100 maps the aligned Gurmukhi range (vowels, consonants, matras, virama,
// bindi, visarga) straight onto Devanagari.
const shift = (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x100);

// Nukta letters that have a dedicated Devanagari letter rather than base+nukta.
// (ਖ਼ ਗ਼ ਜ਼ ਫ਼ correctly become ख़ ग़ ज़ फ़ via plain base+nukta, so only ਸ਼ and ਲ਼
// need an override.)
const NUKTA_OVERRIDES = {
  "ਸ": "श", // ਸ਼ (sa+nukta) → श  (SHA)
  "ਲ": "ळ", // ਲ਼ (la+nukta) → ळ  (LLA)
};

export const gurmukhiToDevanagari = (input) => {
  const src = String(input || "");
  let out = "";
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === TIPPI) {
      out += ANUSVARA;
      continue;
    }
    if (ch === ADDAK) {
      // Gemination: the following consonant is doubled → emit (thatConsonant +
      // halant) now; the consonant itself is emitted on the next iteration.
      const dev = next && isGurmukhi(next) ? shift(next) : "";
      if (isDevConsonant(dev)) out += dev + VIRAMA_DEV;
      continue;
    }
    if (next === NUKTA && NUKTA_OVERRIDES[ch]) {
      out += NUKTA_OVERRIDES[ch];
      i += 1; // consume the nukta
      continue;
    }
    out += isGurmukhi(ch) ? shift(ch) : ch; // pass punctuation/spaces through
  }
  return out;
};

export default gurmukhiToDevanagari;
