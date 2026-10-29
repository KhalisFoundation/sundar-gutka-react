import { constant } from "@common";
import { authedRequest } from "./khalisRequest";

// The Khalis folders API — khalis-users-api, src/folders.
//
//   GET    /folders?since=<syncedAt>   live folders for the caller, plus the ids
//                                      deleted since `since` and a new watermark
//   PUT    /folders                    merge ONE source, per-folder newest-wins;
//                                      `rejectedFolderIds` names any write that
//                                      lost to a newer copy from another device
//   DELETE /folders?source=…           drop a whole source
//   DELETE /folders/:folderId          drop one folder, idempotent
//
// Every authed call needs the SSO bearer token.
//
// The API also exposes /public/folders/:ownerId/:folderId (+ /save) for shared
// pothis. Deliberately not wired: sharing is not a shipped feature yet, and an
// unused client for it would be dead code that drifts from the contract.

const BASE = `${constant.DASHBOARD_API_BASE_URL}/folders`;

/** The API rejects a body over 256 KB outright, so it is checked before sending. */
export const MAX_PAYLOAD_BYTES = 256 * 1024;

/**
 * Every folder the signed-in user has, across sources. With `since` — the
 * `syncedAt` of the previous answer — the response also carries
 * `deletedFolderIds`. 404 means "none yet".
 */
export const fetchFolders = async (since = 0) => {
  const url = since ? `${BASE}?since=${encodeURIComponent(since)}` : BASE;
  const result = await authedRequest(url);
  if (result.status === 404) {
    return { ok: true, status: 404, data: { folders: [], deletedFolderIds: [], syncedAt: 0 } };
  }
  return result;
};

/**
 * Merge one source's folders, per folder newest-wins.
 *
 * @param {{source: string, folders: object[]}} body from `toUpsertBody(state)`.
 */
export const putFolders = (body) => {
  if (JSON.stringify(body).length > MAX_PAYLOAD_BYTES) {
    return Promise.resolve({ ok: false, status: 413, error: "payload-too-large" });
  }
  return authedRequest(BASE, { method: "PUT", body });
};

/** Drop a single folder. Idempotent — 204 even when it was already gone. */
export const deleteFolder = (folderId) =>
  authedRequest(`${BASE}/${encodeURIComponent(folderId)}`, { method: "DELETE" });

/** Drop every folder of one source. */
export const deleteSource = (source) =>
  authedRequest(`${BASE}?source=${encodeURIComponent(source)}`, { method: "DELETE" });

export default { fetchFolders, putFolders, deleteFolder, deleteSource };
