import fs from "fs";
import path from "path";

// A pothi mutation is never refused for want of an account or a connection.
//
// My Pothi is local-first: an edit lands in redux, redux-persist keeps it, and
// the outbox carries it to the account whenever there is one to carry it to
// (see usePothiSync). So a guest builds a real collection, and it is claimed on
// the first sign-in rather than being blocked until then.
//
// The rule it replaced is the reason this file still exists. Every write site
// used to have to REMEMBER to call the gate, and FolderScreen — the screen where
// a pothi is actually edited — forgot, which is how a signed-out user could
// empty their Morning Nitnem. Removing the gate everywhere has the mirror-image
// failure: one screen keeping its check, so a pothi is editable from the Folders
// tab and silently refused from the folder screen. A unit test per screen would
// not find that either; the property is "nobody anywhere does this", and only
// the whole tree can answer it.
//
// It is a coarse check by design. It proves no writer CONSULTS the session or
// the network, not that every branch is reachable — which is exactly the
// failure that actually happens when a gate is added back by hand.

const SRC = path.join(__dirname, "..");

/** The seven transitions that change a pothi and therefore need syncing. */
const MUTATIONS = [
  "addBaniToPothi",
  "removeBaniFromPothi",
  "renamePothi",
  "deletePothi",
  "createPothi",
  "togglePothiPin",
  "setPothiOrder",
];

// `actions.x(` — the DISPATCH, not the action creator's own definition in
// common/actions, which is written as a bare export.
const DISPATCHES = new RegExp(`actions\\.(${MUTATIONS.join("|")})\\(`);

// What a re-introduced gate would look like: reading the sign-in status, or
// asking the network whether it is there.
const CONSULTS_THE_SESSION = /auth\??\.status|isSignedIn|useNetwork\(|isOffline/;

const sourceFiles = () => {
  const out = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
        return;
      }
      if (!/\.(js|jsx)$/.test(entry.name) || /\.test\./.test(entry.name)) return;
      out.push({
        rel: path.relative(SRC, full).split(path.sep).join("/"),
        text: fs.readFileSync(full, "utf8"),
      });
    });
  };
  walk(SRC);
  return out;
};

const writers = () => sourceFiles().filter(({ text }) => DISPATCHES.test(text));

describe("every pothi mutation is ungated", () => {
  it("no file that writes a pothi consults the session or the network", () => {
    const gated = writers()
      .filter(({ text }) => CONSULTS_THE_SESSION.test(text))
      .map(({ rel }) => rel)
      .sort();
    // PothiList is the one allowed reader: it hides PULL-TO-REFRESH while
    // signed out, because there is genuinely no account to pull from. It does
    // not gate a single write.
    expect(gated).toEqual(["Pothi/PothiList.jsx"]);
  });

  it("is dispatched only from the places that are meant to write", () => {
    // A registry, so a NEW write site has to be added here deliberately and
    // looked at rather than being waved through by the check above.
    //
    // Two hooks and four components. `useSetPothiBanis` and `useDeletePothi`
    // exist precisely so the callers that share those jobs cannot word them
    // differently; FolderScreen writes directly only for the multi-select
    // remove, which has no other caller.
    expect(
      writers()
        .map(({ rel }) => rel)
        .sort()
    ).toEqual([
      "FolderScreen/FolderScreen.jsx",
      "Pothi/PothiList.jsx",
      "Pothi/components/AddToPothiSheet.jsx",
      "Pothi/components/CreatePothiSheet.jsx",
      "Pothi/components/PothiActionsSheet.jsx",
      "Pothi/hooks/useDeletePothi.js",
      "Pothi/hooks/useSetPothiBanis.js",
    ]);
  });
});
