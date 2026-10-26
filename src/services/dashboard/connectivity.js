import { constant } from "@common";

// Lightweight reachability check, mirrors BottomNavigation's checkInternetConnection.
// Used by dashboard network services so they can surface an offline state.
export const isOnline = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(constant.INTERNET_CHECK_URL, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    // generate_204 returns 204 only on real internet; a captive portal returns
    // 200 (login redirect), which we treat as offline.
    return response?.status === 204;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Thrown by services when there is no connectivity, so consumers can render
// the shared OfflineNotice instead of a generic error.
export class OfflineError extends Error {
  constructor(message = "offline") {
    super(message);
    this.name = "OfflineError";
    this.offline = true;
  }
}

export default isOnline;
