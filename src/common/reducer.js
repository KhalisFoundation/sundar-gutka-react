import { combineReducers } from "@reduxjs/toolkit";
import * as actionTypes from "./actions/actionTypes";
import constant from "./constant";
import * as pothiModel from "./pothi/model";
import { emptyRemindersSync } from "./reminders/syncModel";
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

const fontFace = createReducer(constant.BALOO_PAAJI, {
  [actionTypes.SET_FONT_FACE]: (state, action) => action.value,
});

// Font used only for the Bani (scripture) text inside the Reader's WebView —
// independent of `fontFace`, which drives Gurmukhi titles elsewhere in the app.
const baniFontFace = createReducer(constant.GURBANI_AKHAR_TRUE, {
  [actionTypes.SET_BANI_FONT_FACE]: (state, action) => action.value,
});

// The Bani font the reader picked for THEMSELVES, as opposed to one a theme
// applied. A theme with no face of its own restores it — see applyTheme. Null
// until one is known. Persisted, so a trip through a theme cannot lose it.
const ownBaniFontFace = createReducer(null, {
  [actionTypes.SET_OWN_BANI_FONT_FACE]: (state, action) => action.value,
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
// user's later manual toggle is permanent. See setReaderTheme().
const readerThemeSeeded = createReducer(
  {},
  {
    [actionTypes.MARK_READER_THEME_SEEDED]: (state, action) => ({
      ...state,
      [action.value]: true,
    }),
  }
);

// `true` means HIDDEN — it is the value of the "Hide Status Bar" switch, not of
// the bar. It ships ON: a first launch is full screen, which is what a reading
// app wants, and the clock and battery are one tap away for anyone who wants
// them back.
//
// From then on the switch is the only thing that decides it. The value is
// persisted (it is not in the `store.js` blacklist) and nothing overwrites it —
// no migration, and, since MainActivity stopped hiding `Type.systemBars()`, no
// native re-apply either. That native override is why the setting used to look
// like it was not remembered: it was saved correctly and then overruled a
// moment after every launch.
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

// Per-reminder sync clocks, tombstones and server bases — see
// reminders/syncModel. Persisted, and reset with the reminders themselves on
// an account switch (USER_DATA_SLICES).
const remindersSync = createReducer(emptyRemindersSync(), {
  [actionTypes.MERGE_REMINDER_SYNC_META]: (state, action) => {
    const p = action.payload || {};
    if (p.replace) return { ...emptyRemindersSync(), ...p.replace };
    const clocks = { ...state.clocks, ...(p.clocks || {}) };
    const tombstones = { ...state.tombstones, ...(p.tombstones || {}) };
    const base = { ...state.base, ...(p.base || {}) };
    (p.removeTombstones || []).forEach((id) => delete tombstones[id]);
    (p.removeClocks || []).forEach((id) => {
      delete clocks[id];
      delete base[id];
    });
    return {
      clocks,
      tombstones,
      base,
      settingsUpdatedAt: p.settingsUpdatedAt ?? state.settingsUpdatedAt,
      settingsBase: p.settingsBase ?? state.settingsBase,
      lastSyncedAt: p.lastSyncedAt ?? state.lastSyncedAt,
    };
  },
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
  [actionTypes.CLEAR_SYNC_FEATURE]: (state, action) =>
    outbox.clearFeature(state, action.payload.feature),
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

// ONE auto-scroll speed for every bani. It was kept per bani, so a speed
// chosen in Jaap Sahib meant nothing in Japji Sahib and every bani started at
// the default again. Per device, not per account: see settings/syncModel.
const autoScrollSpeed = (state = null, action) => {
  switch (action.type) {
    case actionTypes.SET_AUTO_SCROLL_SPEED:
      return action.value;
    default:
      return state;
  }
};

// The per-bani map the speed used to live in. Read-only now: nothing writes
// it, and it stays registered only so an existing install's persisted values
// can seed `autoScrollSpeed` the first time the slider is shown.
const autoScrollSpeedObj = (state = {}) => state;

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

const donor = createReducer(false, {
  [actionTypes.SET_DONOR_STATE]: (state, action) => action.value.donor,
  [actionTypes.CLEAR_DONOR_STATE]: () => false,
});

const donorType = createReducer(null, {
  [actionTypes.SET_DONOR_STATE]: (state, action) => action.value.donorType,
  [actionTypes.CLEAR_DONOR_STATE]: () => null,
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

// Transient visibility of the full-screen onboarding carousel. NOT persisted
// (see store.js blacklist) so it never re-shows on its own after a restart —
// the persisted `seenOnboardingVersion` below drives the first-run auto-open.
const onboardingVisible = createReducer(false, {
  [actionTypes.SET_ONBOARDING_VISIBLE]: (state, action) => action.value,
});

// The onboarding-carousel version this user has completed (finished or skipped).
// useOnboardingTrigger auto-opens the carousel whenever this is below
// constant.ONBOARDING_VERSION, so the carousel shows exactly once per onboarding
// version — fresh installs, upgraders from old versions, and users who already
// saw an earlier onboarding all see the current one once (bumping
// ONBOARDING_VERSION re-shows it to everyone). Defaults to 0 = never completed.
// Renaming the key from the old boolean also resets existing users, so the very
// first build carrying this change re-shows the carousel to everyone once.
// "Revisit Tutorial" reopens the carousel regardless of this value.
const seenOnboardingVersion = createReducer(0, {
  [actionTypes.SET_ONBOARDING_SEEN]: (state, action) => action.value,
});
// ─── Dashboard redesign ───────────────────────────────────────────────────
// Default top-to-bottom section order from the new design.
// Today first, then the day's reading — streak, nitnem, hukamnama — followed by
// the places to go next, and the numbers about what has already been read last.
const DEFAULT_DASHBOARD_ORDER = [
  constant.DASHBOARD_SECTIONS.STREAK,
  constant.DASHBOARD_SECTIONS.NITNEM,
  constant.DASHBOARD_SECTIONS.SHABAD_VAAK,
  constant.DASHBOARD_SECTIONS.EXPLORE,
  constant.DASHBOARD_SECTIONS.DISCOVER,
  constant.DASHBOARD_SECTIONS.REMINDERS,
  constant.DASHBOARD_SECTIONS.PRACTICE,
  constant.DASHBOARD_SECTIONS.CALENDAR,
  constant.DASHBOARD_SECTIONS.WEEK_CHART,
];

// Orders this app has shipped as its default, newest last.
//
// `defaultLayout()` is persisted on the very first launch, so EVERY install
// carries an order on disk whether or not the user ever opened the layout
// editor. Changing the default alone therefore reaches nobody. An order that
// still matches one of these was written by the app and not chosen by anyone,
// so it is safe to move it onto the current default; anything else is the
// user's own arrangement and is left exactly as they left it.
const LEGACY_DASHBOARD_ORDERS = [
  [
    constant.DASHBOARD_SECTIONS.STREAK,
    constant.DASHBOARD_SECTIONS.NITNEM,
    constant.DASHBOARD_SECTIONS.EXPLORE,
    constant.DASHBOARD_SECTIONS.PRACTICE,
    constant.DASHBOARD_SECTIONS.CALENDAR,
    constant.DASHBOARD_SECTIONS.WEEK_CHART,
    constant.DASHBOARD_SECTIONS.DISCOVER,
    constant.DASHBOARD_SECTIONS.REMINDERS,
    constant.DASHBOARD_SECTIONS.SHABAD_VAAK,
  ],
];

const sameOrder = (a, b) => a.length === b.length && a.every((key, i) => key === b[i]);

/** True when a persisted order is an untouched default from an earlier release. */
const isUncustomisedOrder = (order) =>
  LEGACY_DASHBOARD_ORDERS.some((legacy) => sameOrder(order, legacy));

// Section keys that are still valid (used to strip deprecated keys from a
// persisted layout on upgrade — e.g. the old standalone randomShabad/vaak).
const VALID_DASHBOARD_SECTIONS = new Set(Object.values(constant.DASHBOARD_SECTIONS));

// Re-insert any sections missing from a persisted order AT their default position
// — right after the nearest preceding default-neighbour that's present — instead
// of appending them to the end. This keeps a re-added section (e.g. Explore after
// a key change/upgrade) in its designed slot (right after Nitnem) rather than
// sinking it to the bottom of the dashboard.
const withMissingAtDefaultPos = (order) => {
  const result = [...order];
  DEFAULT_DASHBOARD_ORDER.forEach((key, defaultIdx) => {
    if (result.includes(key)) return;
    let insertAt = result.length;
    for (let i = defaultIdx - 1; i >= 0; i -= 1) {
      const pos = result.indexOf(DEFAULT_DASHBOARD_ORDER[i]);
      if (pos !== -1) {
        insertAt = pos + 1;
        break;
      }
    }
    result.splice(insertAt, 0, key);
  });
  return result;
};

// `modifiedAt` is the device clock of the last edit, carried in the account
// snapshot so two devices can tell whose profile is newer per block rather
// than guessing from push times. A restore passes the server's value through.
const userProfile = createReducer(
  { name: "", modifiedAt: 0 },
  {
    [actionTypes.SET_USER_PROFILE]: (state, action) => ({
      ...state,
      ...action.value,
      modifiedAt: action.value?.modifiedAt ?? Date.now(),
    }),
  },
);

// Khalis SSO session state. Blacklisted from redux-persist (see store.js): the
// claims carry an email + SAML nameID and redux-persist writes unencrypted
// AsyncStorage. Blacklisting also guarantees "unknown" on cold start, so the UI
// cannot flash a signed-in state before the Keychain read resolves.
const auth = createReducer(
  { status: "unknown", user: null, expiresAt: null, busy: false },
  {
    [actionTypes.SET_AUTH_SESSION]: (state, action) => ({
      status: "signedIn",
      user: action.value?.user ?? null,
      expiresAt: action.value?.expiresAt ?? null,
      busy: false,
    }),
    [actionTypes.CLEAR_AUTH_SESSION]: () => ({
      status: "signedOut",
      user: null,
      expiresAt: null,
      busy: false,
    }),
    [actionTypes.SET_AUTH_BUSY]: (state, action) => ({ ...state, busy: !!action.value }),
  },
);

const defaultLayout = () => ({ order: [...DEFAULT_DASHBOARD_ORDER], hidden: [], modifiedAt: 0 });

const dashboardLayout = createReducer(defaultLayout(), {
  // On rehydrate: drop any deprecated section keys (e.g. the old standalone
  // randomShabad/vaak now merged into shabadVaak) and append newly added default
  // sections, so an upgrading user neither loses a section nor sees a dead key.
  "persist/REHYDRATE": (state, action) => {
    const persisted = action.payload?.dashboardLayout;
    if (!persisted?.order) return state; // fresh install → keep default
    const cleaned = persisted.order.filter((k) => VALID_DASHBOARD_SECTIONS.has(k));
    return {
      order: isUncustomisedOrder(cleaned)
        ? [...DEFAULT_DASHBOARD_ORDER]
        : withMissingAtDefaultPos(cleaned),
      hidden: (persisted.hidden ?? []).filter((k) => VALID_DASHBOARD_SECTIONS.has(k)),
      modifiedAt: persisted.modifiedAt ?? 0,
    };
  },
  [actionTypes.SET_DASHBOARD_LAYOUT]: (state, action) => {
    const next = { ...state, ...action.value };
    // Self-heal: ensure any newly added sections land in their default slot.
    return {
      order: withMissingAtDefaultPos(next.order),
      hidden: next.hidden ?? [],
      // See userProfile: the clock another device compares its copy against.
      modifiedAt: action.value?.modifiedAt ?? Date.now(),
    };
  },
  [actionTypes.RESET_DASHBOARD_LAYOUT]: () => defaultLayout(),
});

// What has been READ today, and nothing else.
//
// WHICH banis make up today's Nitnem is not here: it is the Morning Nitnem
// pothi, so the Dashboard card and the pothi can never disagree about what the
// user's Nitnem is. This slice used to carry its own `selectedBaniIds` list —
// a second, unrelated set that started as [2, 6, 4, 9, 21, 1] while Morning
// Nitnem started as [2, 4, 6, 9, 10]. See TodaysNitnem.
const todaysNitnem = createReducer(
  // `completed[date]`  : ids done today (manual ticks + auto 95%-scroll reads).
  // `autoSeeded[date]` : ids auto-completion has already folded in once, so a
  //                      manual un-tick is never resurrected on the next refocus.
  // `untickedAt[date][baniId]` : when a manual un-tick happened, so a LATER
  //                      genuine re-read still counts (autoSeeded alone could
  //                      not tell the two apart and blocked both).
  { completed: {}, autoSeeded: {}, untickedAt: {} },
  {
    [actionTypes.TOGGLE_NITNEM_DONE]: (state, action) => {
      const { date, baniId, at = Date.now() } = action.payload;
      const dayList = state.completed[date] ?? [];
      const removing = dayList.includes(baniId);
      const nextDay = removing ? dayList.filter((id) => id !== baniId) : [...dayList, baniId];
      // WHEN the un-tick happened, so auto-detection can tell a read that
      // predates it (the same old read, re-reported on every dashboard
      // refocus — must stay un-ticked) from one that came after it (the user
      // genuinely went and read the bani again — must count).
      const untickedAt = state.untickedAt ?? {};
      const dayMarks = { ...(untickedAt[date] ?? {}) };
      if (removing) dayMarks[baniId] = at;
      else delete dayMarks[baniId];
      return {
        ...state,
        completed: { ...state.completed, [date]: nextDay },
        untickedAt: { ...untickedAt, [date]: dayMarks },
      };
    },
    // Auto-detected 95%-scroll completions fold into the same per-day list
    // TOGGLE_NITNEM_DONE writes — but only ids we've NEVER auto-added before
    // (tracked in autoSeeded). Once seeded, an id the user manually un-ticks
    // stays un-ticked: it is not re-added here on the next dashboard refocus.
    [actionTypes.MARK_NITNEM_AUTO_DONE]: (state, action) => {
      const { date, baniIds } = action.payload;
      if (!baniIds || baniIds.length === 0) return state;
      const autoSeeded = state.autoSeeded ?? {};
      const seededDay = autoSeeded[date] ?? [];
      const untickedDay = (state.untickedAt ?? {})[date] ?? {};
      // Entries are either a bare id or `{ id, at }` carrying the moment the
      // read actually completed.
      const freshIds = baniIds
        .map((entry) => (typeof entry === "object" && entry !== null ? entry : { id: entry }))
        .filter(({ id, at }) => {
          const unticked = untickedDay[id];
          // A read we can date beats the seed list outright: the user un-ticked
          // this, then went and read it again, and that second read has to
          // count. Judging it by `autoSeeded` alone is what left a fully
          // scrolled bani stuck un-ticked for the rest of the day.
          if (at != null) return unticked == null || at > unticked;
          // Undated (a bulk call, or a legacy caller) — fall back to the seed
          // list, which still stops a refocus resurrecting an un-tick.
          return !seededDay.includes(id);
        })
        .map(({ id }) => id);
      if (freshIds.length === 0) return state;
      const dayList = state.completed[date] ?? [];
      return {
        ...state,
        completed: {
          ...state.completed,
          [date]: Array.from(new Set([...dayList, ...freshIds])),
        },
        autoSeeded: {
          ...autoSeeded,
          [date]: Array.from(new Set([...seededDay, ...freshIds])),
        },
      };
    },
    // The "Mark done" button. Unlike MARK_NITNEM_AUTO_DONE this consults no
    // seed list: the user is stating outright that these are read, so a
    // previous auto-seed of the same id must not veto it. It seeds too, so the
    // background auto-detection has nothing left to re-add afterwards.
    [actionTypes.MARK_NITNEM_DONE]: (state, action) => {
      const { date, baniIds } = action.payload;
      if (!baniIds || baniIds.length === 0) return state;
      const autoSeeded = state.autoSeeded ?? {};
      const dayList = state.completed[date] ?? [];
      // Marking done clears any earlier un-tick for these banis — the user has
      // just overridden it, so it must not go on suppressing auto-detection.
      const untickedAt = state.untickedAt ?? {};
      const dayMarks = { ...(untickedAt[date] ?? {}) };
      baniIds.forEach((id) => delete dayMarks[id]);
      return {
        ...state,
        completed: {
          ...state.completed,
          [date]: Array.from(new Set([...dayList, ...baniIds])),
        },
        autoSeeded: {
          ...autoSeeded,
          [date]: Array.from(new Set([...(autoSeeded[date] ?? []), ...baniIds])),
        },
        untickedAt: { ...untickedAt, [date]: dayMarks },
      };
    },
    // Completion history only. The restored payload still carries the old
    // `selectedBaaniIds`, but the bani SET now comes from the Morning Nitnem
    // pothi, which My Pothi syncs on its own account — see usePothiSync.
    // Union per date, NOT replace. A tick records that a bani was read that
    // day — a fact rather than a preference — so a day ticked on either side
    // stays ticked. Replacing wholesale threw away whatever this device had
    // done while signed out, which on a restore is the user's own work, and
    // it made the cloud snapshot beat a second device for the same day.
    [actionTypes.RESTORE_NITNEM]: (state, action) => {
      const incoming = action.value?.completed;
      if (!incoming) return state;
      const completed = { ...state.completed };
      Object.keys(incoming).forEach((date) => {
        completed[date] = [...new Set([...(completed[date] ?? []), ...(incoming[date] ?? [])])];
      });
      return { ...state, completed };
    },
  },
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
  [actionTypes.POTHI_DELETE_SYNCED]: (state, action) =>
    pothiModel.clearTombstone(state, action.value),
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

// Reading themes served by the backend — raw rows, sanitised on the way in
// (useRemoteThemesSync) and built into records on the way out
// (theme/reader/registry). Persisted, so a device offline for a month keeps
// the themes it last saw; NOT user data — a theme list is the same for
// every account, so it survives sign-out and an account switch.
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

const appReducer = combineReducers({
  donor,
  donorType,
  isNightMode,
  fontSize,
  fontFace,
  baniFontFace,
  ownBaniFontFace,
  language,
  transliterationLanguage,
  isTransliteration,
  theme,
  readerThemeSeeded,
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
  remindersSync,
  settingsSync,
  syncOutbox,
  autoScrollSpeed,
  autoScrollSpeedObj,
  baniOrder,
  baniList,
  savePosition,
  scrollPosition,
  isHeaderFooter,
  isDatabaseUpdateAvailable,
  audioManifest,
  audioCatalog,
  audioCatalogMeta,
  remoteThemes,
  audioProgress,
  currentBani,
  readerTapTick,
  readerScrollDownTick,
  isPlayerDragging,
  downloadQueue,
  downloadRegistry,
  downloadWifiOnly,
  autoDownloadOnStream,
  onboardingVisible,
  seenOnboardingVersion,
  userProfile,
  auth,
  dashboardLayout,
  todaysNitnem,
  pothis,
});
// Slices holding data that belongs to a PERSON, not to this device.
//
// Deliberately NOT here: downloadRegistry (real audio files on disk — dropping
// the registry orphans them) and every display preference (theme, font size,
// language). Those describe how this phone is set up, not who is holding it.
const USER_DATA_SLICES = [
  // A pothi is the clearest case of person-owned data there is: the folders a
  // user built, synced to THEIR account. Left out, they survived an account
  // switch and usePothiSync uploaded the previous account's folders into the
  // new one on its first push.
  "pothis",
  "userProfile",
  "dashboardLayout",
  "todaysNitnem",
  "bookmarkPosition",
  "bookmarkSequenceString",
  "isReminders",
  "reminderBanis",
  "reminderSound",
  // The clocks that go with the reminders, and every change of the outgoing
  // account still waiting to be sent — neither may reach the next account.
  "remindersSync",
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
    return appReducer(next, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
