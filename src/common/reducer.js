import { combineReducers } from "@reduxjs/toolkit";
import * as actionTypes from "./actions/actionTypes";
import constant from "./constant";
import * as pothiModel from "./pothi/model";
import { emptySettingsSync } from "./settings/syncModel";
import * as outbox from "./sync/outboxModel";

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

// Per-setting sync clocks and server bases — see settings/syncModel.
// Persisted, and reset with the rest of the account's data on a switch
// (USER_DATA_SLICES), so one person's pending edits never reach another.
const settingsSync = createReducer(emptySettingsSync(), {
  [actionTypes.MERGE_SETTINGS_SYNC_META]: (state, action) => {
    const p = action.payload || {};
    if (p.replace) return { ...emptySettingsSync(), ...p.replace };
    const clocks = { ...state.clocks, ...(p.clocks || {}) };
    const base = { ...state.base, ...(p.base || {}) };
    (p.removeClocks || []).forEach((key) => delete clocks[key]);
    return {
      clocks,
      base,
      lastSyncedAt: p.lastSyncedAt ?? state.lastSyncedAt,
    };
  },
});

// Changes to account data not yet at the server — see sync/outboxModel. On
// rehydrate nothing is in flight any more, so "sending" goes back to the queue.
const syncOutbox = createReducer(outbox.emptyOutbox(), {
  "persist/REHYDRATE": (state, action) =>
    action.payload?.syncOutbox ? outbox.heal(action.payload.syncOutbox) : state,
  [actionTypes.ENQUEUE_SYNC_OP]: (state, action) => outbox.enqueue(state, action.payload),
  [actionTypes.SYNC_OP_SENDING]: (state, action) => outbox.markSending(state, action.payload.id),
  [actionTypes.SYNC_OP_DONE]: (state, action) => outbox.markDone(state, action.payload.id),
  [actionTypes.SYNC_OP_FAILED]: (state, action) =>
    outbox.markFailed(state, action.payload.id, { error: action.payload.error }),
});

// Bumped by every CLEAR_USER_DATA, which is the account boundary. A request
// made for one account can answer after the boundary has moved even while
// `auth` still names the same person (sign-out purges before the logout
// browser closes), so code that must not write one account's answer into the
// next compares this rather than the session.
const accountEpoch = createReducer(0, {
  [actionTypes.CLEAR_USER_DATA]: (state) => state + 1,
});

// Khalis SSO session state. Blacklisted from redux-persist (see store.js): the
// claims carry an email + SAML nameID and redux-persist writes unencrypted
// AsyncStorage. Blacklisting also guarantees "unknown" on cold start, so the UI
// cannot flash a signed-in state before the Keychain read resolves.
const auth = createReducer(
  { status: "unknown", user: null, expiresAt: null, busy: false },
  {
    // `busy` is left to the action that set it (useSsoActions clears it when
    // it finishes). A session event mid-action — a 401 ending the session
    // during sign-out, the Android return link beginning one while
    // startLogin still waits — used to clear it, re-enabling the row while
    // a login browser was still open, and a second tap broke openAuth.
    [actionTypes.SET_AUTH_SESSION]: (state, action) => ({
      ...state,
      status: "signedIn",
      user: action.value?.user ?? null,
      expiresAt: action.value?.expiresAt ?? null,
    }),
    [actionTypes.CLEAR_AUTH_SESSION]: (state) => ({
      ...state,
      status: "signedOut",
      user: null,
      expiresAt: null,
    }),
    [actionTypes.SET_AUTH_BUSY]: (state, action) => ({ ...state, busy: !!action.value }),
  }
);

// My Pothi. Every transition delegates to `pothi/model`, which owns the rules
// (the pin ceiling, de-duplication, what an unpinned pothi's slot becomes) and
// is tested without a store. This reducer only routes.
//
// REHYDRATE runs the persisted payload through `reconcile` rather than trusting
// it: it is user data that outlives the build that wrote it, so a pothi deleted
// in one version, or a pin count from before the ceiling existed, must not come
// back and put the list into a state the UI cannot render.
const pothis = createReducer(pothiModel.emptyPothis(), {
  "persist/REHYDRATE": (state, action) =>
    action.payload?.pothis ? pothiModel.reconcile(action.payload.pothis) : state,
  [actionTypes.CREATE_POTHI]: (state, action) => pothiModel.addPothi(state, action.value),
  [actionTypes.RENAME_POTHI]: (state, action) =>
    pothiModel.renamePothi(state, action.payload.id, action.payload.name),
  [actionTypes.DELETE_POTHI]: (state, action) => pothiModel.deletePothi(state, action.value),
  [actionTypes.ADD_BANI_TO_POTHI]: (state, action) =>
    pothiModel.addBani(state, action.payload.id, action.payload.item),
  [actionTypes.REMOVE_BANI_FROM_POTHI]: (state, action) =>
    pothiModel.removeBani(state, action.payload.id, action.payload.baaniId),
  [actionTypes.RESTORE_POTHI_ITEMS]: (state, action) =>
    pothiModel.restoreItems(state, action.payload.id, action.payload.items),
  [actionTypes.SET_POTHI_ORDER]: (state, action) => pothiModel.setOrder(state, action.value),
  [actionTypes.TOGGLE_POTHI_PIN]: (state, action) => pothiModel.togglePin(state, action.value),
  [actionTypes.SEED_DEFAULT_POTHIS]: (state, action) =>
    pothiModel.seedDefaults(state, action.value ?? []),
  [actionTypes.MERGE_REMOTE_POTHIS]: (state, action) =>
    pothiModel.mergeRemote(state, action.value ?? [], Date.now(), action.deletedFolderIds ?? []),
  [actionTypes.SET_POTHI_SYNC_WATERMARK]: (state, action) => ({
    ...state,
    syncWatermark: Number(action.value) || 0,
  }),
  // This slice deliberately does NOT handle CLEAR_AUTH_SESSION or
  // SET_AUTH_SESSION. Reacting to the auth actions coupled My Pothi to the
  // sign-in/sign-out path, which is not this feature's business — the auth
  // flow must behave exactly as it did before My Pothi existed.
  // The account BOUNDARY is still enforced, one level up: `pothis` is in
  // USER_DATA_SLICES below, so CLEAR_USER_DATA resets it when a different
  // account signs in.
  [actionTypes.SET_POTHIS_SYNCED_AT]: (state, action) => ({
    ...state,
    lastSyncedAt: action.value ?? null,
  }),
});

const appReducer = combineReducers({
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
  auth,
  accountEpoch,
  settingsSync,
  syncOutbox,
  pothis,
});

// Slices holding data that belongs to a PERSON, not to this device.
//
// Deliberately NOT here: downloadRegistry (real audio files on disk — dropping
// the registry orphans them) and every display preference (theme, font size,
// language). Those describe how this phone is set up, not who is holding it.
//
// Only what the account holds a copy of, so a person signing back in gets it
// all back. Bookmarks and reminders join the list with the PRs that sync them
// (the Dashboard and Reminders); until then they stay on the phone, as they did
// before there was any sign-in, rather than being lost for good on sign-out.
const USER_DATA_SLICES = [
  // A pothi is the clearest case of person-owned data there is: the folders a
  // user built, synced to THEIR account. Left out, they survived an account
  // switch and usePothiSync uploaded the previous account's folders into the
  // new one on its first push.
  "pothis",
  // The clocks that go with the synced settings, and every change of the
  // outgoing account still waiting to be sent — neither may reach the next
  // account.
  "settingsSync",
  "syncOutbox",
];

// Wrapping combineReducers rather than adding a handler to each slice: this
// keeps the "what counts as user data" list in one readable place, and a slice
// added later is opt-in rather than silently surviving an account switch.
const rootReducer = (state, action) => {
  if (action.type === actionTypes.CLEAR_USER_DATA && state) {
    const next = { ...state };
    // Deleting the key (rather than setting undefined) makes combineReducers
    // hand each of these reducers `undefined`, so they return their own initial
    // state — no separate copy of the defaults to drift out of sync.
    USER_DATA_SLICES.forEach((key) => delete next[key]);
    const cleared = appReducer(next, action);
    // The outbox restarts empty but keeps counting: an op from before the
    // reset may still be in flight, and its late done/failed must not land on
    // a new op that reused its id (ids end in the sequence number).
    const seq = state.syncOutbox?.seq ?? cleared.syncOutbox.seq;
    return { ...cleared, syncOutbox: { ...cleared.syncOutbox, seq } };
  }
  return appReducer(state, action);
};

export default rootReducer;
