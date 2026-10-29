import { constant } from "@common";
import { authedRequest } from "./khalisRequest";

// The Khalis settings API — khalis-users-api, src/user-settings.
//
//   GET  /settings            every setting the account holds + watermark
//   PUT  /settings/:key       one setting; 409 when baseUpdatedAt is stale
//   POST /settings/sync       bulk two-way merge, per key
//
// A 409 is not an error to this app: it is the server saying another device
// changed the same setting first, and the answer is a bulk sync.

const BASE = `${constant.DASHBOARD_API_BASE_URL}/settings`;

export const fetchSettings = () => authedRequest(BASE);

export const putSetting = (key, body) =>
  authedRequest(`${BASE}/${encodeURIComponent(key)}`, { method: "PUT", body });

export const syncSettings = (body) => authedRequest(`${BASE}/sync`, { method: "POST", body });

export default { fetchSettings, putSetting, syncSettings };
