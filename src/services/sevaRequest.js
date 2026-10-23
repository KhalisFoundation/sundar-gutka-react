// Request helpers shared by the Seva services (sevaConfig, sevaMeans).

const SUPPORTED_LANGS = ["en", "hi", "pa", "fr", "it", "es"];

/** Maps the app's language state (e.g. "DEFAULT", "en-US", "pa") to an API lang. */
export const langToApi = (lang) => {
  const l = String(lang || "")
    .trim()
    .toLowerCase();
  if (!l || l === "default") return "en";
  const primary = l.split(/[-_]/)[0];
  return SUPPORTED_LANGS.includes(primary) ? primary : "en";
};

/** GET a JSON body, aborted after `timeoutMs`. */
export const fetchJson = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
};
