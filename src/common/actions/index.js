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

export const setAutoScrollSpeed = (speed, shabad) => {
  trackSettingEvent(constant.AUTO_SCROLL_SPEED, speed);
  const value = { [shabad]: speed };
  return { type: actionTypes.SET_AUTO_SCROLL_SPEED, value };
};
export const setBaniOrder = (value) => {
  return { type: actionTypes.SET_BANI_ORDER, value };
};

export const setBaniList = (value) => {
  return { type: actionTypes.SET_BANI_LIST, value };
};

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

// The reading-theme catalogue served by the backend, merged over the bundled
// set (see theme/reader/registry and services/themes).
export const setRemoteThemes = ({ version, themes, fetchedAt }) => ({
  type: actionTypes.SET_REMOTE_THEMES,
  payload: { version, themes, fetchedAt },
});

// Which of the user's toggles a reading theme may SUGGEST, and the action that
// owns each. Going through the real action creators keeps their analytics and
// cross-toggle rules intact — a theme takes exactly the path a user tapping the
// switch would. A function, not a module-scope literal, so the action creators
// above are never read in their temporal dead zone.
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
// toggles alone, so a theme can express an intended reading setup without ever
// silently undoing a choice the user made by hand. Light, Dark and Default have
// no `defaults`, so for them this is `setTheme` plus one no-op dispatch.
export const applyTheme = (value) => (dispatch, getState) => {
  dispatch(setTheme(value));

  const state = getState();
  if (state.readerThemeSeeded?.[value]) return;

  // The MERGED registry: a theme served by the backend behaves exactly as a
  // bundled one does.
  const record = mergeThemeRegistry(state.remoteThemes).byId[value];
  const defaults = record?.defaults ?? {};
  const seedable = readerThemeSeedableToggles();
  Object.entries(defaults).forEach(([key, desired]) => {
    const toggle = seedable[key];
    // Only dispatch a real change, so no misleading analytics event is sent.
    if (toggle && state[key] !== desired) dispatch(toggle(desired));
  });

  // Marked even when `defaults` is empty, so the check above short-circuits on
  // every later selection of this theme.
  dispatch({ type: actionTypes.MARK_READER_THEME_SEEDED, value });
};

// ── Audio catalog, the floating player and downloads ──────────────────────

export const bumpReaderTap = () => {
  return { type: actionTypes.BUMP_READER_TAP };
};

export const bumpReaderScrollDown = () => {
  return { type: actionTypes.BUMP_READER_SCROLL_DOWN };
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

export const markAudioStorageMigrated = () => ({
  type: actionTypes.MARK_AUDIO_STORAGE_MIGRATED,
});

export const toggleAutoDownload = (value) => ({
  type: actionTypes.TOGGLE_AUTO_DOWNLOAD,
  value,
});

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

export const clearUserData = () => {
  // Drops every slice that belongs to a PERSON rather than to this phone.
  // Dispatched on sign-out and when a different account signs in — see
  // common/sso/accountScope.js, which owns that decision.
  return { type: actionTypes.CLEAR_USER_DATA };
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
// Settings sync bookkeeping — see settings/syncModel and useSettingsSync.
export const mergeSettingsSyncMeta = (payload) => ({
  type: actionTypes.MERGE_SETTINGS_SYNC_META,
  payload,
});
