/* eslint-env jest */
/**
 * Signing out has to reset BOTH halves of the dashboard, and they live in
 * different places.
 *
 * The reported bug: after signing out, the layout and reminders reset but the
 * streak and the completed-banis count stayed on screen. The cause was that
 * `signOut` reset only redux. The numbers do not come from redux — they come
 * from SQLite, and the app was still reading the signed-in account's own
 * database file because nothing had pointed it back at the signed-out store.
 *
 * The two calls are easy to separate again, and missing either one leaves half
 * a session on screen with no error anywhere, so this pins both.
 *
 * A source-level guard rather than a render test: what is being protected is
 * that two specific calls exist on one code path — a fact about the file, not
 * about any particular render.
 */
import fs from "fs";
import path from "path";

const read = (file) => fs.readFileSync(path.join(__dirname, file), "utf8");

describe("signing out resets the whole dashboard", () => {
  const source = () => read("useSsoActions.js").replace(/\r\n/g, "\n");

  /** The body of the sign-out confirmation handler. */
  const signOutBody = () => {
    const src = source();
    const start = src.indexOf("const signOut = useCallback(");
    expect(start).toBeGreaterThan(-1);
    return src.slice(start);
  };

  it("points SQLite back at the signed-out store", () => {
    // Without this the streak, the calendar and the completed count keep
    // reading the account's own database file after sign-out.
    expect(signOutBody()).toContain("switchAnalyticsAccount(null)");
  });

  it("resets the redux preferences", () => {
    // Layout, reminders, nitnem, bookmarks.
    expect(signOutBody()).toContain("purgeLocalUserData(dispatch)");
  });

  it("forgets which account the device belonged to", () => {
    expect(signOutBody()).toContain("writeLastAccount(null)");
  });

  it("switches the database BEFORE resetting preferences", () => {
    // Otherwise a frame can render signed-out preferences over the previous
    // account's numbers.
    const body = signOutBody();
    expect(body.indexOf("switchAnalyticsAccount(null)")).toBeLessThan(
      body.indexOf("purgeLocalUserData(dispatch)")
    );
  });

  it("does NOT delete the account's history on the way out", () => {
    // Sign-out detaches; it does not destroy. Deleting here is what let a
    // device holding a few minutes of reading push over a real account.
    expect(source()).not.toContain("clearAllAnalyticsData");
  });

  // Token EXPIRY ends a session too, and the two halves are scoped differently:
  // the DATABASE detaches, the PREFERENCES do not.
  //
  // This used to assert that expiry touched neither, on the grounds that
  // resetting would cost a user their own dashboard for not opening the app for
  // a week. That reasoning still holds for the preferences and does not hold for
  // the database, because leaving the account's file open is not a way of
  // keeping their data — it is what let the next sign-in claim it.
  describe("a token expiry", () => {
    const endSessionBody = () => {
      const session = read("useSsoSession.js").replace(/\r\n/g, "\n");
      return session.slice(
        session.indexOf("const endSession = useCallback("),
        session.indexOf("const beginSession = useCallback(")
      );
    };

    it("detaches the database, so signed out means the same thing either way", () => {
      // Load-bearing, not tidiness. `switchAnalyticsAccount` carries the OPEN
      // store's rows into whoever signs in next, so a session that ends without
      // detaching lets the next sign-in read the previous account's history as
      // though it were unclaimed — doubling it on a re-login by the same person,
      // copying it wholesale into anyone else's account.
      expect(endSessionBody()).toContain("switchAnalyticsAccount(null)");
    });

    it("does NOT reset preferences — an expiry is not the user's decision", () => {
      // purgeLocalUserData cancels every reminder and resets the layout.
      expect(endSessionBody()).not.toContain("purgeLocalUserData");
    });

    it("does NOT forget which account the device belongs to", () => {
      // Clearing it would make a later sign-in by SOMEONE ELSE look like a first
      // sign-in, which skips the purge and hands them the previous user's
      // layout and reminders.
      expect(endSessionBody()).not.toContain("writeLastAccount");
    });
  });
});
