import AsyncStorage from "@react-native-async-storage/async-storage";
import { baniItems, defaultPothi } from "@common/pothi/model";
import { to24h } from "@common/reminders/time";
import { constant, actions, logError } from "@common";
import { readToken } from "../../common/sso/tokenStore";
import {
  getOrCreateSummary,
  getDailyActivity,
  getDayActivity,
  getActivityUpdatedSince,
  getTopReadBanis,
  getTopListenedBanis,
  getRecentReadBanis,
  getRecentListenedBanis,
  getAllTimeTotals,
  raiseAllTimeBaseline,
  setDailyActivity,
  updateSummary,
} from "../../database/analytics";
import { DASHBOARD_ACCOUNT_TODAY_KEY } from "./syncKeys";

// Account dashboard sync: push (POST /dashboard/cache) and restore
// (GET /dashboard/latest). Restore applies the user-setup blocks (profile,
// layout, nitnem, reminders) into Redux and seeds analytics SQLite from the
// snapshot.
//
// ACCOUNT-keyed and authenticated. The server reads the owner from the bearer
// token, which is why restore sends no deviceId: a caller must not be able to
// name whose snapshot it reads. `deviceId` still travels in the POST body, but
// only as metadata and as the key for adopting snapshots pushed before the user
// had an account.
//
// Both calls therefore require a signed-in session. Callers gate on that; a 401
// here is reported as `unauthorized` rather than thrown, because a lapsed
// session is a normal state, not a sync failure worth logging on every blur.

const latestUrl = () =>
  constant.DASHBOARD_LATEST_API_URL || `${constant.DASHBOARD_API_BASE_URL || ""}/dashboard/latest`;
const syncUrl = () =>
  constant.DASHBOARD_SYNC_API_URL || `${constant.DASHBOARD_API_BASE_URL || ""}/dashboard/cache`;

const fetchLatest = async () => {
  const token = await readToken();
  if (!token) return { unauthorized: true };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    // No query string: the account comes from the token. Passing a deviceId
    // would let a caller read another device's snapshot.
    const res = await fetch(latestUrl(), {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) return { unauthorized: true };
    if (res.status === 404) return { notFound: true };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: await res.json() };
  } finally {
    clearTimeout(timeoutId);
  }
};

// Returns the ACCOUNT's snapshot `payload`, or null when it has never synced
// (404) or there is no usable session (401). The backend responds
// { syncedAt, payload }.
export const getDashboardLatest = async () => {
  const { notFound, unauthorized, data } = await fetchLatest();
  if (notFound || unauthorized) return null;
  return data?.payload ?? null;
};

/**
 * The same call, but with the outcome kept DISTINGUISHABLE.
 *
 * getDashboardLatest collapses "the account genuinely has no snapshot" (404)
 * and "we could not reach the server" (throw) into the same `null`/exception,
 * and the caller needs to tell them apart. The restore marker must only be
 * written for an authoritative answer: writing it on a network failure is what
 * left `@dashboard_restored_v1` unset, which in turn gated every push for the
 * rest of the process — sync dead in both directions until the next launch.
 *
 *   ok           → the account has a snapshot; `payload` and `syncedAt` are set
 *   empty        → 404, authoritative: this account has never synced
 *   unauthorized → 401/no token, not a failure — just not signed in yet
 *   failed       → network, timeout or 5xx. Retry; decide nothing on this.
 *
 * `syncedAt` is the server's own clock, which is what makes it usable as the
 * freshness comparison the client otherwise has no basis for.
 */
export const getDashboardSnapshot = async () => {
  try {
    const { notFound, unauthorized, data } = await fetchLatest();
    if (unauthorized) return { status: "unauthorized" };
    if (notFound) return { status: "empty" };
    return {
      status: "ok",
      payload: data?.payload ?? null,
      syncedAt: data?.syncedAt ?? null,
    };
  } catch (err) {
    return { status: "failed", error: err };
  }
};

// Applies the user-setup blocks of a restored payload into Redux.
// reschedule=false by default: notifications are device-local and permission-gated,
// so the caller should reschedule (after a permission check) when appropriate.
// Returns the list of blocks that were applied.
export const applyDashboardRestore = async (
  payload,
  dispatch,
  // `reschedule` and `transliterationLanguage` are still passed by callers
  // but no longer read: they belonged to the reminders block, which now
  // syncs on its own (see below).
  { merge = false, preferences = false, local = {} } = {}
) => {
  const applied = [];
  if (!payload || !dispatch) return applied;

  // Per block, when the snapshot says when the block was last edited: take
  // it only if that is later than this device's own edit. Snapshots from
  // older app versions carry no clock, and fall back to the caller's
  // whole-snapshot decision (`preferences`).
  const takeBlock = (block, localModifiedAt) => {
    if (!merge) return true;
    if (block?.modifiedAt == null) return preferences;
    return Number(block.modifiedAt) > Number(localModifiedAt ?? 0);
  };

  // A refresh pull always brings completion history down. Whether it also
  // brings PREFERENCES — the section order, hidden sections, display name,
  // reminders — is the caller's decision, because the two need different rules.
  //
  // Completions are additive facts and merge safely at any time. Preferences
  // are single-valued, so the only sane rule is last-write-wins, and applying
  // that indiscriminately would let a routine background poll rearrange the
  // dashboard under someone's hands using a snapshot this very device wrote.
  //
  // So the caller passes `preferences` only when the server's copy is genuinely
  // NEWER than anything this device has sent — meaning another device changed
  // it — or when the user has explicitly pulled to refresh. Skipping it
  // entirely, which is what this did before, meant a customised layout synced
  // once at sign-in and never again.
  if (merge && payload.nitnem) {
    dispatch(actions.restoreNitnem({ completed: payload.nitnem.completed }));
    applied.push("nitnem");
  }

  if (
    payload.profile &&
    typeof payload.profile.name === "string" &&
    takeBlock(payload.profile, local.profileModifiedAt)
  ) {
    dispatch(
      actions.setUserProfile({
        name: payload.profile.name,
        modifiedAt: payload.profile.modifiedAt ?? Date.now(),
      })
    );
    applied.push("profile");
  }

  if (
    payload.layout &&
    Array.isArray(payload.layout.order) &&
    takeBlock(payload.layout, local.layoutModifiedAt)
  ) {
    dispatch(
      actions.setDashboardLayout({
        order: payload.layout.order,
        hidden: Array.isArray(payload.layout.hidden) ? payload.layout.hidden : [],
        modifiedAt: payload.layout.modifiedAt ?? Date.now(),
      })
    );
    applied.push("layout");
  }

  // `!merge` because the merge branch above has already dispatched this. The
  // reducer unions, so a repeat would be harmless, but `applied` would then
  // report "nitnem" twice and the callers read that list.
  if (payload.nitnem && !merge) {
    // Completion history only. `payload.nitnem.selectedBaaniIds` is still sent
    // and still read by other clients, but WHICH banis are in the Nitnem is the
    // Morning Nitnem pothi now, and that syncs through the folders API on the
    // account — restoring it from this per-device snapshot would overwrite the
    // account's own copy with whatever this device last pushed.
    dispatch(actions.restoreNitnem({ completed: payload.nitnem.completed }));
    applied.push("nitnem");
  }

  // Reminders are NOT restored from the snapshot any more. They sync as rows
  // of their own through /reminders (see services/reminders/useRemindersSync),
  // where two devices merge per reminder instead of the later snapshot
  // replacing the earlier one's whole list. The block is still SENT — older
  // app versions read it — but this version never applies it.
  return applied;
};

// Raw per-session tables (bani_read_history/audio_history) are device-local
// and never restored from a cloud snapshot — only the aggregates are. So
// "top read/listened banis" and "continue reading/listening" (which query
// those raw tables directly) go blank right after a reinstall for a
// returning user with real cloud history, indistinguishable from a genuinely
// new user. Cache the snapshot's own read/listen (top5 + last) here so those
// UI sections can fall back to it when the live query is empty, instead of
// showing a false "you've never read/listened to anything" state.
const RESTORED_TOP_BANIS_KEY = "@restored_top_banis_v1";

// Returns { read: {top5,last}, listen: {top5,last} } as captured at the last
// restore, or null if there's no restored snapshot (e.g. a genuinely new
// user, or nothing was ever synced). Callers should only use this as a
// fallback when their own live query returns empty.
export const getRestoredTopBanis = async () => {
  try {
    const raw = await AsyncStorage.getItem(RESTORED_TOP_BANIS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

// ─── Restore: seed analytics SQLite from the snapshot ────────────────────────
const stateUrl = () => `${constant.DASHBOARD_API_BASE_URL || ""}/dashboard/state`;

/** `YYYY-MM-DD` in the device's own calendar, the key daily_activity uses. */
const localDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;

/**
 * The account's activity as the SERVER sums it across every device
 * (GET /dashboard/state): totals, streaks and one entry per day.
 * Distinguishable outcomes, like getDashboardSnapshot — a failure must not be
 * mistaken for "no activity".
 *
 * `monthKey` NARROWS the day map to one month. Leave it out for everything the
 * account still holds, which is what a restore wants: the endpoint's filter is
 * `if (!month || day.startsWith(month))`, so omitting it returns the whole
 * retention window (thirteen months) rather than nothing.
 *
 * Asking for one month was how a reinstall lost its calendar. The pull only
 * ever named the CURRENT month, so a phone set up on the 2nd was served that
 * month alone and every earlier day — including the ones it had read — was
 * filtered out server-side before it was ever sent. The calendar reads local
 * rows only, and never re-fetches when you page back, so there was no second
 * chance: those months stayed blank on that install for good.
 */
export const getDashboardState = async (monthKey) => {
  const token = await readToken();
  if (!token) return { status: "unauthorized" };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const query = monthKey ? `?month=${encodeURIComponent(monthKey)}` : "";
    const res = await fetch(`${stateUrl()}${query}`, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) return { status: "failed", httpStatus: res.status };
    return { status: "ok", state: await res.json() };
  } catch (err) {
    return { status: "failed", error: err?.message || String(err) };
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Write the account's summed activity into local analytics, where the
 * Dashboard reads from.
 *
 * EVERY day the account sent is written, not just the current month's. The
 * month filter that used to live here was the client half of the reinstall
 * bug described on getDashboardState — with the pull now asking for the whole
 * history, re-filtering it here would throw the same days away again.
 *
 * Day rows are OVERWRITTEN with the server's sum — the sum already includes
 * this device, whose rows were pushed just before this ran — but only for days
 * before today. Today's row is still being written by this device and is
 * pushed as this device's own figure; holding the account's total in it would
 * send every other device's minutes back up under this device's name.
 *
 * The rows written here carry `updated_at = 0`, which the activity push
 * excludes outright, so they can never be mistaken for new local work and
 * sent back up under this device's name.
 *
 * The account's total for TODAY is recorded (see DASHBOARD_ACCOUNT_TODAY_KEY)
 * so the streak can count a day another device read. The server's own streak
 * count is deliberately NOT adopted: it is a second opinion computed from a
 * second rule, and with two writers the number flipped between them on every
 * refresh. Days-active and the archived longest streak are set from the server
 * — they are maxima over history this device may no longer hold.
 */
export const applyServerActivity = async (state) => {
  if (!state) return;
  try {
    const today = localDateKey();
    // `date < today` still stands: today's row belongs to this device and is
    // pushed as its own figure — see the note above.
    const days = Object.entries(state.days || {}).filter(([date]) => date < today);
    await Promise.all(
      days.map(([date, [r = 0, l = 0]]) =>
        setDailyActivity({ date, reading_seconds: r, listening_seconds: l, updatedAt: 0 })
      )
    );
    const [todayReading = 0, todayListening = 0] = state.days?.[today] ?? [];
    await AsyncStorage.setItem(
      DASHBOARD_ACCOUNT_TODAY_KEY,
      JSON.stringify({ date: today, seconds: todayReading + todayListening })
    );

    const local = await getOrCreateSummary();
    const fields = {};
    // Floored, never assigned: these are lifetime figures, and the account's
    // copy can be the smaller one — its day rows are archived after thirteen
    // months, and a repair or a rule change can take rows away. A best streak
    // or a days-active count that slides down reads as lost data, so the
    // larger of the two stands. The same rule the snapshot restore follows.
    if (state.streaks?.longest != null) {
      fields.longest_streak = Math.max(state.streaks.longest, local?.longest_streak ?? 0);
    }
    if (state.totals?.daysActive != null) {
      fields.total_days_active = Math.max(state.totals.daysActive, local?.total_days_active ?? 0);
    }
    const active = days
      .filter(([, [r = 0, l = 0]]) => r > 0 || l > 0)
      .map(([date]) => date)
      .sort();
    if (active.length) {
      // Never backwards: this device may have been active today already.
      const latest = active[active.length - 1];
      const localLast = local?.last_active_date;
      fields.last_active_date = localLast && localLast > latest ? localLast : latest;
    }
    if (Object.keys(fields).length) await updateSummary(fields);
    if (state.totals) await raiseAllTimeBaseline(state.totals);
  } catch (err) {
    logError(new Error(`applyServerActivity failed: ${err?.message || err}`));
  }
};

// Intended for a fresh install (empty analytics). Uses setDailyActivity
// (overwrite, not additive) so a repeat restore before the next cloud push
// (e.g. reinstalling twice) can't double-count a day — unlike upsertDailyActivity,
// which real sessions use and which correctly accumulates multiple same-day
// sessions.
//
// Every day row written here is stamped `updated_at = 0` — the mark for "this
// came from the ACCOUNT, not from this device". The activity push skips those
// rows, and that is load-bearing: the snapshot carries the account's totals,
// already summed across devices, so a device that filed them as its own work
// had them added to the other devices' rows on the server and the account's
// figures doubled. Which they did, on every refresh where the push or the
// state read failed and this path ran.
export const seedAnalyticsFromSnapshot = async (payload, { merge = false } = {}) => {
  if (!payload) return;
  try {
    const { month, streaks, totals, read, listen } = payload;
    if (read || listen) {
      AsyncStorage.setItem(
        RESTORED_TOP_BANIS_KEY,
        JSON.stringify({ read: read ?? null, listen: listen ?? null })
      ).catch(() => {});
    }
    let lastActiveDate = null;
    if (month?.key && Array.isArray(month.days) && month.days.length) {
      await Promise.all(
        month.days.map(async ([day, r = 0, l = 0]) => {
          const date = `${month.key}-${String(day).padStart(2, "0")}`;
          if (!merge) {
            return setDailyActivity({
              date,
              reading_seconds: r,
              listening_seconds: l,
              updatedAt: 0,
            });
          }
          // MERGE (a refresh pull, not a bootstrap): take the larger of the two
          // rather than the incoming one.
          //
          // Overwriting is right exactly once — on a fresh install or a new
          // account, where local is empty and the snapshot is all there is.
          // On every later pull local may hold reading this device has done and
          // not yet pushed, and the snapshot may have been written by ANOTHER
          // device that knew nothing about it. Overwriting there destroys real
          // user data, silently, with no way back.
          //
          // max() is not the whole answer — two devices each reading 5 minutes
          // on the same day should total ten, and this reports five. It is
          // however MONOTONIC: it can never move a number down, so it cannot
          // lose what either side recorded. Correct addition needs the server to
          // hold per-device day rows and do the summing; until then the safe
          // direction to be wrong in is the one that keeps the data.
          const local = await getDayActivity(date);
          return setDailyActivity({
            date,
            reading_seconds: Math.max(r, local?.reading_seconds ?? 0),
            listening_seconds: Math.max(l, local?.listening_seconds ?? 0),
            // The row keeps the stamp it had rather than being marked as work
            // done now: reading this device did and has not pushed yet must
            // still go up, and the account's own numbers must not go up AGAIN
            // under this device's name. A day the device never recorded starts
            // at 0 — the account's, not ours.
            updatedAt: local?.updated_at ?? 0,
          });
        })
      );
      // The streak engine treats a missing last_active_date as "never active",
      // which would immediately zero out a freshly-restored current_streak the
      // next time it runs. Derive it from the latest restored day so it doesn't.
      const latestDay = Math.max(...month.days.map(([day]) => day));
      lastActiveDate = `${month.key}-${String(latestDay).padStart(2, "0")}`;
    }
    // In merge mode every counter is floored at what this device already holds,
    // for the same reason the day rows are (see above). `current_streak` is the
    // one field where max() is arguable rather than merely imprecise — a streak
    // that genuinely broke should come down — but a refresh pull is not
    // evidence that it broke, and the streak engine recomputes it from
    // daily_activity on the next run anyway.
    const localSummary = merge ? await getOrCreateSummary() : null;
    const pick = (incoming, localValue) => (merge ? Math.max(incoming, localValue ?? 0) : incoming);

    const fields = {};
    // On a BOOTSTRAP the snapshot is all there is, so its streak stands until
    // the engine recomputes. On a refresh it is not written at all: it is a
    // DERIVED number, computeStreaks rebuilds it from the day rows on every
    // Dashboard visit, and flooring it at a snapshot's copy is what kept a
    // lapsed streak alive — the number could go up and never come down.
    if (!merge && streaks?.current != null) {
      fields.current_streak = streaks.current;
    }
    if (streaks?.longest != null) {
      fields.longest_streak = pick(streaks.longest, localSummary?.longest_streak);
    }
    if (totals?.daysActive != null) {
      fields.total_days_active = pick(totals.daysActive, localSummary?.total_days_active);
    }

    // ── The four totals that have a live half ──────────────────────────────
    //
    // These are NOT plain summary fields. `getAllTimeTotals` reports each as
    // `summary.total_* + whatever this install has recorded since`, so the
    // number a snapshot carries is already a SUM, and writing it straight back
    // into the summary column makes this device's own sessions get counted a
    // second time on the very next read — and a third on the read after that.
    //
    // On a BOOTSTRAP that is still correct: local was just purged, the live
    // half is zero, and the snapshot is the whole truth. On a REFRESH it is the
    // ratchet that walked a bani count up by one on every pull-to-refresh, so
    // that path solves for the baseline instead. See raiseAllTimeBaseline.
    if (!merge) {
      if (totals?.readingSeconds != null) fields.total_reading_seconds = totals.readingSeconds;
      if (totals?.listeningSeconds != null) {
        fields.total_listening_seconds = totals.listeningSeconds;
      }
      if (totals?.audioSessions != null) fields.total_audio_sessions = totals.audioSessions;
      if (totals?.banisCompleted != null) fields.total_banis_read = totals.banisCompleted;
    }
    // Never moves backwards: a stale snapshot must not drag the last-active date
    // behind a day this device has already recorded, or the streak engine reads
    // the gap as a break.
    if (lastActiveDate) {
      const localLast = merge ? localSummary?.last_active_date : null;
      fields.last_active_date =
        localLast && localLast > lastActiveDate ? localLast : lastActiveDate;
    }
    if (Object.keys(fields).length) await updateSummary(fields);
    // After the day rows above, so the reading/listening floor sees them.
    if (merge && totals) await raiseAllTimeBaseline(totals);
  } catch (err) {
    logError(new Error(`seedAnalyticsFromSnapshot failed: ${err?.message || err}`));
  }
};

// ─── Push: build + POST the snapshot ─────────────────────────────────────────
// Builds the POST /dashboard/cache body from Redux state + analytics. version and
// deviceId are passed in (gathered via react-native-device-info at the call site) so
// this stays unit-testable without native modules.
export const buildCachePayload = async ({ state, version, deviceId, userId = null }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const [summary, monthRows, topRead, topListen, recentRead, recentListen, allTimeTotals] =
    await Promise.all([
      getOrCreateSummary(),
      getDailyActivity(year, month),
      getTopReadBanis(5),
      getTopListenedBanis(5),
      getRecentReadBanis(1),
      getRecentListenedBanis(1),
      // Restore baseline (set once at restore) + live (this install only) — so
      // "all time" survives a reinstall instead of resetting to whatever this
      // install alone has recorded since.
      getAllTimeTotals(),
    ]);

  const days = (monthRows || []).map((r) => [
    Number(String(r.date).slice(8, 10)),
    r.reading_seconds ?? 0,
    r.listening_seconds ?? 0,
  ]);

  let reminderItems = [];
  try {
    const parsed = state.reminderBanis ? JSON.parse(state.reminderBanis) : [];
    reminderItems = parsed.map((it) => ({
      baaniId: it.id,
      time: to24h(it.time),
      enabled: !!it.enabled,
    }));
  } catch (_) {
    reminderItems = [];
  }

  // Keep only the most recent ~60 days of completion history.
  const completed = state.todaysNitnem?.completed || {};
  const trimmedCompleted = {};
  Object.keys(completed)
    .sort()
    .slice(-60)
    .forEach((d) => {
      trimmedCompleted[d] = completed[d];
    });

  // All-time count of days with at least one nitnem completion recorded. (Not
  // "days the full nitnem was completed" — that requires knowing how many
  // banis were selected on each past day, which isn't tracked, so comparing
  // against today's selection count made this silently read 0 for anyone
  // whose selection has changed size over time, even with real completions
  // on record.)
  const nitnemCompletedCount = Object.values(completed).filter(
    (doneIds) => Array.isArray(doneIds) && doneIds.length > 0
  ).length;

  const lastRead = recentRead?.[0];
  const lastListen = recentListen?.[0];

  const payload = {
    lastVisitedBaaniId: state.currentBani?.id ?? null,
    streaks: { current: summary?.current_streak ?? 0, longest: summary?.longest_streak ?? 0 },
    month: { key: monthKey, days },
    read: {
      // [baaniId, sessionCount, totalReadingSeconds]
      top5: (topRead || []).map((r) => [r.bani_id, r.session_count ?? 0, r.total_seconds ?? 0]),
      last: lastRead ? { baaniId: lastRead.bani_id } : null,
    },
    listen: {
      // [baaniId, sessionCount, totalListeningSeconds]
      top5: (topListen || []).map((r) => [r.bani_id, r.session_count ?? 0, r.total_seconds ?? 0]),
      last: lastListen ? { baaniId: lastListen.bani_id } : null,
    },
    totals: {
      banisCompleted: allTimeTotals.banisCompleted,
      readingSeconds: allTimeTotals.readingSeconds,
      listeningSeconds: allTimeTotals.listeningSeconds,
      daysActive: summary?.total_days_active ?? 0,
      audioSessions: allTimeTotals.audioSessions,
    },
    nitnem: {
      // Kept in the payload — it is part of the contract other clients read —
      // but sourced from the Morning Nitnem pothi, which is the one list the
      // app has. See TodaysNitnem.
      selectedBaaniIds: baniItems(defaultPothi(state.pothis, "morning")).map(
        (item) => item.baaniId
      ),
      completed: trimmedCompleted,
      completedCount: nitnemCompletedCount,
    },
    // `modifiedAt` per preference block: the clock of this device's last
    // edit, so another device can adopt only the block that is actually
    // newer than its own instead of guessing from when snapshots were pushed.
    profile: {
      name: state.userProfile?.name ?? "",
      modifiedAt: state.userProfile?.modifiedAt ?? 0,
    },
    reminders: {
      enabled: !!state.isReminders,
      sound: state.reminderSound || "",
      items: reminderItems,
    },
    layout: {
      order: state.dashboardLayout?.order ?? [],
      hidden: state.dashboardLayout?.hidden ?? [],
      modifiedAt: state.dashboardLayout?.modifiedAt ?? 0,
    },
  };

  return { version, capturedAt: now.toISOString(), deviceId, userId, payload };
};

/**
 * A cheap content fingerprint of a snapshot, used to skip pushes that would
 * change nothing.
 *
 * Every backgrounding triggers a push, and most carry a payload identical to
 * the last one — the user opened the app, looked at the Dashboard and left. At
 * 16k users those are the bulk of all writes, and each one costs a full JSONB
 * row rewrite plus the dead tuple behind it.
 *
 * Hashes the PAYLOAD only, never the envelope: `capturedAt` is a fresh
 * timestamp on every build, so including it would make every snapshot unique
 * and the check useless.
 *
 * FNV-1a — not cryptographic, and does not need to be. A collision means one
 * push is skipped; the next real change has a different hash and goes up, and
 * the day's row is overwritten wholesale anyway.
 */
/**
 * True when a snapshot carries no history at all.
 *
 * This is the shape local state has for a few hundred milliseconds after
 * `clearAllAnalyticsData` — i.e. immediately after an account switch, before the
 * restore has written anything back. Pushing during that window overwrites the
 * account's real history with nothing, which is exactly what happened: a
 * mayankmonu snapshot went from 1122 seconds and a 2-day streak to
 * `{"readingSeconds":0,...}` with `month.days: []`.
 *
 * Used as a hard refusal in the push path. The asymmetry is what justifies it —
 * declining to upload an empty snapshot costs a genuinely-empty account nothing
 * (there is nothing to record), while allowing it can destroy years of history.
 */
export const isEmptySnapshot = (payload) => {
  const { totals, month, nitnem, streaks } = payload ?? {};
  const noTotals =
    !totals ||
    ((totals.readingSeconds ?? 0) === 0 &&
      (totals.listeningSeconds ?? 0) === 0 &&
      (totals.banisCompleted ?? 0) === 0 &&
      (totals.daysActive ?? 0) === 0);
  const noDays = !month?.days?.length;
  const noStreak = !streaks || ((streaks.current ?? 0) === 0 && (streaks.longest ?? 0) === 0);
  const noNitnem = !nitnem?.completed || Object.keys(nitnem.completed).length === 0;
  return noTotals && noDays && noStreak && noNitnem;
};

/* eslint-disable no-bitwise -- a hash is arithmetic on bits; that is the point. */
export const hashPayload = (payload) => {
  const json = JSON.stringify(payload ?? null);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i += 1) {
    hash ^= json.charCodeAt(i);
    // × 16777619 in 32-bit space, via shifts so it stays an integer.
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16);
};
/* eslint-enable no-bitwise */

/**
 * Builds this device's per-day activity rows, for POST /dashboard/activity.
 *
 * Sends only days that have CHANGED since the watermark — normally one, today's
 * — rather than the whole month. The endpoint replaces a (day, device) row
 * rather than adding to it, so re-sending a day is harmless and a dropped push
 * self-heals on the next one.
 *
 * The date comes straight out of SQLite, where it has always been the DEVICE'S
 * LOCAL day (see useReadingSession). That is deliberately what the server wants
 * too: bucketing by UTC would file most Indian morning nitnem — Amrit Vela is
 * 21:30–00:30 UTC the day before — under the previous date.
 */
export const buildActivityPayload = async ({ deviceId, since = 0 }) => {
  const rows = await getActivityUpdatedSince(since);
  return {
    deviceId,
    days: (rows || []).map((r) => ({
      date: String(r.date),
      readingSeconds: Math.max(0, Math.round(r.reading_seconds ?? 0)),
      listeningSeconds: Math.max(0, Math.round(r.listening_seconds ?? 0)),
    })),
  };
};

const activityUrl = () =>
  constant.DASHBOARD_ACTIVITY_API_URL ||
  `${constant.DASHBOARD_API_BASE_URL || ""}/dashboard/activity`;

/**
 * POSTs per-day activity. Reports rather than throws, like pushDashboardCache —
 * this rides alongside the snapshot push and must never be able to fail it.
 */
export const pushDailyActivity = async (body) => {
  if (!body?.days?.length) return { ok: true, skipped: true };
  const token = await readToken();
  if (!token) return { ok: false, unauthorized: true, status: 401 };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(activityUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.status === 401) return { ok: false, unauthorized: true, status: 401 };
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    clearTimeout(timeoutId);
  }
};

// POSTs a cache body for the signed-in account. 201 on the day's first sync,
// 200 {updated:true} on a same-day re-sync (last-write-wins).
//
// Returns `{ ok: false, unauthorized: true }` rather than throwing when there is
// no usable session: this runs on every backgrounding, and a lapsed token would
// otherwise log an error each time.
export const pushDashboardCache = async (body) => {
  const token = await readToken();
  if (!token) return { ok: false, unauthorized: true };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(syncUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) return { ok: false, unauthorized: true, status: 401 };
    if (!res.ok) {
      // REPORTED, not thrown. A throw here became a `logError` in the caller —
      // i.e. a Crashlytics entry and a header that said "never synced", with
      // the actual reason nowhere the user or we could see it. The status (and
      // the server's own message, which for a 400 names the offending field)
      // is the whole diagnosis, so it has to survive.
      let message = "";
      try {
        const text = await res.text();
        message = text.slice(0, 200);
      } catch (_) {
        /* body is optional — the status is the part that matters */
      }
      return { ok: false, status: res.status, message };
    }
    return { ok: true, data: await res.json() };
  } finally {
    clearTimeout(timeoutId);
  }
};

export default getDashboardLatest;
