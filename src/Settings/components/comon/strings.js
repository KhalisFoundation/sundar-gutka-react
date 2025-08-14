import { constant } from "@common";

export const getFontSizes = (strings) => [
  { key: "EXTRA_SMALL", title: strings.extra_small },
  { key: "SMALL", title: strings.small_default },
  { key: "MEDIUM", title: strings.medium },
  { key: "LARGE", title: strings.large },
  { key: "EXTRA_LARGE", title: strings.extra_large },
];

export const getFontFaces = (strings) => [
  { key: "AnmolLipiSG", title: strings.anmol_lipi },
  { key: "GurbaniAkharTrue", title: strings.gurbani_akhar_default },
  { key: "GurbaniAkharHeavyTrue", title: strings.gurbani_akhar_heavy },
  { key: "GurbaniAkharThickTrue", title: strings.gurbani_akhar_think },
  { key: "BalooPaaji2-Regular", title: strings.baloo_paaji },
  { key: "BalooPaaji2-Bold", title: strings.baloo_paaji_thick },
  { key: "BalooPaaji2-Medium", title: strings.baloo_paaji_medium },
];

export const getBaniLengths = (strings) => [
  { key: "SHORT", title: strings.short },
  { key: "MEDIUM", title: strings.medium },
  { key: "LONG", title: strings.long },
  { key: "EXTRA_LONG", title: strings.extra_long },
];

export const getLanguages = (strings) => [
  { key: "DEFAULT", title: `${strings.default}` },
  { key: "en-US", title: constant.ENGLISH_TITLE_CASE },
  { key: "es", title: constant.ESPANOL },
  { key: "fr", title: constant.FRANCAIS },
  { key: "it", title: constant.ITALIANO },
  { key: "hi", title: constant.HINDI_UNICODE },
  { key: "pa", title: constant.PUNJABI },
];

export const getPadched = (strings) => [
  { key: "SAT_SUBHAM_SAT", title: strings.sat_subham_sat_default },
  { key: "MAST_SABH_MAST", title: strings.mast_sabh_mast },
];

export const getTheme = (strings) => [
  { key: "Default", title: strings.default },
  { key: "Light", title: strings.light },
  { key: "Dark", title: strings.dark },
];

export const getTransliteration = (strings) => [
  { key: "ENGLISH", title: strings.english },
  { key: "HINDI", title: strings.hindi },
  { key: "SHAHMUKHI", title: strings.shahmukhi },
  { key: "IPA", title: strings.ipa },
];

export const getVishraamOption = (strings) => [
  { key: "VISHRAAM_COLORED", title: strings.colored_words },
  { key: "VISHRAAM_GRADIENT", title: strings.gradient_background },
];

export const getVishraamSource = (strings) => [
  { key: "sttm", title: strings.banidb_living_default },
  { key: "igurbani", title: strings.iGurbani },
  { key: "sttm2", title: strings.sttm2 },
];

export const getReminderSound = (strings) => [
  {
    key: "default",
    title: strings.default,
  },
  { key: "wake_up_jap.mp3", title: strings.wake_up_jap },
  { key: "waheguru_soul.mp3", title: strings.waheguru_soul },
];
