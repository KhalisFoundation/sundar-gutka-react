export const TOGGLE_NIGHT_MODE = "TOGGLE_NIGHT_MODE";
export const SET_FONT_SIZE = "SET_FONT_SIZE";
export const SET_FONT_FACE = "SET_FONT_FACE";
export const SET_BANI_FONT_FACE = "SET_BANI_FONT_FACE";
export const SET_OWN_BANI_FONT_FACE = "SET_OWN_BANI_FONT_FACE";
export const SET_LANGUAGE = "SET_LANGUAGE";
export const TOGGLE_TRANSLITERATION = "TOGGLE_TRANSLITERATION";
export const SET_TRANSLITERATION = "SET_TRANSLITERATION";
export const SET_THEME = "SET_THEME";
// Records that a designed theme's suggested display settings have been applied
// once, so choosing it again never overrides a later manual change.
export const MARK_READER_THEME_SEEDED = "MARK_READER_THEME_SEEDED";
export const TOGGLE_SCREEN_AWAKE = "TOGGLE_SCREEN_AWAKE";
export const TOGGLE_STATUS_BAR = "TOGGLE_STATUS_BAR";
export const TOGGLE_AUTO_SCROLL = "TOGGLE_AUTO_SCROLL";
export const SET_BANI_LENGTH = "SET_BANI_LENGTH";
export const TOGGLE_LARIVAAR = "TOGGLE_LARIVAAR";
export const TOGGLE_LARIVAAR_ASSIST = "TOGGLE_LARIVAAR_ASSIST";
export const TOGGLE_PARAGRAPH_MODE = "TOGGLE_PARAGRAPH_MODE";
export const SET_PADCHHED = "SET_PADCHHED";
export const TOGGLE_VISHRAAM = "TOGGLE_VISHRAAM";
export const SET_VISHRAAM_OPTION = "SET_VISHRAAM_OPTION";
export const SET_VISHRAAM_SOURCE = "SET_VISHRAAM_SOURCE";
export const TOGGLE_STATISTICS = "TOGGLE_STATISTICS";
export const TOGGLE_ENGLISH_TRANSLATION = "TOGGLE_ENGLISH_TRANSLATION";
export const TOGGLE_PUNJABI_TRANSLATION = "TOGGLE_PUNJABI_TRANSLATION";
export const TOGGLE_SPANISH_TRANSLATION = "TOGGLE_SPANISH_TRANSLATION";
export const SET_BOOKMARK_POSITION = "SET_BOOKMARK_POSITION";
export const SET_BOOKMARK_SEQUENCE_STRING = "SET_BOOKMARK_SEQUENCE_STRING";
export const TOGGLE_REMINDERS = "TOGGLE_REMINDERS";
export const SET_REMINDER_BANIS = "SET_REMINDER_BANIS";
export const SET_REMINDER_SOUND = "SET_REMINDER_SOUND";
export const SET_AUTO_SCROLL_SPEED = "SET_AUTO_SCROLL_SPEED";
export const SET_CACHE_SHABAD = "SET_CACHE_SHABAD";
export const SET_SAVE_POSITION = "SET_SAVE_POSITION";
export const SET_BANI_LIST = "SET_BANI_LIST";
export const SET_BANI_ORDER = "SET_BANI_ORDER";
export const SET_SCROLL_POSITION = "SET_SCROLL_POSITION";
export const TOGGLE_HEADER_FOOTER = "TOGGLE_HEADER_FOOTER";
export const TOGGLE_DATABASE_UPDATE_AVAILABLE = "TOGGLE_DATABASE_UPDATE_AVAILABLE";
export const TOGGLE_AUDIO = "TOGGLE_AUDIO";
export const TOGGLE_AUDIO_FEATURE_ENABLED = "TOGGLE_AUDIO_FEATURE_ENABLED";
export const TOGGLE_AUDIO_AUTO_PLAY = "TOGGLE_AUDIO_AUTO_PLAY";
export const TOGGLE_AUDIO_SYNC_SCROLL = "TOGGLE_AUDIO_SYNC_SCROLL";
export const SET_DEFAULT_AUDIO = "SET_DEFAULT_AUDIO";
export const SET_AUDIO_PLAYBACK_SPEED = "SET_AUDIO_PLAYBACK_SPEED";
export const SET_CURRENT_BANI = "SET_CURRENT_BANI";

// Manifest actions
export const SET_AUDIO_MANIFEST = "SET_AUDIO_MANIFEST";

// Audio catalog cache — the persisted offline copy of the backend /audios
// manifest, keyed by baniId. Populated by the eager catalog sync and per-bani
// lazy refresh; read as the offline source for the audio player.
export const SET_AUDIO_CATALOG_ENTRIES = "SET_AUDIO_CATALOG_ENTRIES";
export const SET_AUDIO_CATALOG_ENTRY = "SET_AUDIO_CATALOG_ENTRY";
export const SET_AUDIO_CATALOG_META = "SET_AUDIO_CATALOG_META";
export const CLEAR_AUDIO_CATALOG = "CLEAR_AUDIO_CATALOG";

// Audio progress actions
export const SET_AUDIO_PROGRESS = "SET_AUDIO_PROGRESS";
export const CLEAR_AUDIO_PROGRESS = "CLEAR_AUDIO_PROGRESS";

// Reader tap signal — incremented on each tap in the bani WebView so the
// floating mini player can toggle its expanded/collapsed state.
export const BUMP_READER_TAP = "BUMP_READER_TAP";
// Scroll DOWN in the reader. The counterpart of the tap above: a tap grows the
// floating audio player back to its pill, scrolling away shrinks it to the
// circle. See MinimizePlayer.
export const BUMP_READER_SCROLL_DOWN = "BUMP_READER_SCROLL_DOWN";

// Seva Donor actions
export const SET_DONOR_STATE = "SET_DONOR_STATE";
export const CLEAR_DONOR_STATE = "CLEAR_DONOR_STATE";

// Floating mini-player drag state — used to disable WebView scroll while dragging
export const SET_PLAYER_DRAGGING = "SET_PLAYER_DRAGGING";

// Download queue
export const ENQUEUE_DOWNLOAD = "ENQUEUE_DOWNLOAD";
export const UPDATE_DOWNLOAD_STATUS = "UPDATE_DOWNLOAD_STATUS";
export const UPDATE_DOWNLOAD_PROGRESS = "UPDATE_DOWNLOAD_PROGRESS";
export const REMOVE_DOWNLOAD_QUEUE_ENTRY = "REMOVE_DOWNLOAD_QUEUE_ENTRY";
export const RETRY_DOWNLOAD = "RETRY_DOWNLOAD";
export const REQUEUE_PAUSED_DOWNLOADS = "REQUEUE_PAUSED_DOWNLOADS";

// Download registry
export const ADD_DOWNLOAD_ENTRY = "ADD_DOWNLOAD_ENTRY";
export const REMOVE_DOWNLOAD_ENTRIES = "REMOVE_DOWNLOAD_ENTRIES";
export const UPDATE_DOWNLOAD_ENTRIES = "UPDATE_DOWNLOAD_ENTRIES";
export const SET_DOWNLOAD_REGISTRY = "SET_DOWNLOAD_REGISTRY";
export const CLEAR_DOWNLOAD_REGISTRY = "CLEAR_DOWNLOAD_REGISTRY";

// Download settings
export const TOGGLE_DOWNLOAD_WIFI_ONLY = "TOGGLE_DOWNLOAD_WIFI_ONLY";
export const TOGGLE_AUTO_DOWNLOAD = "TOGGLE_AUTO_DOWNLOAD";

// Onboarding carousel guide
// Transient visibility of the full-screen onboarding carousel (not persisted —
// see store.js blacklist). Toggled true on a fresh install and by "Revisit".
export const SET_ONBOARDING_VISIBLE = "SET_ONBOARDING_VISIBLE";
// Persisted "the user has finished/skipped the carousel once" flag, so the
// first-run auto-open never resurfaces on later launches.
export const SET_ONBOARDING_SEEN = "SET_ONBOARDING_SEEN";
// ─── Khalis SSO session ─────────────────────────────────────────────────────
// Decoded claims only — the raw JWT lives in the Keychain, never in Redux.
export const SET_AUTH_SESSION = "SET_AUTH_SESSION";
export const CLEAR_AUTH_SESSION = "CLEAR_AUTH_SESSION";
export const SET_AUTH_BUSY = "SET_AUTH_BUSY";
// Drops every slice belonging to a PERSON rather than to this device. Fired on
// sign-out and when a DIFFERENT account signs in; see common/sso/accountScope.js
// and USER_DATA_SLICES in common/reducer.js.
export const CLEAR_USER_DATA = "CLEAR_USER_DATA";

// ─── Dashboard redesign ─────────────────────────────────────────────────────
// Local editable user profile, synced per-device. Kept separate from the SSO
// session above: this one is written by the cloud restore, so merging the two
// would let a stale snapshot overwrite the signed-in user's real name.
export const SET_USER_PROFILE = "SET_USER_PROFILE";

// Customizable dashboard layout — section order + hidden sections
export const SET_DASHBOARD_LAYOUT = "SET_DASHBOARD_LAYOUT";
export const RESET_DASHBOARD_LAYOUT = "RESET_DASHBOARD_LAYOUT";

// Today's Nitnem — the per-day completion map. WHICH banis are in the Nitnem
// is the Morning Nitnem pothi's business, so there is no "set the banis" action
// here; the card edits the pothi through ADD_BANI_TO_POTHI/REMOVE_BANI_FROM_POTHI.
export const TOGGLE_NITNEM_DONE = "TOGGLE_NITNEM_DONE";
export const MARK_NITNEM_AUTO_DONE = "MARK_NITNEM_AUTO_DONE";
export const MARK_NITNEM_DONE = "MARK_NITNEM_DONE";
// Restore the whole nitnem slice at once (cross-device sync / GET /dashboard/latest)
export const RESTORE_NITNEM = "RESTORE_NITNEM";

// My Pothi — user-made folders of banis, ordered and pinned by the user
export const CREATE_POTHI = "CREATE_POTHI";
export const RENAME_POTHI = "RENAME_POTHI";
export const DELETE_POTHI = "DELETE_POTHI";
export const ADD_BANI_TO_POTHI = "ADD_BANI_TO_POTHI";
export const REMOVE_BANI_FROM_POTHI = "REMOVE_BANI_FROM_POTHI";
export const SET_POTHI_ORDER = "SET_POTHI_ORDER";
export const TOGGLE_POTHI_PIN = "TOGGLE_POTHI_PIN";
// Seeded once: Morning + Evening Nitnem. Tracked so a user who deletes them
// does not find them back on the next launch.
export const SEED_DEFAULT_POTHIS = "SEED_DEFAULT_POTHIS";
// Cloud sync — folder-level last-write-wins against GET /folders.
export const MERGE_REMOTE_POTHIS = "MERGE_REMOTE_POTHIS";
export const SET_POTHIS_SYNCED_AT = "SET_POTHIS_SYNCED_AT";
// One tombstone retired, after DELETE /folders/:id came back 204.
export const POTHI_DELETE_SYNCED = "POTHI_DELETE_SYNCED";
// The server watermark from the last folders read, sent back as `since`.
export const SET_POTHI_SYNC_WATERMARK = "SET_POTHI_SYNC_WATERMARK";
// "Replace with cloud copy": local pothis give way to the account's.

// Sync outbox — changes to account data waiting to reach the server.
export const ENQUEUE_SYNC_OP = "ENQUEUE_SYNC_OP";
export const SYNC_OP_SENDING = "SYNC_OP_SENDING";
export const SYNC_OP_DONE = "SYNC_OP_DONE";
export const SYNC_OP_FAILED = "SYNC_OP_FAILED";
export const CLEAR_SYNC_FEATURE = "CLEAR_SYNC_FEATURE";

// Reminder sync bookkeeping: per-reminder clocks, tombstones, server bases.
export const MERGE_REMINDER_SYNC_META = "MERGE_REMINDER_SYNC_META";

// Reading themes served by the backend, merged over the bundled set.
export const SET_REMOTE_THEMES = "SET_REMOTE_THEMES";

// Settings sync bookkeeping: per-key clocks and server bases.
export const MERGE_SETTINGS_SYNC_META = "MERGE_SETTINGS_SYNC_META";
