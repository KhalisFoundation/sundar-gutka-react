import { useEffect } from "react";
import { AppState, InteractionManager } from "react-native";
import { useDispatch, useStore } from "react-redux";
import { mergeThemeRegistry, sanitizeRemoteTheme } from "@theme/reader/registry";
import { setRemoteThemes, setTheme } from "@common/actions";
import { constant, logError, trackThemeEvent, useNetwork } from "@common";
import { fetchRemoteThemes } from "../themesApi";

// Keeps the persisted `remoteThemes` slice current.
//
// The slice is persisted, so a device offline for a month keeps the themes it
// last saw, and a fresh install with no connection is simply on the bundled
// light/dark pair until it has a connection to ask over.
//
// Rows are sanitised BEFORE they are stored, so the persisted slice never holds
// a row this build could not render; the registry sanitises again on read,
// which costs nothing and keeps the two independent.

/* global __DEV__ */

/**
 * How long a catalogue stays fresh for the BACKGROUND top-up.
 *
 * A week. Nothing reads this fetch — the catalogue is only ever seen in the
 * picker, and the picker asks for itself. So the background pass exists to
 * cover one case: a device that has never fetched, or has not opened the
 * picker in a very long time. Polling it harder buys nothing a user could
 * notice and costs a request per install per interval, for a table that
 * changes a few times a year.
 *
 * This is the POLICY and nothing bends it — the debug-build shortcut lives at
 * the call sites, as a `force`. Baking `__DEV__` in here would make it zero
 * under jest too, and the freshness rules could not be tested at all.
 */
export const REFRESH_MIN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * How long it stays fresh for the PICKER.
 *
 * Five minutes, which is a debounce rather than a cache: opening the theme
 * screen is a deliberate act, it is the one place the catalogue is visible,
 * and one small request is proportionate to being asked. The five minutes only
 * stops a user who opens and closes the screen repeatedly from sending a
 * request each time.
 *
 * This is why the background interval above can be a week: freshness where it
 * matters is bought here, at the moment it matters, instead of by polling
 * every device on a timer.
 */
export const PICKER_REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Debug builds ignore the TTL.
 *
 * Someone editing `reader_themes` and reloading expects to SEE the row they
 * just changed; waiting a day for it makes the feature untestable, and the
 * request costs nothing against a local API.
 */
const FORCE_EVERY_TIME = __DEV__;

/**
 * One fetch at a time across the WHOLE app.
 *
 * Module-level rather than a ref, because there are two callers — the
 * background sync and the picker — and they can fire at the same instant: the
 * picker is often opened in the same moment a connection returns. A ref per
 * hook would let both through.
 */
let inFlight = false;

/**
 * True when the cached catalogue is older than `ttl`, or was never fetched.
 * The caller passes the interval that applies to it — they are different
 * questions, so there is no sensible single default beyond the background one.
 */
export const isStale = (slice, ttl = REFRESH_MIN_INTERVAL_MS, now = Date.now()) =>
  now - (slice?.fetchedAt || 0) >= ttl;

/**
 * Move the user off a theme the backend has just withdrawn.
 *
 * Without this the setting keeps pointing at an id nothing can resolve: the
 * picker shows no tile selected, and the app falls back on its own — which for
 * someone reading in a withdrawn DARK theme means being put into light mode
 * with no explanation. Neither is a state the app should be able to reach.
 *
 * The replacement is the withdrawn theme's own appearance, read off the record
 * while it is still in the OLD registry. That is the closest honest answer:
 * the theme is gone, but the light-or-dark the person was reading in is not.
 */
const healWithdrawnTheme = (store, dispatch, previous, themes) => {
  const selected = store.getState().theme;
  const before = mergeThemeRegistry(previous).byId[selected];
  // Only a theme that EXISTED and no longer does. An appearance keyword is not
  // in the registry at all and must never be touched.
  if (!before) return;
  if (mergeThemeRegistry({ themes }).byId[selected]) return;
  dispatch(setTheme(before.base === "dark" ? constant.Dark : constant.Light));
};

/**
 * Fetch and store, unless the cache is still fresh.
 *
 * Never throws and never surfaces anything: a failure leaves the device on the
 * themes it already has, which is the whole point of persisting them. `force`
 * bypasses the TTL only — it cannot bypass the in-flight guard.
 */
export const refreshRemoteThemes = async (
  store,
  dispatch,
  { force = false, ttl = REFRESH_MIN_INTERVAL_MS } = {}
) => {
  if (inFlight) return;
  const current = store.getState().remoteThemes || {};
  if (!force && !isStale(current, ttl)) return;
  inFlight = true;
  try {
    const res = await fetchRemoteThemes();
    if (!res.ok) return;
    const themes = res.themes.map(sanitizeRemoteTheme).filter(Boolean);
    // An empty catalogue is not news, it is a symptom. The API's own documented
    // failure mode is "last good cache, then an empty list" (themes.service.ts),
    // so a healthy 200 carrying nothing is exactly what a device sees while the
    // backend's database is unreachable — and taking it at face value would
    // strip every remote theme from every install over a transient fault, and
    // take the user's chosen theme with it. Withdrawal has its own expression:
    // an `enabled: false` row, which keeps the list non-empty. So nothing is
    // the one answer that changes nothing.
    if (themes.length === 0 && current.themes?.length) return;
    dispatch(setRemoteThemes({ version: res.version, themes, fetchedAt: Date.now() }));
    healWithdrawnTheme(store, dispatch, current, themes);
    // Only when the catalogue actually moved — otherwise every launch would
    // report a "load" that changed nothing.
    if (res.version !== current.version) {
      trackThemeEvent("remote_loaded", { count: themes.length, version: res.version });
    }
  } catch (error) {
    logError(error);
  } finally {
    inFlight = false;
  }
};

/**
 * The background half: a top-up that never competes with startup.
 *
 * NOTHING here is on the launch path. The catalogue is read in exactly one
 * place — the theme picker — and the theme a user is actually READING in comes
 * from the persisted slice, not from this. So the fetch has no deadline, while
 * everything it would compete with at launch does: the bundled DB seed, the
 * first Home mount, the dashboard's own calls.
 *
 * It therefore waits out the launch window and then waits again for any running
 * interaction, the same shape as the audio catalogue sweep. If the user opens
 * the picker before the timer fires, that screen asks for itself and this finds
 * the catalogue fresh and does nothing.
 *
 * The connectivity dependency is what makes a fresh install work: someone who
 * first opens the app on a plane has no catalogue, and this re-arms the moment
 * a usable connection appears rather than leaving them with nothing until they
 * happen to background and foreground the app. `useNetwork` is the app's single
 * connectivity source and is captive-portal aware.
 */
const useRemoteThemesSync = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const { isOnline } = useNetwork();

  useEffect(() => {
    if (!isOnline) return undefined;

    let cancelled = false;
    const runDeferred = () =>
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        refreshRemoteThemes(store, dispatch, { force: FORCE_EVERY_TIME });
      });

    const timer = setTimeout(runDeferred, constant.THEMES_SYNC_DELAY_MS);

    // Coming back to a warm app is not the launch path, but it is still not
    // worth doing while something is animating.
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") runDeferred();
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.remove();
    };
  }, [dispatch, store, isOnline]);
};

/**
 * The foreground half: opening the theme picker.
 *
 * This is the one moment freshness is worth a request — it is the only screen
 * where a stale catalogue is visible as a missing or wrong tile. Still
 * TTL-gated, so opening the screen five times in a row is one fetch at most,
 * and offline it does nothing at all.
 */
export const useThemePickerRefresh = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const { isOnline } = useNetwork();

  useEffect(() => {
    if (!isOnline) return;
    refreshRemoteThemes(store, dispatch, {
      force: FORCE_EVERY_TIME,
      ttl: PICKER_REFRESH_MIN_INTERVAL_MS,
    });
  }, [dispatch, store, isOnline]);
};

export default useRemoteThemesSync;
