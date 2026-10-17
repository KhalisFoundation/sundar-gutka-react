import constant from "@common/constant";

// The placeholder the base URL falls back to when nothing is configured.
export const SCORING_URL_PLACEHOLDER = "https://SET-ME.example";

export const resolveBaseUrl = (url) => (url || SCORING_URL_PLACEHOLDER).replace(/\/+$/, "");

export const SCORING_BASE_URL = resolveBaseUrl(constant.KIDS_SCORING_URL);

// An unset URL fails exactly like an unreachable server; distinguishing it keeps people
// from debugging the service when the setting was simply never filled in.
export const isConfigured = (baseUrl) => baseUrl !== SCORING_URL_PLACEHOLDER;
export const SCORING_CONFIGURED = isConfigured(SCORING_BASE_URL);

export const SCORING_API_KEY = constant.KIDS_SCORING_API_KEY || "";

// The service takes 3-10 s; this leaves room for a cold start before the one retry.
export const REQUEST_TIMEOUT_MS = 45000;
