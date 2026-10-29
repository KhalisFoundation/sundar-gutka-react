import { constant } from "@common";
import { authedRequest } from "./khalisRequest";

// The Khalis reminders API — khalis-users-api, src/reminders.
//
//   GET    /reminders                live reminders + settings + watermark
//   PUT    /reminders/:baniId        one reminder; 409 when baseUpdatedAt is stale
//   DELETE /reminders/:baniId        tombstone; idempotent
//   PUT    /reminders/settings       on/off + sound; 409 when baseUpdatedAt is stale
//   POST   /reminders/sync           bulk two-way merge
//
// A 409 is not an error to this app: it is the server saying another device
// changed the same reminder first, and the answer is a bulk sync.

const BASE = `${constant.DASHBOARD_API_BASE_URL}/reminders`;

export const fetchReminders = () => authedRequest(BASE);

export const putReminder = (baniId, body) =>
  authedRequest(`${BASE}/${encodeURIComponent(baniId)}`, { method: "PUT", body });

export const deleteReminder = (baniId) =>
  authedRequest(`${BASE}/${encodeURIComponent(baniId)}`, { method: "DELETE" });

export const putReminderSettings = (body) =>
  authedRequest(`${BASE}/settings`, { method: "PUT", body });

export const syncReminders = (body) => authedRequest(`${BASE}/sync`, { method: "POST", body });

export default { fetchReminders, putReminder, deleteReminder, putReminderSettings, syncReminders };
