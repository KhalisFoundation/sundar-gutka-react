import * as actionTypes from "../actions/actionTypes";

// Settings across devices — the pure half.
//
// The preferences live as flat redux slices written from dozens of places
// that know nothing about sync. This module names the ones that belong to the
// PERSON rather than to the phone, turns "a slice changed" into the operations
// the server understands, builds the bulk-sync payload, and folds a server
// answer back into dispatches — all without React, Redux or the network, so
// every rule has a unit test.
//
// Per-key clocks, not one clock for the document: two devices changing two
// DIFFERENT settings both win. Clocks live in the `settingsSync` slice:
//   clocks        { [key]: ms }  when THIS device last changed the setting
//   base          { [key]: ms }  the server clock last seen per key — sent as
//                                `baseUpdatedAt` so a write over a version this
//                                device has not seen is refused
//   lastSyncedAt  the server watermark from the last sync
//
// What is NOT synced, deliberately: language is included, statistics consent,
// download policy (Wi-Fi only / auto-download), the per-shabad maps
// (auto-scroll speed, default reciter) and the Home list font are not. The
// first is a privacy decision made per device; the download rules describe
// this phone's plan and storage; the maps are large and per-bani rather than
// preferences; and the Home font is forced by HomeScreen on every visit.

/**
 * Setting key → the action type that writes it. The value is applied with a
 * raw `{ type, value }` dispatch rather than through the action creator, so a
 * change that arrived from another device is never reported to analytics as
 * a change this user made.
 */
export const SYNCED_SETTINGS = Object.freeze({
  fontSize: actionTypes.SET_FONT_SIZE,
  baniFontFace: actionTypes.SET_BANI_FONT_FACE,
  language: actionTypes.SET_LANGUAGE,
  transliterationLanguage: actionTypes.SET_TRANSLITERATION,
  isTransliteration: actionTypes.TOGGLE_TRANSLITERATION,
  theme: actionTypes.SET_THEME,
  isStatusBar: actionTypes.TOGGLE_STATUS_BAR,
  isScreenAwake: actionTypes.TOGGLE_SCREEN_AWAKE,
  isAutoScroll: actionTypes.TOGGLE_AUTO_SCROLL,
  isAudioAutoPlay: actionTypes.TOGGLE_AUDIO_AUTO_PLAY,
  isAudioSyncScroll: actionTypes.TOGGLE_AUDIO_SYNC_SCROLL,
  audioPlaybackSpeed: actionTypes.SET_AUDIO_PLAYBACK_SPEED,
  baniLength: actionTypes.SET_BANI_LENGTH,
  isLarivaar: actionTypes.TOGGLE_LARIVAAR,
  isLarivaarAssist: actionTypes.TOGGLE_LARIVAAR_ASSIST,
  isParagraphMode: actionTypes.TOGGLE_PARAGRAPH_MODE,
  padched: actionTypes.SET_PADCHHED,
  isVishraam: actionTypes.TOGGLE_VISHRAAM,
  vishraamOption: actionTypes.SET_VISHRAAM_OPTION,
  vishraamSource: actionTypes.SET_VISHRAAM_SOURCE,
  isEnglishTranslation: actionTypes.TOGGLE_ENGLISH_TRANSLATION,
  isPunjabiTranslation: actionTypes.TOGGLE_PUNJABI_TRANSLATION,
  isSpanishTranslation: actionTypes.TOGGLE_SPANISH_TRANSLATION,
  isHeaderFooter: actionTypes.TOGGLE_HEADER_FOOTER,
  baniOrder: actionTypes.SET_BANI_ORDER,
});

export const SYNCED_SETTING_KEYS = Object.freeze(Object.keys(SYNCED_SETTINGS));

export const emptySettingsSync = () => ({ clocks: {}, base: {}, lastSyncedAt: 0 });

/** The synced settings as the store holds them right now. */
export const snapshotSettings = (state) => {
  const snap = {};
  SYNCED_SETTING_KEYS.forEach((key) => {
    snap[key] = state[key];
  });
  return snap;
};

/** Stable serialisation, so two orderings of one object compare equal. */
const canonical = (value) =>
  JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );

export const sameValue = (a, b) => canonical(a) === canonical(b);

/**
 * The keys whose value differs between two snapshots. `undefined` never
 * counts as a value: a slice that is not yet hydrated must not be pushed as
 * "the user cleared this".
 */
export const diffSettings = (prev, next) =>
  SYNCED_SETTING_KEYS.filter((key) => next[key] !== undefined && !sameValue(prev[key], next[key]));

/**
 * The bulk-sync body: only the settings THIS device has changed (those with a
 * clock), each with that clock. An untouched device sends nothing, so it can
 * never overwrite another device's choice with its own defaults.
 */
export const buildSyncPayload = ({ snapshot, meta }) => ({
  settings: SYNCED_SETTING_KEYS.filter(
    (key) => meta.clocks[key] > 0 && snapshot[key] !== undefined
  ).map((key) => ({
    key,
    value: snapshot[key] === undefined ? null : snapshot[key],
    updatedAt: meta.clocks[key],
  })),
  lastSyncedAt: meta.lastSyncedAt || 0,
});

/**
 * Fold a server snapshot into this device: which raw actions to dispatch, and
 * the new sync meta. A setting whose server clock is not newer than what this
 * device holds is left alone; one this build does not know is ignored, so a
 * newer app's settings never crash an older one.
 *
 * @param {{ settings: Record<string, {value: unknown, updatedAt: number}>, syncedAt: number }} result
 * @param {{ snapshot: object, meta: object }} local
 * @returns {{ actions: Array<{type: string, value: unknown}>, meta: object }}
 */
export const applySyncResult = (result, { snapshot, meta }) => {
  const actions = [];
  const base = { ...meta.base };
  const clocks = { ...meta.clocks };
  const incoming = result?.settings || {};

  SYNCED_SETTING_KEYS.forEach((key) => {
    const remote = incoming[key];
    if (!remote || typeof remote.updatedAt !== "number") return;
    const seen = base[key] || 0;
    base[key] = Math.max(seen, remote.updatedAt);
    // Newer on the server than anything this device has sent or seen: adopt.
    // A local edit made after this device's last sync keeps its own clock and
    // wins if it is later; the next push carries it up.
    const localClock = clocks[key] || 0;
    if (remote.updatedAt <= seen && sameValue(snapshot[key], remote.value)) return;
    if (localClock > remote.updatedAt) return;
    if (!sameValue(snapshot[key], remote.value)) {
      actions.push({ type: SYNCED_SETTINGS[key], value: remote.value });
    }
    // The device now holds the server's copy; its own clock is spent.
    delete clocks[key];
  });

  return {
    actions,
    meta: {
      clocks,
      base,
      lastSyncedAt: Math.max(meta.lastSyncedAt || 0, Number(result?.syncedAt) || 0),
    },
  };
};
