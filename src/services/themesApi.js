import { constant, logNetworkError } from "@common";

// GET /themes — khalis-users-api, src/themes. Public, no auth. Returns
// { version, themes: [{ id, position, enabled, names, record, updatedAt }] };
// an empty list when the table is empty or the DB is down, which leaves every
// device on its bundled set.

const FETCH_TIMEOUT_MS = 8000;

/**
 * @returns {Promise<{ ok: true, version: number, themes: object[] } | { ok: false }>}
 */
export const fetchRemoteThemes = async () => {
  const url = constant.THEMES_API_URL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    if (!url) throw new Error("THEMES_API_URL not set");
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return {
      ok: true,
      version: Number(body?.version) || 0,
      themes: Array.isArray(body?.themes) ? body.themes : [],
    };
  } catch (err) {
    // A connection failure is a breadcrumb; the device simply keeps the
    // themes it has, remote or bundled.
    logNetworkError(`fetchRemoteThemes failed: ${err?.message || err}`, err);
    return { ok: false };
  } finally {
    clearTimeout(timeoutId);
  }
};

export default fetchRemoteThemes;
