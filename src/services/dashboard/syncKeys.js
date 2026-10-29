// AsyncStorage keys for dashboard sync state.
//
// Extracted here because three unrelated places need them and none should own
// the literals: useDashboardSync (writes them), dashboardSync (writes the
// restored-top-banis cache) and sso/accountScope (clears all three when the
// signed-in account changes). Keeping them in a plain module — no React, no
// navigation imports — means the purge path can be unit tested without pulling
// a hook's dependency tree in.

// "This device has had its one restore attempt." Gates BOTH the restore and the
// push (see useDashboardSync): a push before restore has settled would overwrite
// real cloud history with a fresh install's near-zero totals.
export const DASHBOARD_RESTORED_KEY = "@dashboard_restored_v1";

// Timestamp of the last successful push, used for the 60s cooldown and for the
// header's "last synced" readout.
export const DASHBOARD_LAST_PUSH_KEY = "@dashboard_last_push";

// Top read/listened banis captured at the last cloud restore, so the Explore
// tiles survive a reinstall (raw session history does not).
export const RESTORED_TOP_BANIS_KEY = "@restored_top_banis_v1";

// When local dashboard data last changed on THIS device.
//
// Stamped by `requestPush` — every call site of it is, by definition, "the user
// just changed something that belongs in the snapshot": finished a bani, ticked
// one off, rearranged the dashboard. It is stamped whether or not a push
// follows, which is the point: while signed out or offline the push cannot go,
// but the change still happened and the device needs to remember when.
//
// Compared against the account's `syncedAt` when a session begins or
// connectivity returns, to decide which side is authoritative. See the
// reconciliation in useDashboardSync.
export const DASHBOARD_LOCAL_MUTATED_AT_KEY = "@dashboard_local_mutated_at_v1";

// Fingerprint of the payload we last pushed successfully.
//
// Most pushes carry a snapshot identical to the previous one — the app was
// opened, looked at, and backgrounded. Comparing against this lets those end
// before the request, which at 16k users is the difference between a write per
// backgrounding and a write per actual change.
export const DASHBOARD_PAYLOAD_HASH_KEY = "@dashboard_payload_hash_v1";

// Watermark for the per-date activity push: SQLite `updated_at` seconds, so the
// next push carries only days that have changed since. Advanced only on
// success, so a failed push simply re-sends the same days.
export const DASHBOARD_ACTIVITY_PUSHED_AT_KEY = "@dashboard_activity_pushed_at_v1";

// The server's `syncedAt` for the snapshot we last APPLIED.
//
// This is the one server-authored timestamp the client already receives and
// used to throw away. Holding on to it is what makes a repeat pull cheap and
// safe: if what the server offers is not newer than what we last applied, there
// is nothing to do and we leave local state completely alone. Without it every
// foreground pull would re-apply the same snapshot over the top of whatever the
// user has done since.
export const DASHBOARD_APPLIED_AT_KEY = "@dashboard_applied_at_v1";

/**
 * What the ACCOUNT has read and listened to TODAY, across every device:
 * `{ date, seconds }`.
 *
 * Today's day row is the one the server never writes — it is still being
 * recorded here and goes up as this device's own — so this is the only way the
 * streak can learn that another phone read today. Held as raw seconds and
 * weighed by the app's own rule (see streakEngine), rather than adopting the
 * server's finished streak: one rule and one authority, so the number cannot
 * flip between two of them.
 */
export const DASHBOARD_ACCOUNT_TODAY_KEY = "@dashboard_account_today_v1";
