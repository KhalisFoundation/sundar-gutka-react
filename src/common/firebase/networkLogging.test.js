/* eslint-env jest */
import fs from "fs";
import path from "path";

// The guard that would have caught the miss.
//
// The offline-error noise was "fixed" once, in the Database Update SCREEN, while
// the home screen's own copy of the same check kept filing
// "useDatabaseUpdateCheck Network request failed" on every launch without a
// connection — and a dozen other fetch-and-fall-back paths had never been
// looked at at all. Fixing them one Crashlytics issue at a time is how that
// happens twice.
//
// So the rule is mechanical: a module that FETCHES must not report a failure
// with `logError`. It uses `logNetworkError`, which downgrades a connection
// problem to a breadcrumb and records everything else exactly as before.
//
// EXEMPT lists the places where a `logError` beside a fetch is reporting
// something that is not the request failing. Each one needs a reason.

const SRC = path.join(__dirname, "..", "..");

const EXEMPT = {
  // The "bundled gurpurab dates have expired" warning. It fires from a purely
  // local computation and is a real maintenance task for us, not a user's
  // connection.
  "services/dashboard/upcomingEvents.js": true,
  // Writes the server's activity into SQLite. The fetch happened upstream; a
  // failure here is a database fault.
  "services/dashboard/dashboardSync.js": true,
  // Wraps the in-app browser for the SSO redirect, not an HTTP request.
  "common/sso/khalisSso.js": true,
  // The final `logError` is the non-network branch of its own guard.
  "services/khalisRequest.js": true,
  "DatabaseUpdate/updateCheck.js": true,
  // Same shape: it checks `isNetworkFailure` first and logs a message for an
  // unreachable IdP, so its `logError` only ever sees a genuine fault — an HTTP
  // 500 from the delete endpoint, or an exception that is not the connection.
  "common/sso/deleteAccount.js": true,
  // Anything reaching its catch is AsyncStorage, not the check itself.
  "HomeScreen/hooks/useDatabaseUpdateCheck.js": true,
  // Filesystem, not network — it only imports fetch-shaped helpers.
  "common/rnfs.js": true,
  // Defines both functions.
  "common/firebase/crashlytics.js": true,
};

const walk = (dir, out = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  });
  return out;
};

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const rel = (file) => path.relative(SRC, file).split(path.sep).join("/");

const offenders = walk(SRC)
  .map((file) => ({ file, code: stripComments(fs.readFileSync(file, "utf8")) }))
  .filter(({ code }) => /\bfetch\s*\(/.test(code))
  .filter(({ code }) => /\blogError\s*\(/.test(code))
  .map(({ file }) => rel(file))
  .filter((name) => !EXEMPT[name]);

it("never reports a failed request as a Crashlytics error", () => {
  expect(offenders).toEqual([]);
});

// The two that were actually in the crash report, named so a move or a rename
// cannot quietly drop them out of the scan above.
describe.each([
  "services/sevaConfig.js",
  "services/dashboard/dailyVaak.js",
  "services/dashboard/wordOfDay.js",
  "services/dashboard/randomShabad.js",
  "services/dashboard/nanakshahiDate.js",
  "services/sevaMeans.js",
])("%s", (name) => {
  const code = stripComments(fs.readFileSync(path.join(SRC, name), "utf8"));

  it("reports through logNetworkError", () => {
    expect(code).toMatch(/\blogNetworkError\s*\(/);
    expect(code).not.toMatch(/\blogError\s*\(/);
  });

  // The predicate reads the RAW cause. Passing only the composed sentence would
  // silently never match, and the noise would be back with the tests still green.
  it("hands it the raw cause, not just the message", () => {
    const calls = code.match(/logNetworkError\([\s\S]*?\);/g) || [];
    expect(calls.length).toBeGreaterThan(0);
    calls.forEach((call) => expect(call).toMatch(/,\s*[A-Za-z_$][\w$]*\s*\)/));
  });
});

// It was written out by hand three times — here, in updateCheck.js and in
// khalisRequest.js — and only two of them agreed on which failures counted.
// Comments are stripped so a note quoting the crash string is not mistaken for
// a fourth copy of the rule.
it("keeps one definition of what a network failure is", () => {
  const copies = walk(SRC)
    .map((file) => ({ file, code: stripComments(fs.readFileSync(file, "utf8")) }))
    .filter(({ code }) => /network request failed/i.test(code))
    .map(({ file }) => rel(file))
    .filter((name) => name !== "common/networkFailure.js");

  expect(copies).toEqual([]);
});
