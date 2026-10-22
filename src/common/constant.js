// Khalis backend base URL (reading themes, audio and Seva; Dashboard later).
const KHALIS_API_BASE = "https://users.khalis.net";

export default {
  DB: "gutka_v01",
  ENGLISH: "ENGLISH",
  ENGLISH_TITLE_CASE: "English",
  HINDI: "HINDI",
  SHAHMUKHI: "SHAHMUKHI",
  IPA: "IPA",
  GURBANI_AKHAR_TRUE: "GurbaniAkharTrue",
  GURBANI_AKHAR_THICK_TRUE: "GurbaniAkharThickTrue",
  BALOO_PAAJI: "BalooPaaji2-Regular",
  BALOO_PAAJI_SEMI_BOLD: "BalooPaaji2-SemiBold",
  GURBANI_AKHAR_HEAVY_TRUE: "GurbaniAkharHeavyTrue",
  ANMOL_LIPI: "AnmolLipiSG",
  READER: "Reader",
  SETTINGS: "Settings",
  SEVA: "Seva",
  EXTRA_SMALL: "EXTRA_SMALL",
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
  EXTRA_LARGE: "EXTRA_LARGE",
  DEFAULT: "DEFAULT",
  HINDI_UNICODE: `हिंदी`,
  PUNJABI: `ਪੰਜਾਬੀ`,
  FRANCAIS: `Français`,
  ESPANOL: `Español`,
  ITALIANO: "Italiano",
  Default: "Default",
  SAT_SUBHAM_SAT: "SAT_SUBHAM_SAT",
  Light: "Light",
  Dark: "Dark",
  EXTRA_LONG: "EXTRA_LONG",
  LONG: "LONG",
  SHORT: "SHORT",
  EXISTS_BUDDHA_DAL: "existsBuddhaDal",
  EXISTS_TAKSAL: "existsTaksal",
  EXISTS_MEDIUM: "existsMedium",
  EXISTS_SGPS: "existsSGPC",
  GURMUKHI: "GURMUKHI",
  TRANSLITERATION: "TRANSLITERATION",
  TRANSLATION: "TRANSLATION",
  REMINDER_OPTIONS: "Reminder Options",
  KHALIS_FOUNDATION_URL: "https://khalisfoundation.org",
  KHALIS_PRIVACY_POLICY_URL: "https://khalisfoundation.org/about/privacy-policy/",
  BANI_DB_URL: "https://www.banidb.com/",
  sttm: "sttm",
  VISHRAAM_COLORED: "VISHRAAM_COLORED",
  VISHRAAM_GRADIENT: "VISHRAAM_GRADIENT",
  MAST_SABH_MAST: "MAST_SABH_MAST",
  DEFAULT_SPEED: 50,
  MARK_AS_READ: "mark-as-read",
  SOUND: "sound",
  REMINDERS_DEFAULT: "Reminders default",
  ALERT_DESCRIPTION: "Alert notification reminders for chosen Bani",
  WAHEGURU_SOUL: "waheguru_soul",
  REMINDERS_WAHEGURU_SOUL: "Reminders waheguru soul",
  WAKE_UP_JAP: "wake_up_jap",
  REMINDERS_WAKE_UP: "Reminders wake up jap",
  FOLDERSCREEN: "FolderScreen",
  HOME_SCREEN: "Home Screen",
  ABOUT_SCREEN: "About Screen",
  FALLBACK_SCREEN: "Fallback Screen",
  BOOKMARKS: "Bookmarks",
  FONT_SIZE: "fontSize",
  FONT_FACE: "fontFace",
  LANGUAGE: "appLanguage",
  TRANSLITERATION_LANGUAGE: "transliterationLanguage",
  SPANISH: "spanish",
  NIGHT_MODE: "nightMode",
  KEEP_AWAKE: "keepAwake",
  BANI_LENGTH: "baniLength",
  THEME: "Theme",
  LARIVAAR: "larivaar",
  LARIVAAR_ASSIST: "larivaarAssist",
  PADCHED: "padched",
  STATISTICS: "statistics",
  STATUS_BAR: "statusBar",
  PARAGRAPH: "paragraph",
  AUTO_SCROLL: "autoScroll",
  AUDIO: "audio",
  AUDIO_AUTO_PLAY: "audioAutoPlay",
  AUDIO_SYNC_SCROLL: "audioSyncScroll",
  DEFAULT_AUDIO: "defaultAudio",
  VISHRAAM: "vishraam",
  VISHRAAM_OPTION: "vishraamOption",
  VISHRAAM_SOURCE: "vishraamSource",
  REMINDERS: "reminders",
  REMINDER_SOUND: "reminderSound",
  EDIT_BANI_ORDER: "Edit Bani Order",
  ADD_REMINDER: "addReminder",
  RESET_REMINDER: "resetReminderDefault",
  UPDATE_REMINDER: "updateReminder",
  PORTRAIT: "PORTRAIT",
  LANDSCAPE: "LANDSCAPE",
  REMOTE_DB_URL: "https://banidb.blob.core.windows.net/database",
  CHOPAYI_SAHIB_ID: 9,
  REHRAAS_SAHIB_ID: 21,
  BANI_IDS_WITH_LENGTH_VARIANTS: [9, 21, 23],
  MAST_SABH_MAST_TUKK: "smwpq msqu suB msqu",
  MAST_SABH_MAST_TUKK_UNI: "ਸਮਾਪਤ ਮਸਤੁ ਸੁਭ ਮਸਤੁ",
  MINIMUM_BOTTOM_PADDING: 35,
  defaultBani: {
    id: 1,
    title: "gur mMqR",
    titleUni: "ਗੁਰ ਮੰਤ੍ਰ",
  },
  INTERNET_CHECK_URL: "https://www.gstatic.com/generate_204",
  ICON_SIZE_SMALL: 18,
  // My Pothi switch. Off until the My Pothi PR: the Reader's add-to-pothi button
  // reads it, and there are no pothis to add to yet.
  POTHI_ENABLED: false,
  SEVA_CONFIG_API_URL: `${KHALIS_API_BASE}/seva/config`,
  // "Seva by other means" pages (public, no auth). Each returns a translated,
  // constrained HTML content fragment the app renders natively and caches (per
  // page + language) for offline use. The path segment matches the page key
  // sent by services/sevaMeans.js.
  SEVA_MEANS_API_BASE: KHALIS_API_BASE,
  // Reading themes served by the backend (public, no auth), merged over the
  // bundled set — see theme/reader/registry.
  THEMES_API_URL: `${KHALIS_API_BASE}/themes`,
  // Khalis audio catalog (public, no auth): GET /audios/:baniId. This is the
  // SINGLE, authoritative source for the audio manifest — reciters, track URLs,
  // durations, sizes and lyrics URLs all live server-side, so adding/changing a
  // track is a backend data change, never an app release. The app never falls
  // back to hardcoded track data; its only offline source is the persisted
  // audioCatalog cache (see reducer.js) that this endpoint populates.
  AUDIO_API_BASE: `${KHALIS_API_BASE}/audios`,
  // Bani IDs known to have audio. Used by the eager catalog prefetch
  // (useAudioCatalogSync) to warm the offline cache, since the backend has no
  // bulk "all banis" endpoint yet — GET /audios/:id is per-bani only. Banis the
  // user opens are also cached lazily on visit regardless of this list, so a
  // newly audio-enabled bani still works when visited; this list only controls
  // which banis are PRE-warmed for offline. Replace with a catalog endpoint when
  // the backend ships one. (Integers only — not URLs or track data.)
  AUDIO_BANI_IDS: [2, 4, 6, 9, 10, 21, 23, 1000],
  // A cached bani manifest older than this is refreshed from the network on the
  // next visit / catalog sync (while online). Stale-but-present cache is always
  // used immediately; the refresh happens in the background.
  AUDIO_CATALOG_TTL_MS: 24 * 60 * 60 * 1000,
  // Max parallel manifest fetches during the eager catalog prefetch, so a cold
  // sync never fans out ~30 simultaneous requests on a low-end device.
  AUDIO_CATALOG_SYNC_CONCURRENCY: 4,
  // How long after launch the eager catalog sweep may begin. The sweep has no
  // deadline at all — its cache is read on the NEXT visit to a bani — while
  // everything it competes with at launch does: on a fresh install the bundled
  // DB seed alone is multiple seconds of I/O. Measured on device.
  AUDIO_CATALOG_SYNC_DELAY_MS: 12000,
  // How long after launch the reading-theme catalogue may be topped up. It is
  // ONE small request, read only when the theme picker is opened, so it has no
  // launch deadline, while the DB seed and the first Home mount do.
  THEMES_SYNC_DELAY_MS: 8000,
};
