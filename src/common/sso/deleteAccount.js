// Account deletion, against the IdP rather than the Service Provider.
//
// The SP owns SESSIONS — it issues the JWT and ends it. Only WordPress owns the
// ACCOUNT, so this is the one call in the app that goes to SSO_IDP_URL. It is
// authorised with the SP's own JWT, the same one the app already holds: the IdP
// verifies it by calling the SP's /user, so there is no second credential to
// obtain or store.
//
// `?confirm=true` is the IdP's own guard against an accidental DELETE. The
// user-facing confirmation is separate and lives in useSsoActions.
//
// Deletion is SCHEDULED, not immediate: the account is disabled at once and
// purged after a 30-day grace period, which is what the confirmation copy
// promises and why 409 ("already scheduled") is a success rather than an error.

import { isNetworkFailure, logError, logMessage } from "@common";
import constant from "../constant";
import { readToken } from "./tokenStore";

/** Matches the SP calls in services/khalisRequest — long enough for a cold IdP. */
const TIMEOUT_MS = 15000;

export const deleteAccountUrl = () =>
  `${constant.SSO_IDP_URL}/wp-json/khalis/v1/account?confirm=true`;

/**
 * Ask the IdP to delete the signed-in account.
 *
 * Returns a REASON rather than throwing, so every caller handles the same
 * closed set and none of them has to guess what an exception meant:
 *
 *   { ok: true,  reason: "deleted"   }  200 — scheduled now
 *   { ok: true,  reason: "already"   }  409 — a previous request already did it
 *   { ok: false, reason: "session"   }  401 — token rejected; sign the user out
 *   { ok: false, reason: "offline"   }  no connection; KEEP local state
 *   { ok: false, reason: "server"    }  5xx or anything else; KEEP local state
 *
 * The two `ok` cases are the ones that may clear local data. Everything else
 * must leave it alone — wiping a device for a request that never landed would
 * destroy the user's history while their account carried on existing.
 */
export const requestAccountDeletion = async () => {
  const token = await readToken();
  // Not an error: there is no session to delete, so there is nothing to report
  // and nothing to retry.
  if (!token) return { ok: false, reason: "session" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(deleteAccountUrl(), {
      method: "DELETE",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 200) return { ok: true, reason: "deleted" };
    // The account is already on its way out. Reporting a failure here would
    // strand the user on a device still holding data for an account that no
    // longer exists, with no way to try again.
    if (res.status === 409) return { ok: true, reason: "already" };
    if (res.status === 401) return { ok: false, reason: "session" };

    logError(new Error(`SSO deleteAccount failed: HTTP ${res.status}`));
    return { ok: false, reason: "server", httpStatus: res.status };
  } catch (err) {
    // An abort is this app's own timeout, not a fault worth a crash report.
    if (err?.name === "AbortError" || isNetworkFailure(err)) {
      logMessage(`SSO deleteAccount unreachable: ${err?.message || err}`);
      return { ok: false, reason: "offline" };
    }
    logError(new Error(`SSO deleteAccount failed: ${err?.message || err}`));
    return { ok: false, reason: "server" };
  } finally {
    clearTimeout(timer);
  }
};

export default requestAccountDeletion;
