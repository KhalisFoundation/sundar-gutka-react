import { readToken } from "@common/sso/tokenStore";
import { isNetworkFailure, logError, logMessage } from "@common";

// One authenticated request to the Khalis users API, with a timeout and a
// typed failure. Shared by every account-data client (folders, reminders) so
// they classify outcomes identically — the sync layer decides what to do from
// `status`, and it can only do that if every client reports the same way.
//
// Nothing here throws into a render path: callers get `{ ok, status, data,
// error }` and decide. An offline device keeps working on local state instead
// of showing an error it cannot act on.

const TIMEOUT_MS = 15000;

/** Statuses that mean "try again later" rather than "the request was wrong". */
export const isTransientStatus = (status) => status === 0 || status === 429 || status >= 500;

export const request = async (url, { method = "GET", body, token } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        ...(payload ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: payload,
    });
    if (response.status === 204) return { ok: true, status: 204, data: null };
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = null;
    }
    if (!response.ok) {
      return { ok: false, status: response.status, data, error: data?.message ?? "request-failed" };
    }
    return { ok: true, status: response.status, data };
  } catch (error) {
    // An abort is a timeout or a dropped connection; neither is a bug worth a
    // crash report, so it is logged as a message and reported as offline.
    if (error?.name === "AbortError") {
      logMessage(`khalisRequest: ${method} ${url} timed out`);
      return { ok: false, status: 0, error: "timeout" };
    }
    if (isNetworkFailure(error)) {
      logMessage(`khalisRequest: ${method} ${url} offline`);
      return { ok: false, status: 0, error: "network" };
    }
    logError(error);
    return { ok: false, status: 0, error: "network" };
  } finally {
    clearTimeout(timer);
  }
};

/** The same, with the SSO bearer token; `401 signed-out` when there is none. */
export const authedRequest = async (url, options = {}) => {
  const token = await readToken();
  if (!token) return { ok: false, status: 401, error: "signed-out" };
  return request(url, { ...options, token });
};
