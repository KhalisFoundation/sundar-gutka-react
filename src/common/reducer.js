import { combineReducers } from "@reduxjs/toolkit";
import * as actionTypes from "./actions/actionTypes";
import constant from "./constant";

const createReducer =
  (initialState, handlers) =>
  (state = initialState, action) => {
    if (Object.prototype.hasOwnProperty.call(handlers, action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };

const isNightMode = createReducer(false, {
  [actionTypes.TOGGLE_NIGHT_MODE]: (state, action) => action.value,
});

const fontSize = createReducer(constant.SMALL, {
  [actionTypes.SET_FONT_SIZE]: (state, action) => action.value,
});

const transliterationLanguage = createReducer(constant.ENGLISH, {
  [actionTypes.SET_TRANSLITERATION]: (state, action) => action.value,
});

const fontFace = createReducer(constant.GURBANI_AKHAR_TRUE, {
  [actionTypes.SET_FONT_FACE]: (state, action) => action.value,
});
const language = createReducer(constant.Default.toUpperCase(), {
  [actionTypes.SET_LANGUAGE]: (state, action) => action.value,
});

const isTransliteration = createReducer(false, {
  [actionTypes.TOGGLE_TRANSLITERATION]: (state, action) => action.value,
});

const theme = createReducer(constant.Default, {
  [actionTypes.SET_THEME]: (state, action) => action.value,
});

// Theme ids whose suggested translation/transliteration defaults have already
// been applied once. Persisted, so a theme never re-seeds across launches and a
// user's later manual toggle is permanent. See applyTheme().
const readerThemeSeeded = (state = {}, action) =>
  action.type === actionTypes.MARK_READER_THEME_SEEDED ? { ...state, [action.value]: true } : state;

// The backend's reading-theme catalogue (see services/themes). Persisted, so a
// theme chosen from it still resolves offline.
const remoteThemes = (state = { version: 0, fetchedAt: 0, themes: [] }, action) => {
  switch (action.type) {
    case actionTypes.SET_REMOTE_THEMES:
      return {
        version: Number(action.payload?.version) || 0,
        fetchedAt: Number(action.payload?.fetchedAt) || 0,
        themes: Array.isArray(action.payload?.themes) ? action.payload.themes : [],
      };
    default:
      return state;
  }
};

const isStatusBar = createReducer(true, {
  [actionTypes.TOGGLE_STATUS_BAR]: (state, action) => action.value,
});

const isScreenAwake = createReducer(true, {
  [actionTypes.TOGGLE_SCREEN_AWAKE]: (state, action) => action.value,
});

const isAutoScroll = createReducer(false, {
  [actionTypes.TOGGLE_AUTO_SCROLL]: (state, action) => action.value,
  // Auto-cancel when Audio turns ON (either runtime or feature toggle)
  [actionTypes.TOGGLE_AUDIO]: (state, action) => (action.value ? false : state),
  [actionTypes.TOGGLE_AUDIO_FEATURE_ENABLED]: (state, action) => (action.value ? false : state),
});

const isAudio = createReducer(false, {
  [actionTypes.TOGGLE_AUDIO]: (state, action) => action.value,
  // Auto-cancel when AutoScroll turns ON
  [actionTypes.TOGGLE_AUTO_SCROLL]: (state, action) => (action.value ? false : state),
});

const isAudioFeatureEnabled = createReducer(true, {
  [actionTypes.TOGGLE_AUDIO_FEATURE_ENABLED]: (state, action) => action.value,
  // Auto-disable Audio feature when AutoScroll turns ON
  [actionTypes.TOGGLE_AUTO_SCROLL]: (state, action) => (action.value ? false : state),
});

const isAudioAutoPlay = createReducer(false, {
  [actionTypes.TOGGLE_AUDIO_AUTO_PLAY]: (state, action) => action.value,
});

const isAudioSyncScroll = createReducer(true, {
  [actionTypes.TOGGLE_AUDIO_SYNC_SCROLL]: (state, action) => action.value,
});

const audioPlaybackSpeed = createReducer(1.0, {
  [actionTypes.SET_AUDIO_PLAYBACK_SPEED]: (state, action) => action.value,
});

const baniLength = createReducer("", {
  [actionTypes.SET_BANI_LENGTH]: (state, action) => action.value,
});

const isLarivaar = createReducer(false, {
  [actionTypes.TOGGLE_LARIVAAR]: (state, action) => action.value,
});

const isLarivaarAssist = createReducer(false, {
  [actionTypes.TOGGLE_LARIVAAR_ASSIST]: (state, action) => action.value,
});

const isParagraphMode = createReducer(false, {
  [actionTypes.TOGGLE_PARAGRAPH_MODE]: (state, action) => action.value,
});

const padched = createReducer(constant.SAT_SUBHAM_SAT, {
  [actionTypes.SET_PADCHHED]: (state, action) => action.value,
});

const isVishraam = createReducer(false, {
  [actionTypes.TOGGLE_VISHRAAM]: (state, action) => action.value,
});

const vishraamOption = createReducer(constant.VISHRAAM_COLORED, {
  [actionTypes.SET_VISHRAAM_OPTION]: (state, action) => action.value,
});

const vishraamSource = createReducer(constant.sttm, {
  [actionTypes.SET_VISHRAAM_SOURCE]: (state, action) => action.value,
});

const isStatistics = createReducer(true, {
  [actionTypes.TOGGLE_STATISTICS]: (state, action) => action.value,
});

const isEnglishTranslation = createReducer(false, {
  [actionTypes.TOGGLE_ENGLISH_TRANSLATION]: (state, action) => action.value,
});

const isSpanishTranslation = createReducer(false, {
  [actionTypes.TOGGLE_SPANISH_TRANSLATION]: (state, action) => action.value,
});

const isPunjabiTranslation = createReducer(false, {
  [actionTypes.TOGGLE_PUNJABI_TRANSLATION]: (state, action) => action.value,
});

const bookmarkPosition = createReducer(0, {
  [actionTypes.SET_BOOKMARK_POSITION]: (state, action) => action.value,
});

const bookmarkSequenceString = createReducer(null, {
  [actionTypes.SET_BOOKMARK_SEQUENCE_STRING]: (state, action) => action.value,
});

const isReminders = createReducer(false, {
  [actionTypes.TOGGLE_REMINDERS]: (state, action) => action.value,
});

const reminderBanis = createReducer(JSON.stringify([]), {
  [actionTypes.SET_REMINDER_BANIS]: (state, action) => action.value,
});

const reminderSound = createReducer(constant.Default.toLowerCase(), {
  [actionTypes.SET_REMINDER_SOUND]: (state, action) => action.value,
});

const isHeaderFooter = createReducer(false, {
  [actionTypes.TOGGLE_HEADER_FOOTER]: (state, action) => action.value,
});

const isDatabaseUpdateAvailable = createReducer(false, {
  [actionTypes.TOGGLE_DATABASE_UPDATE_AVAILABLE]: (state, action) => action.value,
});

// Audio Manifest reducer
const audioManifest = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_AUDIO_MANIFEST:
      return {
        ...state,
        [action.payload.baniId]: action.payload.tracks,
      };
    default:
      return state;
  }
};

const autoScrollSpeedObj = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_AUTO_SCROLL_SPEED:
      return { ...state, ...action.value };
    default:
      return state;
  }
};

const baniOrder = (state = null, action) => {
  switch (action.type) {
    case actionTypes.SET_BANI_ORDER:
      return action.value;
    default:
      return state;
  }
};

const baniList = (state = [], action) => {
  switch (action.type) {
    case actionTypes.SET_BANI_LIST:
      return action.value;
    default:
      return state;
  }
};

const defaultAudio = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_DEFAULT_AUDIO:
      return { ...state, ...action.value };
    case actionTypes.SET_BANI_LENGTH: {
      const newState = { ...state };
      constant.BANI_IDS_WITH_LENGTH_VARIANTS.forEach((id) => {
        delete newState[id];
      });
      return newState;
    }
    default:
      return state;
  }
};

const savePosition = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_SAVE_POSITION:
      return { ...state, ...action.value };
    default:
      return state;
  }
};
const scrollPosition = (state = 0, action) => {
  switch (action.type) {
    case actionTypes.SET_SCROLL_POSITION:
      return action.value;
    default:
      return state;
  }
};

// Audio progress reducer - stores progress per bani: { [baniId]: { trackId, position, sequence } }
const audioProgress = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_AUDIO_PROGRESS: {
      const { baniId, trackId, position, sequence } = action.payload;
      return {
        ...state,
        [baniId]: {
          trackId,
          position,
          ...(sequence !== undefined && { sequence }),
        },
      };
    }
    case actionTypes.CLEAR_AUDIO_PROGRESS: {
      const { baniId } = action.payload;
      const newState = { ...state };
      delete newState[baniId];
      return newState;
    }
    case actionTypes.SET_BANI_LENGTH: {
      const newState = { ...state };
      constant.BANI_IDS_WITH_LENGTH_VARIANTS.forEach((id) => {
        delete newState[id];
      });
      return newState;
    }
    default:
      return state;
  }
};
const currentBani = createReducer(null, {
  [actionTypes.SET_CURRENT_BANI]: (state, action) => action.value,
});

// ── Audio catalog, the floating player and downloads ──────────────────────

// Audio catalog cache — the persisted offline copy of the backend /audios
// manifest, keyed by baniId. Each entry holds the RAW length-grouped API
// response ({ groups, baniName, fetchedAt }); the length-group selection that
// turns it into a playable track list happens at read time (see
// selectTracksForBani), so a single cache entry serves every bani length. This
// replaces the former hardcoded EMERGENCY_MANIFEST — it is the app's only
// offline audio source, populated by useAudioCatalogSync + per-bani lazy fetch.
// Persisted (intentionally NOT in the store.js blacklist).
const audioCatalog = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_AUDIO_CATALOG_ENTRY:
      return {
        ...state,
        [action.payload.baniId]: action.payload.entry,
      };
    case actionTypes.SET_AUDIO_CATALOG_ENTRIES:
      return { ...state, ...action.payload.entries };
    case actionTypes.CLEAR_AUDIO_CATALOG:
      return {};
    default:
      return state;
  }
};

// Bookkeeping for the eager catalog prefetch: when it last completed a full
// sweep and the app version that ran it, so the sweep only re-runs on a fresh
// install, an app update, or once the TTL has elapsed. Persisted.
const audioCatalogMeta = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.SET_AUDIO_CATALOG_META:
      return { ...state, ...action.payload };
    case actionTypes.CLEAR_AUDIO_CATALOG:
      return {};
    default:
      return state;
  }
};

// Two counters rather than one "last reader gesture" value: the floating audio
// player reacts to each in the opposite direction, and a single value could not
// tell "the same gesture again" from "no gesture".
const readerTapTick = createReducer(0, {
  [actionTypes.BUMP_READER_TAP]: (state) => state + 1,
});

const readerScrollDownTick = createReducer(0, {
  [actionTypes.BUMP_READER_SCROLL_DOWN]: (state) => state + 1,
});

const isPlayerDragging = createReducer(false, {
  [actionTypes.SET_PLAYER_DRAGGING]: (state, action) => action.value,
});

// Download queue — entries stuck in 'downloading' at rehydrate had their native
// job killed; reset them to 'queued' so the engine restarts them from scratch.
const downloadQueue = (state = {}, action) => {
  switch (action.type) {
    case "persist/REHYDRATE": {
      const persisted = action.payload?.downloadQueue ?? {};
      const healed = {};
      // 'downloading' = native task is re-adopted on launch (or restarted if
      // truly lost); 'paused_retry' = a backoff timer that didn't survive the
      // restart. Both resolve to 'queued' so the engine reconciles them.
      const reset = new Set(["downloading", "paused_retry"]);
      Object.entries(persisted).forEach(([k, t]) => {
        // 'completed' lives only until its 2s cleanup timer, which a kill can
        // beat. Left in the queue, it made ENQUEUE_DOWNLOAD a no-op for that
        // track forever, so it could never be downloaded again once deleted.
        if (t.status === "completed") return;
        healed[k] = reset.has(t.status) ? { ...t, status: "queued", progress: 0, jobId: null } : t;
      });
      return healed;
    }
    case actionTypes.ENQUEUE_DOWNLOAD:
      if (state[action.payload.trackKey]) return state;
      return {
        ...state,
        [action.payload.trackKey]: {
          ...action.payload,
          status: "queued",
          progress: 0,
          retryCount: 0,
          errorMessage: null,
          jobId: null,
        },
      };
    case actionTypes.UPDATE_DOWNLOAD_STATUS:
      if (!state[action.payload.trackKey]) return state;
      return {
        ...state,
        [action.payload.trackKey]: {
          ...state[action.payload.trackKey],
          ...action.payload,
        },
      };
    case actionTypes.UPDATE_DOWNLOAD_PROGRESS:
      if (!state[action.payload.trackKey]) return state;
      return {
        ...state,
        [action.payload.trackKey]: {
          ...state[action.payload.trackKey],
          progress: action.payload.progress,
        },
      };
    case actionTypes.REMOVE_DOWNLOAD_QUEUE_ENTRY: {
      const next = { ...state };
      delete next[action.payload.trackKey];
      return next;
    }
    case actionTypes.RETRY_DOWNLOAD:
      if (!state[action.payload.trackKey]) return state;
      return {
        ...state,
        [action.payload.trackKey]: {
          ...state[action.payload.trackKey],
          status: "queued",
          progress: 0,
          retryCount: 0,
          errorMessage: null,
        },
      };
    case actionTypes.REQUEUE_PAUSED_DOWNLOADS: {
      const next = { ...state };
      action.payload.statuses.forEach((pausedStatus) => {
        Object.keys(next).forEach((k) => {
          if (next[k].status !== pausedStatus) return;
          // A storage failure won't be fixed by retrying — leave it for the user.
          if (next[k].errorMessage === "NOT_ENOUGH_STORAGE") return;
          // Reset the retry budget so a previously-failed entry gets a clean
          // restart (otherwise it would immediately re-fail on its first error).
          next[k] = {
            ...next[k],
            status: "queued",
            progress: 0,
            retryCount: 0,
            errorMessage: null,
          };
        });
      });
      return next;
    }
    default:
      return state;
  }
};

const downloadRegistry = (state = {}, action) => {
  switch (action.type) {
    case actionTypes.ADD_DOWNLOAD_ENTRY:
      return { ...state, [action.payload.relativePath]: action.payload };
    case actionTypes.REMOVE_DOWNLOAD_ENTRIES: {
      const next = { ...state };
      action.payload.forEach((k) => delete next[k]);
      return next;
    }
    case actionTypes.UPDATE_DOWNLOAD_ENTRIES: {
      const next = { ...state };
      Object.entries(action.payload || {}).forEach(([k, patch]) => {
        if (next[k]) next[k] = { ...next[k], ...patch };
      });
      return next;
    }
    case actionTypes.SET_DOWNLOAD_REGISTRY:
      return action.payload;
    case actionTypes.CLEAR_DOWNLOAD_REGISTRY:
      return {};
    default:
      return state;
  }
};

const downloadWifiOnly = createReducer(true, {
  [actionTypes.TOGGLE_DOWNLOAD_WIFI_ONLY]: (state, action) => action.value,
});

// When true, streaming a bani automatically enqueues its download in the background.
// Shipped ON by default — fresh installs auto-save what they stream (the global
// engine still gates on the WiFi-only setting before any bytes flow).
const autoDownloadOnStream = createReducer(true, {
  [actionTypes.TOGGLE_AUTO_DOWNLOAD]: (state, action) => action.value,
});

// Whether the previous release's downloads have been adopted into
// downloadRegistry (see useStorageMigration). Persisted with the registry in the
// same write — a flag stored separately could survive a kill that lost the
// entries, and the orphan sweep would then delete every one of those files.
const audioStorageMigrated = createReducer(false, {
  [actionTypes.MARK_AUDIO_STORAGE_MIGRATED]: () => true,
});

const rootReducer = combineReducers({
  isNightMode,
  fontSize,
  fontFace,
  language,
  transliterationLanguage,
  isTransliteration,
  theme,
  readerThemeSeeded,
  remoteThemes,
  isAutoScroll,
  isAudio,
  isAudioFeatureEnabled,
  isAudioAutoPlay,
  isAudioSyncScroll,
  audioPlaybackSpeed,
  defaultAudio,
  isScreenAwake,
  isStatusBar,
  baniLength,
  isLarivaar,
  isLarivaarAssist,
  isParagraphMode,
  padched,
  isVishraam,
  vishraamOption,
  vishraamSource,
  isStatistics,
  isEnglishTranslation,
  isPunjabiTranslation,
  isSpanishTranslation,
  bookmarkPosition,
  bookmarkSequenceString,
  isReminders,
  reminderBanis,
  reminderSound,
  autoScrollSpeedObj,
  baniOrder,
  baniList,
  savePosition,
  scrollPosition,
  isHeaderFooter,
  isDatabaseUpdateAvailable,
  audioManifest,
  audioProgress,
  audioCatalog,
  audioCatalogMeta,
  readerTapTick,
  readerScrollDownTick,
  isPlayerDragging,
  downloadQueue,
  downloadRegistry,
  downloadWifiOnly,
  autoDownloadOnStream,
  audioStorageMigrated,
  currentBani,
});
export default rootReducer;
