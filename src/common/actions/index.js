import { mergeThemeRegistry } from "@theme/reader/registry";
import constant from "../constant";
import { trackSettingEvent, trackBaniArtistDefault } from "../firebase/analytics";
import STRINGS from "../localization";
import * as actionTypes from "./actionTypes";

export const toggleNightMode = (value) => {
  trackSettingEvent(constant.NIGHT_MODE, value);
  return { type: actionTypes.TOGGLE_NIGHT_MODE, value };
};

export const setFontSize = (value) => {
  trackSettingEvent(constant.FONT_SIZE, value);
  return { type: actionTypes.SET_FONT_SIZE, value };
};
export const setFontFace = (value) => {
  trackSettingEvent(constant.FONT_FACE, value);
  return { type: actionTypes.SET_FONT_FACE, value };
};
export const setBaniFontFace = (value) => {
  trackSettingEvent(constant.BANI_FONT_FACE, value);
  return { type: actionTypes.SET_BANI_FONT_FACE, value };
};

// The reader picking a Bani font for themselves, from Settings. Applied now,
// and remembered as THEIR face — the one a theme with no face of its own puts
// back. See applyTheme.
export const chooseBaniFontFace = (value) => (dispatch) => {
  dispatch(setBaniFontFace(value));
  dispatch({ type: actionTypes.SET_OWN_BANI_FONT_FACE, value });
};

export const setLanguage = (value) => {
  trackSettingEvent(constant.LANGUAGE, value);
  STRINGS.setLanguage(value);
  return { type: actionTypes.SET_LANGUAGE, value };
};
export const toggleTransliteration = (value) => {
  trackSettingEvent(constant.TRANSLITERATION, value);
  return { type: actionTypes.TOGGLE_TRANSLITERATION, value };
};
export const setTransliteration = (value) => {
  trackSettingEvent(constant.TRANSLITERATION, value);
  return { type: actionTypes.SET_TRANSLITERATION, value };
};
// The app's ONE theme setting. `value` is either an appearance keyword
// ("Default" | "Light" | "Dark") or a designed theme's id ("blue", "puratan",
// …), which additionally carries the appearance it pairs with — see
// resolve.js. The seed-once behaviour lives in `applyTheme` at the end of this
// file, which is what Settings dispatches; this stays a plain action so the
// existing callers and tests are unaffected.
export const setTheme = (value) => {
  trackSettingEvent(constant.THEME, value);
  return { type: actionTypes.SET_THEME, value };
};

export const toggleAutoScroll = (value) => {
  trackSettingEvent(constant.AUTO_SCROLL, value);
  return { type: actionTypes.TOGGLE_AUTO_SCROLL, value };
};

export const toggleAudio = (value) => {
  trackSettingEvent(constant.AUDIO, value);
  return { type: actionTypes.TOGGLE_AUDIO, value };
};

export const bumpReaderTap = () => {
  return { type: actionTypes.BUMP_READER_TAP };
};

export const bumpReaderScrollDown = () => {
  return { type: actionTypes.BUMP_READER_SCROLL_DOWN };
};

export const toggleAudioFeatureEnabled = (value) => {
  trackSettingEvent(constant.AUDIO, value);
  return { type: actionTypes.TOGGLE_AUDIO_FEATURE_ENABLED, value };
};

export const toggleAudioAutoPlay = (value) => {
  trackSettingEvent(constant.AUDIO_AUTO_PLAY, value);
  return { type: actionTypes.TOGGLE_AUDIO_AUTO_PLAY, value };
};

export const toggleAudioSyncScroll = (value) => {
  trackSettingEvent(constant.AUDIO_SYNC_SCROLL, value);
  return { type: actionTypes.TOGGLE_AUDIO_SYNC_SCROLL, value };
};

export const setDefaultAudio = (audio, shabadId) => {
  if (audio?.displayName) {
    trackBaniArtistDefault(shabadId, audio.displayName);
  }
  const value = { [shabadId]: audio };
  return { type: actionTypes.SET_DEFAULT_AUDIO, value };
};

export const setAudioPlaybackSpeed = (value) => {
  trackSettingEvent("audioPlaybackSpeed", value);
  return { type: actionTypes.SET_AUDIO_PLAYBACK_SPEED, value };
};

export const setCurrentBani = (bani) => {
  return { type: actionTypes.SET_CURRENT_BANI, value: bani };
};

export const toggleStatusBar = (value) => {
  trackSettingEvent(constant.STATUS_BAR, value);
  return { type: actionTypes.TOGGLE_STATUS_BAR, value };
};
export const toggleScreenAwake = (value) => {
  trackSettingEvent(constant.KEEP_AWAKE, value);
  return { type: actionTypes.TOGGLE_SCREEN_AWAKE, value };
};

export const setBaniLength = (value) => {
  trackSettingEvent(constant.BANI_LENGTH, value);
  return { type: actionTypes.SET_BANI_LENGTH, value };
};
export const toggleLarivaar = (value) => {
  trackSettingEvent(constant.LARIVAAR, value);
  return { type: actionTypes.TOGGLE_LARIVAAR, value };
};

export const toggleLarivaarAssist = (value) => {
  trackSettingEvent(constant.LARIVAAR_ASSIST, value);
  return { type: actionTypes.TOGGLE_LARIVAAR_ASSIST, value };
};

export const toggleParagraphMode = (value) => {
  trackSettingEvent(constant.PARAGRAPH, value);
  return { type: actionTypes.TOGGLE_PARAGRAPH_MODE, value };
};

export const setPadched = (value) => {
  trackSettingEvent(constant.PADCHED, value);
  return { type: actionTypes.SET_PADCHHED, value };
};

export const toggleVishraam = (value) => {
  trackSettingEvent(constant.VISHRAAM, value);
  return { type: actionTypes.TOGGLE_VISHRAAM, value };
};

export const setVishraamOption = (value) => {
  trackSettingEvent(constant.VISHRAAM_OPTION, value);
  return { type: actionTypes.SET_VISHRAAM_OPTION, value };
};

export const setVishraamSource = (value) => {
  trackSettingEvent(constant.VISHRAAM_SOURCE, value);
  return { type: actionTypes.SET_VISHRAAM_SOURCE, value };
};

export const toggleStatistics = (value) => {
  trackSettingEvent(constant.STATISTICS, value);
  return { type: actionTypes.TOGGLE_STATISTICS, value };
};

export const toggleEnglishTranslation = (value) => {
  trackSettingEvent(constant.ENGLISH, value);
  return { type: actionTypes.TOGGLE_ENGLISH_TRANSLATION, value };
};

export const togglePunjabiTranslation = (value) => {
  trackSettingEvent(constant.PUNJABI, value);
  return { type: actionTypes.TOGGLE_PUNJABI_TRANSLATION, value };
};
export const toggleSpanishTranslation = (value) => {
  trackSettingEvent(constant.SPANISH, value);
  return { type: actionTypes.TOGGLE_SPANISH_TRANSLATION, value };
};
export const setBookmarkPosition = (value) => {
  trackSettingEvent(constant.BOOKMARKS, value);
  return { type: actionTypes.SET_BOOKMARK_POSITION, value };
};

export const setBookmarkSequenceString = (value) => {
  return { type: actionTypes.SET_BOOKMARK_SEQUENCE_STRING, value };
};
export const toggleReminders = (value) => {
  trackSettingEvent(constant.REMINDERS, value);
  return { type: actionTypes.TOGGLE_REMINDERS, value };
};

export const setReminderBanis = (value) => {
  return { type: actionTypes.SET_REMINDER_BANIS, value };
};
export const setReminderSound = (value) => {
  trackSettingEvent(constant.REMINDER_SOUND, value);
  return { type: actionTypes.SET_REMINDER_SOUND, value };
};

// One speed for every bani — see the `autoScrollSpeed` reducer.
export const setAutoScrollSpeed = (speed) => {
  trackSettingEvent(constant.AUTO_SCROLL_SPEED, speed);
  return { type: actionTypes.SET_AUTO_SCROLL_SPEED, value: speed };
};
export const setBaniOrder = (value) => {
  return { type: actionTypes.SET_BANI_ORDER, value };
};

export const setBaniList = (value) => {
  return { type: actionTypes.SET_BANI_LIST, value };
};

// The backend's reading themes, already sanitised — see useRemoteThemesSync.
export const setRemoteThemes = ({ version, themes, fetchedAt }) => ({
  type: actionTypes.SET_REMOTE_THEMES,
  payload: { version, themes, fetchedAt },
});

export const setPosition = (elementId, shabadID, sequence = null) => {
  const value = { [shabadID]: { elementId, sequence } };
  return { type: actionTypes.SET_SAVE_POSITION, value };
};

export const setScrollPosition = (value) => {
  return { type: actionTypes.SET_SCROLL_POSITION, value };
};
export const toggleHeaderFooter = (value) => {
  return { type: actionTypes.TOGGLE_HEADER_FOOTER, value };
};

export const toggleDatabaseUpdateAvailable = (value) => {
  return { type: actionTypes.TOGGLE_DATABASE_UPDATE_AVAILABLE, value };
};

// Manifest actions
export const setAudioManifest = (baniId, tracks) => {
  return {
    type: actionTypes.SET_AUDIO_MANIFEST,
    payload: { baniId, tracks },
  };
};

// Audio catalog cache actions
// entry: { groups, baniName, fetchedAt } — the raw length-grouped API response
// for one bani plus the time it was fetched. Stored verbatim so length-group
// selection can happen at read time (one cache entry serves every bani length).
// The whole sweep's worth of entries in ONE action. Each dispatch has the
// entire persisted store re-serialized behind it, so a per-bani dispatch loop
// costs one full serialization per bani — this keeps it at one, however many
// banis the catalog grows to.
export const setAudioCatalogEntries = (entries) => ({
  type: actionTypes.SET_AUDIO_CATALOG_ENTRIES,
  payload: { entries },
});

export const setAudioCatalogEntry = (baniId, entry) => ({
  type: actionTypes.SET_AUDIO_CATALOG_ENTRY,
  payload: { baniId, entry },
});

// meta: { lastFullSyncAt, appVersion } — bookkeeping for the eager prefetch so
// it only runs on a fresh install, app update, or once past the TTL.
export const setAudioCatalogMeta = (meta) => ({
  type: actionTypes.SET_AUDIO_CATALOG_META,
  payload: meta,
});

export const clearAudioCatalog = () => ({
  type: actionTypes.CLEAR_AUDIO_CATALOG,
});

// Audio progress actions
export const setAudioProgress = (baniId, trackId, position, sequence) => {
  return {
    type: actionTypes.SET_AUDIO_PROGRESS,
    payload: { baniId, trackId, position, sequence },
  };
};

export const clearAudioProgress = (baniId) => {
  return {
    type: actionTypes.CLEAR_AUDIO_PROGRESS,
    payload: { baniId },
  };
};

// Seva Donor action creators
export const setDonorState = (value) => {
  return { type: actionTypes.SET_DONOR_STATE, value };
};

export const clearDonorState = () => {
  return { type: actionTypes.CLEAR_DONOR_STATE };
};

export const setPlayerDragging = (value) => {
  return { type: actionTypes.SET_PLAYER_DRAGGING, value };
};

// Download queue action creators
export const enqueueDownload = (payload) => ({
  type: actionTypes.ENQUEUE_DOWNLOAD,
  payload,
});

export const updateDownloadStatus = (trackKey, status, extra = {}) => ({
  type: actionTypes.UPDATE_DOWNLOAD_STATUS,
  payload: { trackKey, status, ...extra },
});

export const updateDownloadProgress = (trackKey, progress) => ({
  type: actionTypes.UPDATE_DOWNLOAD_PROGRESS,
  payload: { trackKey, progress },
});

export const removeDownloadQueueEntry = (trackKey) => ({
  type: actionTypes.REMOVE_DOWNLOAD_QUEUE_ENTRY,
  payload: { trackKey },
});

export const retryDownload = (trackKey) => ({
  type: actionTypes.RETRY_DOWNLOAD,
  payload: { trackKey },
});

export const requeuePausedDownloads = (statuses) => ({
  type: actionTypes.REQUEUE_PAUSED_DOWNLOADS,
  payload: { statuses },
});

// Download registry action creators
export const addDownloadEntry = (entry) => ({
  type: actionTypes.ADD_DOWNLOAD_ENTRY,
  payload: entry,
});

export const removeDownloadEntries = (keys) => ({
  type: actionTypes.REMOVE_DOWNLOAD_ENTRIES,
  payload: keys,
});

// patches: { [relativePath]: { ...fields to merge } } — one action for however
// many entries the reconcile pass corrects, so the persisted store is
// serialized once rather than once per track.
export const updateDownloadEntries = (patches) => ({
  type: actionTypes.UPDATE_DOWNLOAD_ENTRIES,
  payload: patches,
});

export const setDownloadRegistry = (registry) => ({
  type: actionTypes.SET_DOWNLOAD_REGISTRY,
  payload: registry,
});

export const clearDownloadRegistry = () => ({
  type: actionTypes.CLEAR_DOWNLOAD_REGISTRY,
});

// Download settings action creators
export const toggleDownloadWifiOnly = (value) => ({
  type: actionTypes.TOGGLE_DOWNLOAD_WIFI_ONLY,
  value,
});

export const toggleAutoDownload = (value) => ({
  type: actionTypes.TOGGLE_AUTO_DOWNLOAD,
  value,
});

// Onboarding carousel guide
// Show/hide the full-screen onboarding carousel. Set true on a genuine fresh
// install (see useOnboardingTrigger) and from the Settings "Revisit Tutorial"
// row; set false when the user finishes or skips it.
export const setOnboardingVisible = (value) => ({
  type: actionTypes.SET_ONBOARDING_VISIBLE,
  value,
});

// Persist the onboarding-carousel version the user has completed (pass
// constant.ONBOARDING_VERSION) so the first-run auto-open doesn't fire again
// until that constant is bumped. "Revisit" ignores this value.
export const setOnboardingSeen = (value) => ({
  type: actionTypes.SET_ONBOARDING_SEEN,
  value,
});
// ─── Dashboard redesign ─────────────────────────────────────────────────────
export const setUserProfile = (value) => {
  return { type: actionTypes.SET_USER_PROFILE, value };
};

// Khalis SSO session. `value` is { user, expiresAt } — decoded claims and the
// token's expiry in epoch ms. The token itself stays in the Keychain.
export const setAuthSession = (value) => {
  return { type: actionTypes.SET_AUTH_SESSION, value };
};

export const clearAuthSession = () => {
  return { type: actionTypes.CLEAR_AUTH_SESSION };
};

export const setAuthBusy = (value) => {
  return { type: actionTypes.SET_AUTH_BUSY, value };
};

export const setDashboardLayout = (value) => {
  // value: { order: string[], hidden: string[] }
  return { type: actionTypes.SET_DASHBOARD_LAYOUT, value };
};

export const resetDashboardLayout = () => {
  return { type: actionTypes.RESET_DASHBOARD_LAYOUT };
};

export const clearUserData = () => {
  // Drops every slice that belongs to a PERSON rather than to this phone.
  // Dispatched on sign-out and when a different account signs in — see
  // common/sso/accountScope.js, which owns that decision.
  return { type: actionTypes.CLEAR_USER_DATA };
};

export const toggleNitnemDone = (date, baniId) => {
  // Marks/unmarks a bani done for a given YYYY-MM-DD date
  return { type: actionTypes.TOGGLE_NITNEM_DONE, payload: { date, baniId } };
};

export const markNitnemAutoDone = (date, baniIds) => {
  // Records banis auto-detected as done (real read/listen time past threshold)
  // for a date. Additive only (union with whatever's already recorded) — never
  // removes anything, so it's safe to dispatch every time auto-detection runs.
  return { type: actionTypes.MARK_NITNEM_AUTO_DONE, payload: { date, baniIds } };
};

export const markNitnemDone = (date, baniIds) => {
  // The "Mark done" BUTTON — an explicit statement by the user that they read
  // these elsewhere. Distinct from markNitnemAutoDone, which is a background
  // guess from scroll position and therefore defers to any manual un-tick.
  // Sharing that action made the button dead after the first press: it had
  // already seeded every id, and the auto path refuses to re-add a seeded id.
  return { type: actionTypes.MARK_NITNEM_DONE, payload: { date, baniIds } };
};

export const restoreNitnem = (value) => {
  // value: { completed?: { [date]: number[] } }
  return { type: actionTypes.RESTORE_NITNEM, value };
};

// Which of the user's toggles a reading theme may SUGGEST, and the action that
// owns each. Going through the real action creators rather than writing the
// reducers directly keeps their analytics and cross-toggle rules intact — a
// theme takes exactly the path a user tapping the switch would.
//
// Returned from a function rather than held in a module-scope object literal:
// evaluating the map at module scope would read these `const` arrow functions in
// their temporal dead zone and throw on import. Keeping it lazy also lets this
// whole block sit at the end of the file, below everything it depends on.
const readerThemeSeedableToggles = () => ({
  isTransliteration: toggleTransliteration,
  isEnglishTranslation: toggleEnglishTranslation,
  isPunjabiTranslation: togglePunjabiTranslation,
  isSpanishTranslation: toggleSpanishTranslation,
});

// Applies a theme, plus the one-time "seeding" of the display settings a
// designed theme suggests.
//
// A theme suggests those settings the FIRST time it is chosen and never again:
// once `readerThemeSeeded[id]` is set, re-selecting that theme leaves the user's
// toggles alone. So a theme can express an intended reading setup without ever
// silently undoing a choice the user made by hand.
//
// Light, Dark and Default have no `defaults`, so for them this is exactly
// `setTheme` with one extra no-op dispatch.
export const applyTheme = (value) => (dispatch, getState) => {
  // Read before the switch: which theme is being LEFT decides whether the
  // face on screen is the reader's own.
  const leaving = getState().theme;
  dispatch(setTheme(value));

  const state = getState();
  // The MERGED registry: a theme served by the backend behaves exactly as a
  // bundled one does.
  const registry = mergeThemeRegistry(state.remoteThemes).byId;
  const record = registry[value];

  // The Bani font is re-applied on EVERY selection, and deliberately not
  // through the once-only path below.
  //
  // A face is part of how a theme LOOKS — Puratan is a manuscript, and Anmol
  // Lipi is what makes it one — so choosing the theme means choosing its face,
  // the same way it means choosing its ground. A setting like transliteration
  // is a reading preference that happens to have a sensible default, which is
  // why that one is seeded once and never re-asserted.
  //
  // The user is not overruled: while the theme is selected their own choice
  // stands, because nothing here runs again until a theme is selected. Leaving
  // and coming back is a fresh choice of the theme, and brings its face back.
  //
  // Leaving a theme like that puts the reader's OWN face back, instead of
  // keeping the theme's after the theme has gone. Their own face is the last
  // one they picked in Settings (chooseBaniFontFace). A reader who has never
  // picked one there has not had one recorded yet, so the face they are
  // reading in is taken as theirs the moment they leave a theme that did not
  // set it — it can only have been their choice, or the app's default.
  let own = state.ownBaniFontFace;
  if (!own && state.baniFontFace && !registry[leaving]?.typography?.preferredFontFace) {
    own = state.baniFontFace;
    dispatch({ type: actionTypes.SET_OWN_BANI_FONT_FACE, value: own });
  }
  const face = record?.typography?.preferredFontFace || own;
  if (face && state.baniFontFace !== face) dispatch(setBaniFontFace(face));

  // Everything below is once per theme, for the life of the install.
  if (state.readerThemeSeeded?.[value]) return;

  const defaults = record?.defaults ?? {};
  const seedable = readerThemeSeedableToggles();
  Object.entries(defaults).forEach(([key, desired]) => {
    const toggle = seedable[key];
    // Only dispatch a real change. Re-asserting a toggle that already holds the
    // desired value would emit a misleading analytics event.
    if (toggle && state[key] !== desired) dispatch(toggle(desired));
  });

  // Marked even when `defaults` is empty, so the check above short-circuits on
  // every subsequent selection of this theme.
  dispatch({ type: actionTypes.MARK_READER_THEME_SEEDED, value });
};

// ── My Pothi ───────────────────────────────────────────────────────────────
// `id` is minted by the caller (via createPothi) rather than by the reducer, so
// the add-to-pothi flow can create a pothi and drop the current shabad into it
// in one dispatch pair without waiting for a render to learn the new id.
export const createPothi = (pothi) => {
  // pothi: the object returned by pothi/model createPothi()
  return { type: actionTypes.CREATE_POTHI, value: pothi };
};

export const renamePothi = (id, name) => {
  return { type: actionTypes.RENAME_POTHI, payload: { id, name } };
};

export const deletePothi = (id) => {
  return { type: actionTypes.DELETE_POTHI, value: id };
};

export const addBaniToPothi = (id, item) => {
  // item: the wire-shaped bani item from pothi/model makeBaniItem()
  return { type: actionTypes.ADD_BANI_TO_POTHI, payload: { id, item } };
};

export const removeBaniFromPothi = (id, baaniId) => {
  return { type: actionTypes.REMOVE_BANI_FROM_POTHI, payload: { id, baaniId } };
};

export const setPothiOrder = (order) => {
  // order: pothiId[] for the draggable (unpinned) lane
  return { type: actionTypes.SET_POTHI_ORDER, value: order };
};

export const togglePothiPin = (id) => {
  return { type: actionTypes.TOGGLE_POTHI_PIN, value: id };
};

export const seedDefaultPothis = (pothis) => {
  // pothis: the array from pothi/defaults buildDefaultPothis()
  return { type: actionTypes.SEED_DEFAULT_POTHIS, value: pothis };
};

export const mergeRemotePothis = (folders, deletedFolderIds = []) => {
  // folders: FolderDto[] straight from GET /folders; deletedFolderIds: the ids
  // the server reports as deleted since this device's last read.
  return { type: actionTypes.MERGE_REMOTE_POTHIS, value: folders, deletedFolderIds };
};

export const setPothiSyncWatermark = (syncedAt) => {
  return { type: actionTypes.SET_POTHI_SYNC_WATERMARK, value: syncedAt };
};

export const pothiDeleteSynced = (id) => {
  return { type: actionTypes.POTHI_DELETE_SYNCED, value: id };
};

export const setPothisSyncedAt = (isoTimestamp) => {
  return { type: actionTypes.SET_POTHIS_SYNCED_AT, value: isoTimestamp };
};

// ── Sync outbox ────────────────────────────────────────────────────────────
// op: { feature, kind, key, payload } — see common/sync/outboxModel.
export const enqueueSyncOp = (op) => ({ type: actionTypes.ENQUEUE_SYNC_OP, payload: op });
export const syncOpSending = (id) => ({ type: actionTypes.SYNC_OP_SENDING, payload: { id } });
export const syncOpDone = (id) => ({ type: actionTypes.SYNC_OP_DONE, payload: { id } });
export const syncOpFailed = (id, error) => ({
  type: actionTypes.SYNC_OP_FAILED,
  payload: { id, error },
});
export const clearSyncFeature = (feature) => ({
  type: actionTypes.CLEAR_SYNC_FEATURE,
  payload: { feature },
});

// Settings sync bookkeeping — see settings/syncModel and useSettingsSync.
export const mergeSettingsSyncMeta = (payload) => ({
  type: actionTypes.MERGE_SETTINGS_SYNC_META,
  payload,
});

// patch: { clocks?, tombstones?, base?, removeTombstones?, removeClocks?,
//          settingsUpdatedAt?, settingsBase?, lastSyncedAt?, replace? }
export const mergeReminderSyncMeta = (patch) => ({
  type: actionTypes.MERGE_REMINDER_SYNC_META,
  payload: patch,
});
