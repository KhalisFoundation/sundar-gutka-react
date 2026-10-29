/* eslint-env jest */
/**
 * The header showed "last synced: never" for accounts that plainly had local
 * data, and there was no way to tell which of two opposite situations it meant:
 *
 *   - the push never ran (not signed in, restore gate shut, inside the cooldown)
 *   - the push ran and the server refused it
 *
 * The first is a client bug, the second is a contract or account problem, and
 * "never" alone cannot tell them apart. These tests pin that the reason
 * survives all the way to the label.
 */

let mockDiagnostics = false;
jest.mock("@common", () => ({
  constant: {
    get SYNC_DIAGNOSTICS() {
      return mockDiagnostics;
    },
  },
}));

// eslint-disable-next-line import/first
import { formatSyncLine, formatRelativeSync, SKIP_NOT_RESTORED, SKIP_COOLDOWN } from "./syncStatus";

// Stands in for formatDayMonth, which is language-aware and tested elsewhere.
const dayMonth = () => "19 August";

// Only the keys the formatter reads. Real values, so a missing substitution or
// a stray prefix shows up as wrong TEXT rather than "undefined".
const S = {
  SYNC_NOT_SIGNED_IN: "Your progress isn't saved. Sign in to save it.",
  SYNC_NOT_YET: "Not synced yet",
  SYNC_JUST_NOW: "Synced just now",
  SYNC_FEW_MINUTES: "Synced a few minutes ago",
  SYNC_AN_HOUR: "Synced an hour ago",
  SYNC_FEW_HOURS: "Synced a few hours ago",
  SYNC_A_DAY: "Synced a day ago",
  SYNC_DAY_AGO: "Synced {count} day ago",
  SYNC_DAYS_AGO: "Synced {count} days ago",
  SYNC_A_WEEK: "Synced a week ago",
  SYNC_ON: "Synced {date}",
};

const NOW = Date.parse("2026-08-19T12:00:00.000Z");
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms) => NOW - ms;

const line = (over = {}) =>
  formatSyncLine({
    authStatus: "signedIn",
    now: NOW,
    strings: S,
    formatDayMonth: dayMonth,
    ...over,
  });

// ── Which of the three auth states we are in ───────────────────────────────
describe("formatSyncLine and the auth state", () => {
  beforeEach(() => {
    mockDiagnostics = false;
  });

  it("REGRESSION: says NOTHING while auth is still unknown", () => {
    // `auth` is excluded from redux-persist, so every cold start begins at
    // "unknown" until the Keychain read resolves. Treating that as signed out
    // would flash "your progress isn't saved" at a signed-in person on every
    // single launch.
    expect(line({ authStatus: "unknown", status: {} })).toBeNull();
    expect(line({ authStatus: undefined, status: {} })).toBeNull();
  });

  it("nudges a signed-out user", () => {
    expect(line({ authStatus: "signedOut", status: { push: { at: NOW, ok: true } } })).toBe(
      S.SYNC_NOT_SIGNED_IN
    );
  });

  it("says so plainly when signed in but nothing has synced yet", () => {
    expect(line({ status: {} })).toBe("Not synced yet");
    expect(line({ status: undefined })).toBe("Not synced yet");
  });

  it("carries its own verb, so nothing is prefixed onto it", () => {
    // "Last synced: Synced just now" was the failure mode of prefixing.
    expect(line({ status: { push: { at: NOW, ok: true } } })).toBe("Synced just now");
  });
});

// ── The ladder, boundary by boundary ───────────────────────────────────────
// Every row is a specified edge. The pairs matter more than the middles: an
// off-by-one here is invisible in review and obvious to a user who watches the
// label change at the wrong moment.
describe("formatRelativeSync", () => {
  const rel = (elapsed) => formatRelativeSync(ago(elapsed), NOW, S, dayMonth);

  it.each([
    ["0s", 0, "Synced just now"],
    ["59s — last moment of just now", 59 * SEC, "Synced just now"],
    ["exactly 1 min", MIN, "Synced a few minutes ago"],
    ["29 min", 29 * MIN, "Synced a few minutes ago"],
    ["exactly 30 min", 30 * MIN, "Synced an hour ago"],
    ["59 min", 59 * MIN, "Synced an hour ago"],
    ["exactly 1 hr", HOUR, "Synced a few hours ago"],
    ["2 hr 59 min", 2 * HOUR + 59 * MIN, "Synced a few hours ago"],
    ["exactly 3 hr", 3 * HOUR, "Synced a day ago"],
    ["23 hr 59 min", 23 * HOUR + 59 * MIN, "Synced a day ago"],
    ["exactly 1 day", DAY, "Synced 1 day ago"],
    ["1 day 23 hr — still 1", DAY + 23 * HOUR, "Synced 1 day ago"],
    ["exactly 2 days", 2 * DAY, "Synced 2 days ago"],
    ["3 days", 3 * DAY, "Synced 3 days ago"],
    ["4 days", 4 * DAY, "Synced 4 days ago"],
    ["5 days", 5 * DAY, "Synced 5 days ago"],
    ["5 days 23 hr — still 5", 5 * DAY + 23 * HOUR, "Synced 5 days ago"],
    ["exactly 6 days", 6 * DAY, "Synced a week ago"],
    ["6 days 23 hr", 6 * DAY + 23 * HOUR, "Synced a week ago"],
    ["exactly 7 days", 7 * DAY, "Synced 19 August"],
    ["400 days", 400 * DAY, "Synced 19 August"],
  ])("%s", (_label, elapsed, expected) => {
    expect(rel(elapsed)).toBe(expected);
  });

  it("uses the SINGULAR day string only at exactly one day", () => {
    expect(rel(DAY)).toBe("Synced 1 day ago");
    expect(rel(2 * DAY)).toBe("Synced 2 days ago");
  });

  it("CLAMPS a future timestamp instead of counting backwards", () => {
    // `at` is the device's own clock from when the push landed, so a timezone
    // change or an NTP correction can put it ahead of now.
    expect(formatRelativeSync(NOW + 5 * MIN, NOW, S, dayMonth)).toBe("Synced just now");
    expect(formatRelativeSync(NOW + 400 * DAY, NOW, S, dayMonth)).toBe("Synced just now");
  });

  it("leaves no placeholder unsubstituted, anywhere on the ladder", () => {
    [0, MIN, 30 * MIN, HOUR, 3 * HOUR, DAY, 2 * DAY, 5 * DAY, 6 * DAY, 7 * DAY].forEach((d) => {
      const out = rel(d);
      expect(out).not.toContain("{count}");
      expect(out).not.toContain("{date}");
    });
  });
});

// ── Release behaviour: never developer text ───────────────────────────────
// "Synced just now (HTTP 500)" is the right thing to show a developer and the
// wrong thing to show someone reading their nitnem — it reads as the app being
// broken even when the cause is server-side and already fixed.
const lineFor = (status) => line({ status });

describe("the diagnostic tail in a release build", () => {
  beforeEach(() => {
    mockDiagnostics = false;
  });

  it("shows the plain line once a push has succeeded", () => {
    expect(lineFor({ push: { at: ago(2 * MIN), ok: true } })).toBe("Synced a few minutes ago");
  });

  it("hides an HTTP failure behind the flag", () => {
    expect(lineFor({ attempt: { at: NOW, ok: false, status: 500 } })).toBe("Not synced yet");
  });

  it("hides a skip reason behind the flag", () => {
    expect(lineFor({ attempt: { at: NOW, skipped: SKIP_NOT_RESTORED } })).toBe("Not synced yet");
  });

  it("hides a failing pull behind the flag", () => {
    expect(lineFor({ push: { at: ago(2 * MIN), ok: true }, pull: { status: "failed" } })).toBe(
      "Synced a few minutes ago"
    );
  });
});

describe("the diagnostic tail with diagnostics on", () => {
  beforeEach(() => {
    mockDiagnostics = true;
  });

  it("keeps the last SUCCESS as the timestamp, not the last attempt", () => {
    // Holding one field meant a cooldown skip — the overwhelmingly common
    // outcome, since every backgrounding tries again — erased the record of a
    // push that had genuinely succeeded minutes earlier, and the header then
    // reported a failure that never happened.
    const afterCooldown = {
      push: { at: ago(2 * MIN), ok: true },
      attempt: { at: NOW, skipped: SKIP_COOLDOWN },
    };
    expect(lineFor(afterCooldown)).toBe("Synced a few minutes ago");
  });

  it("appends the reason when a real attempt failed after a good one", () => {
    const brokeAfterWorking = {
      push: { at: ago(2 * MIN), ok: true },
      attempt: { at: NOW, ok: false, status: 500 },
    };
    expect(lineFor(brokeAfterWorking)).toBe("Synced a few minutes ago (HTTP 500)");
  });

  it("names a skip that is NOT benign", () => {
    expect(lineFor({ attempt: { at: NOW, skipped: SKIP_NOT_RESTORED } })).toBe(
      `Not synced yet (${SKIP_NOT_RESTORED})`
    );
  });

  it("stays quiet about a cooldown — that is a healthy outcome", () => {
    expect(lineFor({ attempt: { at: NOW, skipped: SKIP_COOLDOWN } })).toBe("Not synced yet");
  });

  it("reports a transport error by message", () => {
    expect(lineFor({ attempt: { at: NOW, ok: false, error: "Network request failed" } })).toBe(
      "Not synced yet (Network request failed)"
    );
  });

  it("appends a pull that did not simply succeed", () => {
    const good = { push: { at: ago(2 * MIN), ok: true } };
    expect(lineFor({ ...good, pull: { status: "failed" } })).toBe(
      "Synced a few minutes ago · pull failed"
    );
  });

  it("says nothing about a pull that worked", () => {
    expect(lineFor({ push: { at: ago(2 * MIN), ok: true }, pull: { status: "ok" } })).toBe(
      "Synced a few minutes ago"
    );
  });

  it("never leaks diagnostics into the signed-out nudge", () => {
    expect(
      line({ authStatus: "signedOut", status: { attempt: { at: NOW, ok: false, status: 500 } } })
    ).toBe(S.SYNC_NOT_SIGNED_IN);
  });
});
