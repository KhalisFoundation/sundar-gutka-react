import { constant } from "@common";
import { authedRequest } from "./khalisRequest";

// The Khalis folders API — khalis-users-api, src/folders.
//
//   GET    /folders?since=<syncedAt>   live folders for the caller, plus the ids
//                                      deleted since `since` and a new watermark
//   PUT    /folders                    merge ONE source, per-folder newest-wins;
//                                      `rejectedFolderIds` names any write that
//                                      lost to a newer copy from another device
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
 * A string's size in UTF-8, as it goes on the wire. `length` counts UTF-16
 * units, and every Gurmukhi character is one unit but three bytes, so a body of
 * Gurmukhi names passed a length check at three times the limit.
 */
export const utf8Bytes = (text) => {
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      // A surrogate pair is one code point, four bytes.
      bytes += 4;
      i += 1;
    } else bytes += 3;
  }
  return bytes;
};

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
  if (utf8Bytes(JSON.stringify(body)) > MAX_PAYLOAD_BYTES) {
    return Promise.resolve({ ok: false, status: 413, error: "payload-too-large" });
  }
  return authedRequest(BASE, { method: "PUT", body });
};

/** Drop a single folder. Idempotent — 204 even when it was already gone. */
export const deleteFolder = (folderId) =>
  authedRequest(`${BASE}/${encodeURIComponent(folderId)}`, { method: "DELETE" });

export default { fetchFolders, putFolders, deleteFolder };
