// Khalis backend base URL (Seva + Dashboard APIs).
//
// ── PRODUCTION (Azure Container Apps) ───────────────────────────────────────
const KHALIS_API_BASE = "https://users.khalis.net";
//
// ── LOCAL DEV ───────────────────────────────────────────────────────────────
// To test against the backend running on THIS machine (khalis-users-api → PORT
// 3500), swap in the line below. On a USB device/emulator run once:
//   adb reverse tcp:3500 tcp:3500
// (cleartext to localhost is allowed — see android res/xml/
// network_security_config.xml). Reset Metro: react-native start --reset-cache.
// const KHALIS_API_BASE = "http://localhost:3500";

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
  // Kulbir Singh Thind's manuscript hand, from tatkhalsa.org. ASCII-encoded like
  // Gurbani Akhar and Anmol Lipi, so it reads the same `gurmukhi` column they do.
  // The value is the font's own PostScript name, which is also its filename —
  // iOS resolves the @font-face url against the bundle by that name.
  PURATAN_HASTLIKHAT: "Puratan_Hastlikhat",
  READER: "Reader",
  SETTINGS: "Settings",
  DASHBOARD: "Dashboard",
  SEVA: "Seva",
  DATABASE_UPDATE: "DatabaseUpdate",
  // This app's own store identity, so an "update available" push can open
  // the listing. The iOS id is the App Store's, not the bundle id.
  APP_ANDROID_PACKAGE: "com.WahegurooNetwork.SundarGutka",
  APP_IOS_APP_ID: "431446112",
  // The current onboarding-carousel version. The carousel auto-opens whenever a
  // user's persisted `seenOnboardingVersion` is below this number, so every
  // build that bumps this re-shows the carousel exactly once to EVERYONE on
  // their next launch — fresh installs, updaters from old versions, and users
  // who already saw an earlier onboarding alike. Bump it whenever the
  // onboarding content should be force-shown again.
  ONBOARDING_VERSION: 1,
  // Master switch for the onboarding carousel. While false the carousel never
  // auto-opens and the Settings "Revisit Tutorial" row is hidden, so it cannot
  // be reached at all. The carousel and its slides stay in the build untouched:
  // set this back to true to restore the feature with no other change.
  ONBOARDING_ENABLED: false,
  // Master switch for My Pothi — the folders a USER makes. While false, Home
  // has no tab bar at all: it is one bani list with Sundar Gutka's own bundled
  // folders sitting in it, exactly as it was before My Pothi existed. The
  // reader's add-to-pothi button is hidden with it, so there is no way to
  // create, rename, reorder, pin or delete a pothi. The feature stays in the
  // build: set this back to true to restore it with no other change.
  //
  // The pothi SLICE and usePothiSync keep running either way, deliberately.
  // Today's Nitnem on the Dashboard IS the Morning Nitnem pothi (see
  // TodaysNitnem), so disabling those would empty that section — and for
  // signed-in users especially, whose copy comes from the server pull.
  POTHI_ENABLED: true,
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
  POTHI_READER: "PothiReader",
  MY_POTHIS: "MyPothis",
  HOME_SCREEN: "Home Screen",
  ABOUT_SCREEN: "About Screen",
  FALLBACK_SCREEN: "Fallback Screen",
  BOOKMARKS: "Bookmarks",
  FONT_SIZE: "fontSize",
  FONT_FACE: "fontFace",
  BANI_FONT_FACE: "baniFontFace",
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
  AUTO_SCROLL_SPEED: "autoScrollSpeed",
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
  ICON_SIZE_SMALL: 18,
  ANALYTICS_DB_NAME: "analytics_v01.db",
  // A day counts toward the streak when reading and listening COMBINED reach
  // this many seconds. The two channels POOL — 3 min read + 3 min listened is
  // an active day. They were previously judged separately (>=240 in EITHER
  // channel), which silently failed anyone who split their time between them.
  MIN_DAILY_ACTIVE_SECONDS: 240,
  KHALIS_APPS_API_URL: "",
  ANALYTICS_SYNC_API_URL: "",

  // ─── Dashboard redesign ───────────────────────────────────────────────────
  // Section keys for the customizable dashboard layout (order below = default order).
  DASHBOARD_SECTIONS: {
    STREAK: "streak",
    NITNEM: "nitnem",
    EXPLORE: "explore",
    PRACTICE: "practice",
    CALENDAR: "calendar",
    WEEK_CHART: "weekChart",
    DISCOVER: "discover",
    REMINDERS: "reminders",
    // Combined tabbed card (Today's Vaak + Random Shabad). Replaces the former
    // standalone RANDOM_SHABAD ("randomShabad") and VAAK ("vaak") sections; those
    // legacy keys are migrated/stripped on rehydrate (see reducer.js).
    SHABAD_VAAK: "shabadVaak",
  },
  // Minimum number of visible sections the user must keep when customizing layout.
  DASHBOARD_MIN_VISIBLE: 4,
  // Earliest month history browsing (calendar arrows, week nav, date picker) is
  // allowed to reach — there is no activity data before this, by product
  // decision, regardless of what a device's local SQLite table might contain.
  DASHBOARD_HISTORY_FLOOR: { year: 2026, month: 7 },
  // There is no default Nitnem bani set here any more. Today's Nitnem is the
  // Morning Nitnem pothi, so the list lives with the pothi that owns it —
  // `MORNING_NITNEM_IDS` in `common/pothi/model.js`.

  // ─── Khalis SSO ───────────────────────────────────────────────────────────
  // The Service Provider fronts a SAML IdP and hands us a plain JWT — this app
  // never speaks SAML. Point SSO_SERVICE_URL at a staging SP to test against a
  // non-production IdP. See docs/SSO.md.
  SSO_SERVICE_URL: "https://serviceprovider.khalis.net",
  // The IdP itself, which owns the ACCOUNT rather than the session. Only
  // account deletion talks to it: the SP issues and ends sessions, but only
  // WordPress can schedule the account's removal. It verifies the SP's JWT by
  // calling the SP's /user, so the app needs no second credential.
  //
  // A separate constant rather than a path off SSO_SERVICE_URL because they are
  // different hosts, and a staging run has to be able to move one without the
  // other (dev.sso.khalis.net against a production SP, and the reverse).
  SSO_IDP_URL: "https://sso.khalis.net",
  // Return deep links, registered in AndroidManifest.xml (on MainActivity) and
  // ios/SundarGutka/Info.plist. These MUST stay free of any query string: the
  // SP's success page builds the return URL as `${redirect_url}?token=${token}`
  // with a hardcoded "?", so appending e.g. "?from=settings" here yields a
  // malformed two-"?" URL and the token is lost.
  SSO_LOGIN_REDIRECT: "sundargutka://login",
  SSO_LOGOUT_REDIRECT: "sundargutka://logout",
  // Keychain service name the session JWT is stored under.
  SSO_KEYCHAIN_SERVICE: "khalis_sso",
  // Whether /dashboard/cache is keyed on the SSO account.
  //
  // TRUE: the backend keys snapshots on the account (userId_syncDate), so the
  // account-switch purge CLEARS the restore marker and the signing-in account
  // pulls its OWN snapshot back.
  //
  // It must not be flipped ahead of the server. While the backend still keyed
  // on deviceId, restoring after a switch fetched this DEVICE's latest
  // snapshot — handing the new account the previous one's data, the exact bug
  // the purge exists to fix. See docs/SSO.md.
  SSO_ACCOUNT_SCOPED_SYNC: true,
  // Show the TECHNICAL reason a sync did not happen under the dashboard date —
  // "never (HTTP 500)", "never (restore-pending)" and so on.
  //
  // Off for release. Those strings are diagnostics, not product copy: they are
  // meaningless to someone reading their nitnem, and one of them (HTTP 500)
  // reads as the app being broken even when the cause is a server-side problem
  // already being fixed. With this off the line is a plain timestamp, or the
  // localised "never".
  //
  // It earned its keep, though — this readout is how the stale device-scoped
  // unique index was finally identified after days of guessing. Flip it to true
  // to get that back rather than deleting the machinery.
  SYNC_DIAGNOSTICS: false,

  // Khalis backend endpoints (all derived from KHALIS_API_BASE above).
  DASHBOARD_API_BASE_URL: KHALIS_API_BASE,
  // Push device registry (src/push in the API). Registers this device's FCM
  // token — anonymously before sign-in, attached to the account after — so a
  // campaign can be aimed at a person, a platform or a language.
  PUSH_DEVICES_API_URL: `${KHALIS_API_BASE}/push/devices`,
  SEVA_CONFIG_API_URL: `${KHALIS_API_BASE}/seva/config`,
  // "Seva by other means" pages (public, no auth). Each returns a translated,
  // constrained HTML content fragment the app renders natively and caches (per
  // page + language) for offline use. The path segment matches the page key
  // sent by services/sevaMeans.js.
  SEVA_MEANS_API_BASE: KHALIS_API_BASE,
  // Reading themes served by the backend (public, no auth), merged over the
  // bundled set — see theme/reader/registry.
  THEMES_API_URL: `${KHALIS_API_BASE}/themes`,
  // The Dashboard's Explore tiles with labels resolved per language.
  EXPLORE_LINKS_API_URL: `${KHALIS_API_BASE}/explore-links`,
  DAILY_VAAK_API_URL: `${KHALIS_API_BASE}/dashboard/daily-vaak`,
  WORD_OF_DAY_API_URL: `${KHALIS_API_BASE}/dashboard/word-of-day`,
  // Both are public and keyed on deviceId — deliberately NOT behind the SSO
  // JWT. The backend's dashboard controller has no auth guard (unlike its
  // favourite-shabads/folders/shortcuts controllers) and does not persist a
  // user id, so attaching an Authorization header here would achieve nothing.
  // Per-account sync needs backend work first; see docs/SSO.md.
  DASHBOARD_SYNC_API_URL: `${KHALIS_API_BASE}/dashboard/cache`, // POST, no auth
  DASHBOARD_LATEST_API_URL: `${KHALIS_API_BASE}/dashboard/latest`, // GET, no auth
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
  // How long after launch the reading-theme catalogue may be topped up. Same
  // reasoning as the sweep above and shorter only because it is ONE small
  // request: the catalogue is read when the theme picker is opened, so it has
  // no launch deadline, while the DB seed and the first Home mount do.
  THEMES_SYNC_DELAY_MS: 8000,
  // Random Shabad stays on BaniDB directly (backend proxy was dropped).
  RANDOM_SHABAD_API_URL: "",
  // Backend serves the yearly Gurpurab/events feed here (CMS-style — updated
  // server-side once a year, no app release needed). The app falls back to its
  // bundled local computation when this is unreachable or not yet deployed, so it
  // is safe to point at the endpoint before the backend ships it.
  UPCOMING_EVENTS_API_URL: `${KHALIS_API_BASE}/dashboard/events`,
  // The Nanakshahi date under the Fateh. Proxied by our backend from the
  // SGPC-sourced calendar rather than computed in the app, so the header and
  // the gurpurab list can never disagree about what today is.
  NANAKSHAHI_DATE_API_URL: `${KHALIS_API_BASE}/dashboard/nanakshahi-date`,
  // Per-date activity. The additive counterpart to /dashboard/cache: rows keyed
  // (account, local day, device) that the server SUMS, so a phone and a tablet
  // used on the same day add up instead of overwriting one another.
  DASHBOARD_ACTIVITY_API_URL: `${KHALIS_API_BASE}/dashboard/activity`,
  NANAKSHAHI_API_URL: "",
  // Reachability probe for dashboard network services (see services/dashboard/
  // connectivity.js). Same globally-distributed 204 endpoint the app's NetInfo
  // layer uses (services/networkManager.js) — returns HTTP 204 when there is
  // real internet, so a captive portal (which returns 200) reads as offline.
  INTERNET_CHECK_URL: "https://clients3.google.com/generate_204",
};
