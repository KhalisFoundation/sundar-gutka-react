/* eslint-disable no-bitwise -- base64 and UTF-8 decoding are defined in terms
   of bit shifts and masks; expressing them any other way would be slower and
   far harder to check against the spec. Scoped to this file only. */

// JWT helpers for the Khalis SSO session token.
//
// The token is only ever *read* here, never verified — the signature is the
// server's business (the Khalis backend re-verifies every token against the SSO
// on each request). All we need locally is the claims and the expiry, so the
// app can restore a session offline without a network round trip.
//
// Hand-rolled base64url decoding: React Native 0.78 / Hermes ships no `atob`,
// no `Buffer` and no `TextDecoder`. `decodeURIComponent(escape(s))` is Annex B
// and not guaranteed either, and Gurmukhi/accented names in `firstname` are
// real input — so the UTF-8 decode below is a correctness requirement, not a
// nicety.

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// base64 (already normalised from base64url) -> array of bytes.
const base64ToBytes = (input) => {
  const clean = input.replace(/=+$/, "");
  const bytes = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const value = B64_ALPHABET.indexOf(clean[i]);
    if (value === -1) throw new Error("Invalid base64 character");
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
};

// UTF-8 bytes -> JS string, emitting surrogate pairs for astral code points.
const bytesToUtf8 = (bytes) => {
  let out = "";
  let i = 0;

  while (i < bytes.length) {
    const b0 = bytes[i];
    let codePoint;
    let size;

    if (b0 < 0x80) {
      codePoint = b0;
      size = 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      codePoint = b0 & 0x1f;
      size = 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      codePoint = b0 & 0x0f;
      size = 3;
    } else if ((b0 & 0xf8) === 0xf0) {
      codePoint = b0 & 0x07;
      size = 4;
    } else {
      throw new Error("Invalid UTF-8 lead byte");
    }

    if (i + size > bytes.length) throw new Error("Truncated UTF-8 sequence");
    for (let k = 1; k < size; k += 1) {
      const bk = bytes[i + k];
      if ((bk & 0xc0) !== 0x80) throw new Error("Invalid UTF-8 continuation byte");
      codePoint = (codePoint << 6) | (bk & 0x3f);
    }
    i += size;

    if (codePoint > 0xffff) {
      const adjusted = codePoint - 0x10000;
      out += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
    } else {
      out += String.fromCharCode(codePoint);
    }
  }
  return out;
};

export const base64UrlDecode = (segment) => {
  const normalised = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);

  // Prefer a platform atob when one exists (some Hermes builds / polyfills add
  // it), but never depend on it — RN 0.78 core does not define it.
  if (typeof global.atob === "function") {
    const binary = global.atob(padded);
    const bytes = [];
    for (let i = 0; i < binary.length; i += 1) bytes.push(binary.charCodeAt(i) & 0xff);
    return bytesToUtf8(bytes);
  }
  return bytesToUtf8(base64ToBytes(padded));
};

/**
 * Decode a JWT's payload. Returns null for anything malformed rather than
 * throwing — this runs on the app-launch path, where a bad stored token must
 * degrade to "signed out", never crash the app.
 */
export const decodeJwtPayload = (token) => {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(parts[1]));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
};

/** Expiry in epoch milliseconds, or null when the token carries no usable exp. */
export const getTokenExpiryMs = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
};

/**
 * A token is usable when it decodes, carries the claims the app and the SSO
 * logout endpoint need, and has not expired. `skewMs` treats a token that is
 * about to expire as already expired, so we don't start a session that dies
 * seconds later.
 */
export const isTokenValid = (token, skewMs = 60000) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // nameID / nameIDFormat are what /logout/all needs to end the IdP session;
  // without them the user could sign in but never properly sign out.
  if (!payload.email || !payload.nameID || !payload.nameIDFormat) return false;
  if (typeof payload.exp !== "number") return false;
  return payload.exp * 1000 - skewMs > Date.now();
};

/** The subset of claims the app stores in Redux and renders. */
export const toSessionUser = (payload) => {
  if (!payload) return null;
  return {
    firstname: payload.firstname ?? "",
    lastname: payload.lastname ?? "",
    email: payload.email ?? "",
    nameID: payload.nameID ?? "",
    nameIDFormat: payload.nameIDFormat ?? "",
  };
};
