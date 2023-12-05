import STRINGS from "../localization";
import constant from "../constant";

export const THEMES = [
  { key: "Default", title: `${STRINGS.default}` },
  { key: "Light", title: `${STRINGS.light}` },
  { key: "Dark", title: `${STRINGS.dark}` },
];

export const FONT_SIZES = [
  { key: "EXTRA_SMALL", title: `${STRINGS.extra_small}` },
  { key: "SMALL", title: `${STRINGS.small_default}` },
  { key: "MEDIUM", title: `${STRINGS.medium}` },
  { key: "LARGE", title: `${STRINGS.large}` },
  { key: "EXTRA_LARGE", title: `${STRINGS.extra_large}` },
];
export const FONT_FACES = [
  { key: "AnmolLipiSG", title: `${STRINGS.anmol_lipi}` },
  { key: "GurbaniAkharTrue", title: `${STRINGS.gurbani_akhar_default}` },
  { key: "GurbaniAkharHeavyTrue", title: `${STRINGS.gurbani_akhar_heavy}` },
  { key: "GurbaniAkharThickTrue", title: `${STRINGS.gurbani_akhar_think}` },
];

export const LANGUAGES = [
  { key: "DEFAULT", title: `${STRINGS.default}` },
  { key: "en-US", title: constant.ENGLISH },
  { key: "es", title: constant.ESPANOL },
  { key: "fr", title: constant.FRANCAIS },
  { key: "it", title: constant.ITALIANO },
  { key: "hi", title: constant.HINDI },
  { key: "pa", title: constant.PUNJABI },
];

export const TRANSLITERATION_LANGUAGES = [
  { key: "ENGLISH", title: `${STRINGS.english}` },
  { key: "HINDI", title: STRINGS.hindi },
  { key: "SHAHMUKHI", title: STRINGS.shahmukhi },
  { key: "IPA", title: STRINGS.ipa },
];
export const BANI_LENGTHS = [
  { key: "SHORT", title: STRINGS.short },
  { key: "MEDIUM", title: STRINGS.medium },
  { key: "LONG", title: STRINGS.long },
  { key: "EXTRA_LONG", title: STRINGS.extra_long },
];

export const PADCHED_SETTINGS = [
  { key: "SAT_SUBHAM_SAR", title: STRINGS.sat_subham_sat_default },
  { key: "MAST_SABH_MAST", title: STRINGS.mast_sabh_mast },
];

export const VISHRAAM_OPTIONS = [
  { key: "VISHRAAM_COLORED", title: STRINGS.colored_words },
  { key: "VISHRAAM_GRADIENT", title: STRINGS.gradient_background },
];

export const VISHRAAM_SOURCES = [
  { key: "sttm", title: STRINGS.banidb_living_default },
  { key: "igurbani", title: STRINGS.iGurbani },
  { key: "sttm2", title: STRINGS.sttm2 },
];

export const REMINDER_SOUNDS = [
  {
    key: "default",
    title: STRINGS.default,
  },
  { key: "wake_up_jap.mp3", title: STRINGS.wake_up_jap },
  { key: "waheguru_soul.mp3", title: STRINGS.waheguru_soul },
];
