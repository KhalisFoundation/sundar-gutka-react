import {
  base64UrlDecode,
  decodeJwtPayload,
  getTokenExpiryMs,
  isTokenValid,
  toSessionUser,
} from "./jwt";

// Build a JWT-shaped string from a payload object. Signature is irrelevant —
// nothing client-side verifies it.
const makeToken = (payload) => {
  const b64url = (obj) =>
    Buffer.from(JSON.stringify(obj), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.signature`;
};

const futureExp = () => Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

const validPayload = (overrides = {}) => ({
  firstname: "Test",
  lastname: "User",
  email: "test@khalis.net",
  nameID: "test@khalis.net",
  nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  iat: Math.floor(Date.now() / 1000),
  exp: futureExp(),
  ...overrides,
});

describe("base64UrlDecode", () => {
  it("decodes plain ASCII", () => {
    expect(base64UrlDecode("aGVsbG8")).toBe("hello");
  });

  // The reason this decoder is hand-rolled rather than using atob: real names
  // from the IdP are multi-byte.
  it("decodes multi-byte UTF-8 (Gurmukhi)", () => {
    const text = "ਸਿਮਰਨ";
    const encoded = Buffer.from(text, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(base64UrlDecode(encoded)).toBe(text);
  });

  it("decodes accented Latin and emoji (2-, 3- and 4-byte sequences)", () => {
    const text = "José ☬ 😀";
    const encoded = Buffer.from(text, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(base64UrlDecode(encoded)).toBe(text);
  });

  // "ਵਾਹਿਗੁਰੂ" is a happy accident worth keeping: its base64 contains both a
  // "+" and a "/", so it exercises BOTH base64url substitutions while staying
  // realistic input for this app.
  it("handles base64url's - and _ substitutions", () => {
    const text = "ਵਾਹਿਗੁਰੂ";
    const standard = Buffer.from(text, "utf8").toString("base64");
    expect(standard).toMatch(/\+/);
    expect(standard).toMatch(/\//);

    const encoded = standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(base64UrlDecode(encoded)).toBe(text);
  });

  it("rejects bytes that are not valid UTF-8", () => {
    // 0xFB is not a legal UTF-8 lead byte; decodeJwtPayload turns this into a
    // null rather than letting it escape as a throw.
    const encoded = Buffer.from([0xfb, 0xff, 0xbf]).toString("base64").replace(/=+$/, "");
    expect(() => base64UrlDecode(encoded)).toThrow();
  });
});

describe("decodeJwtPayload", () => {
  it("returns the payload for a well-formed token", () => {
    const payload = validPayload();
    expect(decodeJwtPayload(makeToken(payload))).toMatchObject({
      email: "test@khalis.net",
      nameID: "test@khalis.net",
    });
  });

  it("preserves Gurmukhi names", () => {
    const token = makeToken(validPayload({ firstname: "ਸਿਮਰਨ", lastname: "ਕੌਰ" }));
    expect(decodeJwtPayload(token)).toMatchObject({ firstname: "ਸਿਮਰਨ", lastname: "ਕੌਰ" });
  });

  // Must never throw: this runs on the app-launch path.
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a number", 12345],
    ["an empty string", ""],
    ["a non-JWT string", "not-a-jwt"],
    ["too few segments", "aaa.bbb"],
    ["an empty payload segment", "aaa..ccc"],
    ["a non-base64 payload", "aaa.!!!!.ccc"],
    ["a payload that is not JSON", "aaa.aGVsbG8.ccc"],
  ])("returns null for %s", (_label, input) => {
    expect(decodeJwtPayload(input)).toBeNull();
  });
});

describe("getTokenExpiryMs", () => {
  it("converts exp seconds to milliseconds", () => {
    const exp = futureExp();
    expect(getTokenExpiryMs(makeToken(validPayload({ exp })))).toBe(exp * 1000);
  });

  it("returns null when exp is absent or not a number", () => {
    expect(getTokenExpiryMs(makeToken({ email: "a@b.c" }))).toBeNull();
    expect(getTokenExpiryMs(makeToken(validPayload({ exp: "soon" })))).toBeNull();
    expect(getTokenExpiryMs("garbage")).toBeNull();
  });
});

describe("isTokenValid", () => {
  it("accepts a complete, unexpired token", () => {
    expect(isTokenValid(makeToken(validPayload()))).toBe(true);
  });

  it("rejects an expired token", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    expect(isTokenValid(makeToken(validPayload({ exp })))).toBe(false);
  });

  // Guards against starting a session that dies seconds later.
  it("rejects a token expiring inside the skew window", () => {
    const exp = Math.floor(Date.now() / 1000) + 10;
    expect(isTokenValid(makeToken(validPayload({ exp })), 60000)).toBe(false);
    expect(isTokenValid(makeToken(validPayload({ exp })), 0)).toBe(true);
  });

  // Without nameID/nameIDFormat the user could sign in but never sign out,
  // because /logout/all needs them to build the SAML LogoutRequest.
  it.each(["email", "nameID", "nameIDFormat"])("rejects a token missing %s", (claim) => {
    expect(isTokenValid(makeToken(validPayload({ [claim]: undefined })))).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isTokenValid("nonsense")).toBe(false);
    expect(isTokenValid(null)).toBe(false);
  });
});

describe("toSessionUser", () => {
  it("picks out only the claims the app stores", () => {
    const payload = validPayload({ extra: "should not survive" });
    expect(toSessionUser(payload)).toEqual({
      firstname: "Test",
      lastname: "User",
      email: "test@khalis.net",
      nameID: "test@khalis.net",
      nameIDFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    });
  });

  it("defaults missing claims to empty strings", () => {
    expect(toSessionUser({})).toEqual({
      firstname: "",
      lastname: "",
      email: "",
      nameID: "",
      nameIDFormat: "",
    });
  });

  it("returns null for a null payload", () => {
    expect(toSessionUser(null)).toBeNull();
  });
});
